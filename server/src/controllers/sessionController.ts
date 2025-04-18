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

      sendUpdate('running', { message: 'Copying companion extension' });
      await execAsync(
        `cp -r companion-extension /home/${session.username}/ex10-companion-extension && chown -R ${session.username}:${session.username} /home/${session.username}/ex10-companion-extension`,
        { maxBuffer: 50 * 1024 * 1024 }
      );
      sendUpdate('running', { message: 'Configuring companion extension' });
      
      // Replace the session ID placeholder in background.js
      try {
        await execAsync(
          `sed -i 's/STR_REPLACE_SESSION_ID/${session.id}/g' /home/${session.username}/ex10-companion-extension/background.js`,
          { maxBuffer: 1024 * 1024 }
        );
      } catch (error: any) {
        console.error(`Error configuring companion extension: ${error.message}`);
        sendUpdate('error', { message: `Warning: Failed to configure session ID in companion extension` });
        res.end();
        return;
      }
      
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

    // Patch the libraries to use the companion extension
    try {
      sendUpdate('running', { message: 'Patching libraries' });
      
      // Find all files containing the load-extension pattern
      const { stdout: grepResult } = await execAsync(
        `cd /home/${session.username}/extension && grep -R -n -F -l -- '--load-extension=\${e.join()}' node_modules`,
        { maxBuffer: 5 * 1024 * 1024 }
      );
      
      if (!grepResult.trim()) {
        sendUpdate('running', { message: 'No libraries found needing patching' });
      } else {
        // Process each file that needs patching
        const filesToPatch = grepResult.trim().split('\n');
        sendUpdate('running', { message: `Found ${filesToPatch.length} files to patch` });
        
        for (const filePath of filesToPatch) {
          try {
            // Replace the pattern with the new one that includes companion extension
            await execAsync(
              `cd /home/${session.username}/extension && sed -i 's#--load-extension=\${e.join()}#--load-extension=\${e.join()},/home/${session.username}/ex10-companion-extension#g' "${filePath}"`,
              { maxBuffer: 1024 * 1024 }
            );
            sendUpdate('running', { message: `Patched: ${filePath}` });
          } catch (patchError: any) {
            sendUpdate('running', { message: `Warning: Failed to patch ${filePath}: ${patchError.message}` });
            console.warn(`Failed to patch ${filePath}: ${patchError.message}`);
          }
        }
        
        sendUpdate('running', { message: 'Library patching complete' });
      }
      
      // Find and patch all instances of the port assignment pattern
      sendUpdate('running', { message: 'Patching port handling' });
      
      try {
        // Find all files containing the port assignment pattern
        const { stdout: portGrepResult } = await execAsync(
          `cd /home/${session.username}/extension && grep -R -n -F -l -- 'options.port = Number(options.port);' node_modules`,
          { maxBuffer: 5 * 1024 * 1024 }
        );
        
        if (!portGrepResult.trim()) {
          sendUpdate('running', { message: 'No files found needing port handling patch' });
        } else {
          // Process each file that needs patching
          const portFilesToPatch = portGrepResult.trim().split('\n');
          sendUpdate('running', { message: `Found ${portFilesToPatch.length} files to patch for port handling` });
          
          for (const filePath of portFilesToPatch) {
            try {
              // Replace the pattern with the new one that includes fallback to cleaned string
              await execAsync(
                `cd /home/${session.username}/extension && sed -i 's#options.port = Number(options.port);#options.port = Number(options.port) || Number(options.port.replace(/\\\\D/g, ""));#g' "${filePath}"`,
                { maxBuffer: 1024 * 1024 }
              );
              sendUpdate('running', { message: `Port handling patched: ${filePath}` });
            } catch (patchError: any) {
              sendUpdate('running', { message: `Warning: Failed to patch port handling in ${filePath}: ${patchError.message}` });
              console.warn(`Failed to patch port handling in ${filePath}: ${patchError.message}`);
            }
          }
          
          sendUpdate('running', { message: 'Port handling patching complete' });
        }
      } catch (portPatchError: any) {
        sendUpdate('running', { message: `Warning: Error during port handling patch: ${portPatchError.message}` });
        console.warn(`Error during port handling patch: ${portPatchError.message}`);
        // Continue execution - this is a non-critical patch
      }
    } catch (error: any) {
      sendUpdate('error', { message: `Error patching libraries: ${error.message}` });
      console.error(`Error patching libraries: ${error.message}`);
      res.end();
      return;
    }

    // Start the extension.js development server in the background and save its PID
    sendUpdate('running', { message: 'Starting extension dev server' });

    // First find the active xpra display for this user
    const { stdout: xpraOutput } = await execAsync(
      `sudo -u ${session.username} xpra list | grep LIVE | grep -oP ':\\d+'`,
      { maxBuffer: 1024 * 1024 }
    );
    
    // Extract the display number from the xpra output (should be something like ":0")
    const displayId = xpraOutput.trim();
    
    if (!displayId) {
      sendUpdate('error', { message: 'Failed to find active XPRA display' });
      console.error(`Failed to find active XPRA display for ${session.username}`);
      res.end();
      return;
    }
    
    console.log(`Found active XPRA display ${displayId} for user ${session.username}`);
    
    // Now start the extension dev server with the correct display
    const { stdout } = await execAsync(
      `cd /home/${session.username}/extension && sudo -u ${session.username} bash -c 'DISPLAY=${displayId} nohup pnpm dev --port={${session.xpraPort-1000}} > /home/${session.username}/extension-dev-server.log 2>&1 & echo $!'`,
      { maxBuffer: 1024 * 1024 }
    );
    
    // Store the PID in the session object
    const pid = parseInt(stdout.trim(), 10);
    session.devServerPid = pid;
    
    console.log(`Started extension dev server for ${session.username} with PID ${pid} on display ${displayId}`);
    
    // Wait 2 seconds and check if the process is still running
    sendUpdate('running', { message: 'Checking dev server status' });
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
 * Request body:
 * sessionId: the id of the session
 * code: object containing:
 *   - file_path: path to the file relative to extension directory
 *   - file_content: the content to write to the file
 *   - file_finished: boolean indicating if the file update is completed
 */
export const updateCode = async (req: Request, res: Response) => {
  console.log("updateCode called");
  try {
    const { sessionId, code } = req.body;
    
    // Validate required fields
    if (!sessionId || !code || !code.file_path || code.file_content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, code.file_path, or code.file_content'
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
    let normalizedPath = path.normalize(code.file_path).replace(/^\/+/, '');
    
    // Ensure the path doesn't try to escape the extension directory
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    
    // additional validation (tryna prevent rce vuln when ppl try and mess with the path param)
    if (/[;&|`$><*()!#]/.test(normalizedPath)) {
      return res.status(400).json({
        success: false,
        message: 'Path contains invalid characters'
      });
    }
    
    // Get the full path to the file - escape for shell use
    const baseDir = `/home/${session.username}/extension`;
    const fullPath = path.join(baseDir, normalizedPath);
    const escapedFullPath = fullPath.replace(/'/g, "'\\''"); // Escape single quotes for shell
    
    // Create directory if needed as the session user
    await execAsync(`sudo -u ${session.username} mkdir -p '${path.dirname(escapedFullPath)}'`);
    
    // Check if the file exists before writing
    const fileExists = await execAsync(`sudo -u ${session.username} test -f '${escapedFullPath}' && echo "true" || echo "false"`)
      .then(({stdout}) => stdout.trim() === "true")
      .catch(() => false);
    
    // Write content to a temporary file that only root can access
    const tempFilePath = `/tmp/file_content_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await fs.promises.writeFile(tempFilePath, code.file_content);
    
    try {
      // Copy the file to the destination as the user
      // If we try to write directly it becomes trivial to inject arbitrary commands and run it as root
      // tbh theres probably vulns elsewhere but this is an mvp lmao
      await execAsync(`cat "${tempFilePath}" | sudo -u ${session.username} tee '${escapedFullPath}' > /dev/null`);
    } finally {
      // Always clean up the temporary file
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    
    return res.status(200).json({
      success: true,
      message: `File ${fileExists ? 'updated' : 'created'} successfully`,
      file_finished: code.file_finished
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