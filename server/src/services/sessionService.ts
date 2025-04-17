import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { Session } from '../types/session';

const execAsync = promisify(exec);

// In-memory store for session data
const sessions: Record<string, Session> = {};

// Port range for Xpra servers
const MIN_PORT = 9000;
const MAX_PORT = 9100;
const usedPorts = new Set<number>();

/**
 * Generate a random username with the specified prefix
 */
const generateUsername = (prefix: string = 'ex10_user_'): string => {
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}${randomSuffix}`;
};

/**
 * Allocate a free port for Xpra
 */
const allocatePort = (): number => {
  let port = MIN_PORT;
  while (usedPorts.has(port) && port <= MAX_PORT) {
    port++;
  }
  
  if (port > MAX_PORT) {
    throw new Error('No available ports for Xpra server');
  }
  
  usedPorts.add(port);
  return port;
};

/**
 * Release a port back to the pool
 */
const releasePort = (port: number): void => {
  usedPorts.delete(port);
};

/**
 * Create a new Linux user with restrictions
 */
const createLinuxUser = async (username: string): Promise<void> => {
  try {
    // Create user with no password and no home directory data
    await execAsync(`sudo adduser ${username} --disabled-password --gecos ""`);
    
    // Restrict login shell
    await execAsync(`sudo usermod -s /usr/sbin/nologin ${username}`);
    
    // Set proper permissions on home directory
    await execAsync(`sudo chmod 700 /home/${username}`);
    
    console.log(`Created new Linux user: ${username}`);
  } catch (error) {
    console.error(`Failed to create Linux user ${username}:`, error);
    throw error;
  }
};

/**
 * Start an Xpra server for a user session
 */
const startXpraServer = async (username: string, port: number): Promise<void> => {
  try {
    // Command to start Xpra server with browser
    // We need --xvfb="Xvfb -nolisten unix -nolisten tcp" to avoid really annoying X11 forwarding issues with silent fails (especially on WSL)
    const cmd = `sudo -u ${username} xpra start --bind-tcp=0.0.0.0:${port} --start=chromium-browser --html=on --xvfb="Xvfb -nolisten unix -nolisten tcp"`;
    
    await execAsync(cmd);
    
    console.log(`Started Xpra server for ${username} on port ${port}`);
  } catch (error) {
    console.error(`Failed to start Xpra server for ${username}:`, error);
    throw error;
  }
};

/**
 * Clean up a user session
 */
export const cleanupSession = async (sessionId: string): Promise<boolean> => {
  const session = sessions[sessionId];
  
  if (!session) {
    console.warn(`Session ${sessionId} not found for cleanup`);
    return false;
  }
  
  try {
    const { username, xpraPort } = session;
    
    console.log(`Cleaning up session ${sessionId} for user ${username}`);
    
    // 1. Kill the Xpra server
    try {
      await execAsync(`sudo pkill -f "xpra.*${username}"`);
      console.log(`Stopped Xpra server for ${username}`);
    } catch (error) {
      console.error(`Error stopping Xpra server for ${username}:`, error);
    }
    
    // 2. Kill all processes for this user
    try {
      await execAsync(`sudo pkill -9 -u ${username}`);
      console.log(`Killed all processes for user ${username}`);
    } catch (error) {
      console.error(`Error killing processes for ${username}:`, error);
    }
    
    // 3. Delete the Linux user
    try {
      await execAsync(`sudo userdel -r ${username}`);
      console.log(`Deleted Linux user ${username}`);
    } catch (error) {
      console.error(`Error deleting Linux user ${username}:`, error);
    }
    
    // 4. Release the port
    releasePort(xpraPort);
    console.log(`Released port ${xpraPort}`);
    
    // 5. Remove the session from memory
    delete sessions[sessionId];
    
    return true;
  } catch (error) {
    console.error(`Failed to clean up session ${sessionId}:`, error);
    return false;
  }
};

/**
 * Clean up all active sessions
 */
export const cleanupAllSessions = async (): Promise<void> => {
  console.log(`Cleaning up ${Object.keys(sessions).length} active sessions...`);
  
  const cleanupPromises = Object.keys(sessions).map(sessionId => 
    cleanupSession(sessionId)
  );
  
  await Promise.allSettled(cleanupPromises);
  
  console.log('All sessions cleaned up');
};

/**
 * Create a new user session
 */
export const createUserSession = async (): Promise<Session> => {
  // Generate a unique session ID
  const sessionId = randomBytes(16).toString('hex');
  
  // Check if session already exists
  if (sessions[sessionId]) {
    return {
      ...sessions[sessionId],
      isNew: false
    };
  }
  
  // Generate username and allocate port
  const username = generateUsername();
  const xpraPort = allocatePort();
  
  // Create Linux user
  await createLinuxUser(username);
  
  // Start Xpra server
  await startXpraServer(username, xpraPort);
  
  // Create and store session
  const session: Session = {
    id: sessionId,
    username,
    xpraPort,
    isNew: true,
    createdAt: new Date()
  };
  
  sessions[sessionId] = session;
  
  return session;
};

/**
 * Get a session by ID
 */
export const getSessionById = (id: string): Session | undefined => {
  return sessions[id];
};

// Register process handlers to clean up sessions on exit
process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up sessions before exit...');
  await cleanupAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up sessions before exit...');
  await cleanupAllSessions();
  process.exit(0);
}); 