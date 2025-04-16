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
    const cmd = `sudo -u ${username} xpra start :100 --bind-tcp=0.0.0.0:${port} --start=chromium-browser --html=on`;
    
    await execAsync(cmd);
    
    console.log(`Started Xpra server for ${username} on port ${port}`);
  } catch (error) {
    console.error(`Failed to start Xpra server for ${username}:`, error);
    throw error;
  }
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