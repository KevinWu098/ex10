import { exec } from 'child_process';
import { Request, Response } from 'express';
import { createUserSession, cleanupSession, getSessionById } from '../services/sessionService';
import { promisify } from 'util';
import { json } from 'stream/consumers';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Create a new user session with streaming updates
 */
export const createSession = async (req: Request, res: Response) => {
  // Set headers for streaming response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Helper function to send updates to the client
  const sendUpdate = (status: string, data: any) => {
    res.write(JSON.stringify({ status, data }) + '\n');
    // Also log to console for server-side tracking
    //console.log(`[${status}]`, message);
  };

  try {
    sendUpdate('running', { message: 'Provisioning new container' });
    
    // Create base session (with user account and xpra server and network restrictions)
    const session = await createUserSession();
    sendUpdate('running', { message: 'Base container created', username: session.username });

    // Set up browser extension from template folder
    try {
      sendUpdate('running', { message: 'Copying extension template' });
      await execAsync(
        `cp -r extension-template /home/${session.username}/extension && chown -R ${session.username}:${session.username} /home/${session.username}/extension`,
        { maxBuffer: 50 * 1024 * 1024 }
      );
      
      // Install dependencies as the user
      sendUpdate('running', { message: 'Installing modules' });
      await execAsync(
        `cd /home/${session.username}/extension && sudo -u ${session.username} pnpm install`,
        { maxBuffer: 50 * 1024 * 1024 }
      );
      sendUpdate('running', { message: 'Modules installed' });
    } catch (error: any) {
      sendUpdate('error', { message: `Error setting up extension: ${error.message}` });
      console.error(`Error setting up extension: ${error.message}`);
      res.end();
      return;
    }
    
    // Start the extension.js development server in the background and save its PID
    sendUpdate('running', { message: 'Starting extension dev server' });
    const { stdout } = await execAsync(
      `cd /home/${session.username}/extension && sudo -u ${session.username} bash -c 'nohup pnpm dev > /home/${session.username}/extension-dev-server.log 2>&1 & echo $!'`,
      { maxBuffer: 1024 * 1024 }
    );
    
    // Store the PID in the session object
    const pid = parseInt(stdout.trim(), 10);
    session.devServerPid = pid;
    
    console.log(`Started extension dev server for ${session.username} with PID ${pid}`);
    
    // Wait 2 seconds and check if the process is still running
    sendUpdate('running', { message: 'Verifying dev server is running...' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const { stdout: psCheck } = await execAsync(
        `ps -p ${pid} -o pid= || echo ""`,
        { maxBuffer: 1024 * 1024 }
      );
      
      if (!psCheck.trim()) {
        sendUpdate('error', { message: `Dev server failed to start` });
        console.error(`Dev server process ${pid} failed to start properly for ${session.username}`);
        
        // Attempt to read log for error information
        const { stdout: logContents } = await execAsync(
          `tail -n 20 /home/${session.username}/extension-dev-server.log 2>/dev/null || echo "Log not available"`,
          { maxBuffer: 1024 * 1024 }
        );
        
        console.error(`Dev server log (last 20 lines):\n${logContents}`);
        res.end();
        return;
        
        // Clear PID from session as it's not running
        session.devServerPid = undefined;
        
        // We don't fail the session creation - the user can still use the session without the dev server
        console.warn(`Continuing session creation without dev server for ${session.username}`);
      } else {
        sendUpdate('running', { message: `Dev server running` });
        console.log(`Confirmed dev server for ${session.username} is running with PID ${pid}`);
      }
    } catch (error: any) {
      sendUpdate('error', { message: `Dev server status check failed` });
      console.error(`Error checking dev server status for ${session.username}:`, error);
      res.end();
      return;
    }

    // Send final completion message
    console.log(`Session creation complete for ${session.username} (${session.id})`);
    sendUpdate('complete', {
      sessionId: session.id,
      isNew: session.isNew,
      message: 'Session creation complete'
    });
    
    // End the response stream
    res.end();
  } catch (error: any) {
    console.error('Error creating session:', error);
    sendUpdate('error', { 
      message: 'Failed to create session', 
      error: error.message 
    });
    res.end();
  }
};

/**
 * Clean up a user session
 */
export const terminateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if session exists
    const session = getSessionById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const success = await cleanupSession(id);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Session terminated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to terminate session completely'
      });
    }
  } catch (error: any) {
    console.error('Error terminating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to terminate session',
      error: error.message
    });
  }
};

/**
 * Update code in the extension directory
 * 
 * Query params:
 * sessionId: the id of the session
 * filePath: the path to the file to update
 * content: the content to update the file with
 */
export const updateCode = async (req: Request, res: Response) => {
  try {
    const { sessionId, filePath, content } = req.body;
    
    // Validate required fields
    if (!sessionId || !filePath || content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, filePath, or content'
      });
    }
    
    // Check if session exists
    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Normalize and validate the file path to prevent directory traversal
    let normalizedPath = path.normalize(filePath).replace(/^\/+/, '');
    
    // Ensure the path doesn't try to escape the extension directory
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    
    // Get the full path to the file
    const fullPath = path.join(`/home/${session.username}/extension`, normalizedPath);
    
    // Check if the file exists before writing
    const fileExists = await fs.promises.access(fullPath)
      .then(() => true)
      .catch(() => false);
    
    // Write the file
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content);
    
    // Change ownership to the session user
    await execAsync(`chown ${session.username}:${session.username} "${fullPath}"`);
    
    return res.status(200).json({
      success: true,
      message: `File ${fileExists ? 'updated' : 'created'} successfully`,
    });
  } catch (error: any) {
    console.error('Error updating code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update code',
      error: error.message
    });
  }
};

/**
 * Register session routes
 */
export const getSessionRoutes = () => {
  // Placeholder for future routing extensions
  return [];
}; 