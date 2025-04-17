import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { Session } from '../types/session';
import * as net from 'net';

const execAsync = promisify(exec);

// In-memory store for session data
const sessions: Record<string, Session> = {};

// Port range for Xpra servers
const MIN_PORT = 9000;
const MAX_PORT = 9500;
const usedPorts = new Set<number>();

/**
 * Generate a random username with the specified prefix
 */
const generateUsername = (prefix: string = 'ex10_user_'): string => {
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}${randomSuffix}`;
};

/**
 * Check if a port is in use
 */
const isPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
      server.close();
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, '0.0.0.0');
  });
};

/**
 * Allocate a free port for Xpra
 */
const allocatePort = async (): Promise<number> => {
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    // Skip already tracked ports
    if (usedPorts.has(port)) {
      continue;
    }
    
    // Check if the port is actually in use on the system
    const inUse = await isPortInUse(port);
    if (!inUse) {
      usedPorts.add(port);
      console.log(`Allocated port ${port}`);
      return port;
    } else {
      console.log(`Port ${port} is already in use, skipping`);
      // Mark the port as used in our tracking
      usedPorts.add(port);
    }
  }
  
  throw new Error('No available ports for Xpra server');
};

/**
 * Release a port back to the pool
 */
const releasePort = (port: number): void => {
  usedPorts.delete(port);
};

/**
 * Configure comprehensive network restrictions for a user
 */
const configureNetworkRestrictions = async (username: string, xpraPort: number): Promise<void> => {
  try {
    // Create user-specific chain for outbound traffic
    await execAsync(`sudo iptables -N USER_${username}_OUT`);
    
    // --- OUTBOUND TRAFFIC RULES ---
    
    // Allow connections to their own Xpra port (for client connection)
    await execAsync(`sudo iptables -A USER_${username}_OUT -p tcp --dport ${xpraPort} -j ACCEPT`);
    
    // Allow outbound DNS
    await execAsync(`sudo iptables -A USER_${username}_OUT -p udp --dport 53 -j ACCEPT`);
    
    // Allow outbound HTTP/HTTPS (for browser functionality)
    await execAsync(`sudo iptables -A USER_${username}_OUT -p tcp --dport 80 -j ACCEPT`);
    await execAsync(`sudo iptables -A USER_${username}_OUT -p tcp --dport 443 -j ACCEPT`);
    
    // Block access to all other Xpra ports
    await execAsync(`sudo iptables -A USER_${username}_OUT -p tcp --match multiport --dports 9000:9500 -j REJECT`);
    
    // --- APPLY CHAINS TO USER TRAFFIC ---
    
    // Apply outbound chain to the user's outgoing traffic (owner match works in OUTPUT)
    await execAsync(`sudo iptables -A OUTPUT -m owner --uid-owner ${username} -j USER_${username}_OUT`);
    
    console.log(`Configured network restrictions for ${username} with access to port ${xpraPort}`);
  } catch (error) {
    console.error(`Failed to configure network restrictions for ${username}:`, error);
    throw error;
  }
};

/**
 * Clean up network restrictions for a user
 */
const cleanupNetworkRestrictions = async (username: string): Promise<void> => {
  try {
    // Remove the referencing rule
    await execAsync(`sudo iptables -D OUTPUT -m owner --uid-owner ${username} -j USER_${username}_OUT 2>/dev/null || true`);
    
    // Flush and delete the chain
    await execAsync(`sudo iptables -F USER_${username}_OUT 2>/dev/null || true`);
    await execAsync(`sudo iptables -X USER_${username}_OUT 2>/dev/null || true`);
    
    console.log(`Cleaned up network restrictions for ${username}`);
  } catch (error) {
    console.error(`Error cleaning up network restrictions for ${username}:`, error);
  }
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
    // Configure network restrictions for the user
    await configureNetworkRestrictions(username, port);
    
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
      // Add the "|| true" to make the command succeed even if no processes are found
      await execAsync(`sudo pkill -f "xpra.*${username}" || true`);
      console.log(`Stopped Xpra server for ${username}`);
    } catch (error) {
      console.error(`Error stopping Xpra server for ${username}:`, error);
    }
    
    // 2. Kill all processes for this user
    try {
      // Add the "|| true" to make the command succeed even if no processes are found
      await execAsync(`sudo pkill -9 -u ${username} || true`);
      console.log(`Killed all processes for user ${username}`);
    } catch (error) {
      console.error(`Error killing processes for ${username}:`, error);
    }
    
    // 3. Clean up network restrictions
    try {
      await cleanupNetworkRestrictions(username);
    } catch (error) {
      console.error(`Error cleaning up network restrictions for ${username}:`, error);
    }
    
    // 4. Delete the Linux user
    try {
      await execAsync(`sudo userdel -r ${username}`);
      console.log(`Deleted Linux user ${username}`);
    } catch (error) {
      console.error(`Error deleting Linux user ${username}:`, error);
    }
    
    // 5. Release the port
    releasePort(xpraPort);
    console.log(`Released port ${xpraPort}`);
    
    // 6. Remove the session from memory
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
  const xpraPort = await allocatePort();
  
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