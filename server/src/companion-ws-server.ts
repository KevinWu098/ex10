import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { getSessionById } from './services/sessionService';
import * as fs from 'fs';
import * as https from 'https';

interface SSLConfig {
  enabled: boolean;
  certPath: string;
  keyPath: string;
}

interface Client {
  socket: any;
  sessionId: string;
  authenticated: boolean;
  lastPing?: number;
}

let wss: WebSocketServer | null = null;
const clients: Map<string, Client> = new Map();
let connectionCheckInterval: NodeJS.Timeout | null = null;

export function startCompanionServer(sslConfig?: SSLConfig) {
  if (wss) return; // Already started
  
  const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 4926;

  if (sslConfig?.enabled) {
    try {
      // Create HTTPS server with SSL
      const httpsOptions = {
        key: fs.readFileSync(sslConfig.keyPath),
        cert: fs.readFileSync(sslConfig.certPath)
      };
      
      const httpsServer = https.createServer(httpsOptions);
      wss = new WebSocketServer({ server: httpsServer });
      
      // Start HTTPS server for secure WebSockets
      httpsServer.listen(WS_PORT, () => {
        console.log(`Secure Companion WebSocket server (WSS) started on port ${WS_PORT}`);
      });
    } catch (error) {
      console.error('Failed to load SSL certificates for WebSocket server:', error);
      console.warn('Falling back to insecure WebSocket server');
      wss = new WebSocketServer({ port: WS_PORT });
      console.log(`Companion WebSocket server (WS) started on port ${WS_PORT}`);
    }
  } else {
    // Create regular WebSocket server without SSL
    wss = new WebSocketServer({ port: WS_PORT });
    console.log(`Companion WebSocket server (WS) started on port ${WS_PORT}`);
  }

  wss.on('connection', (socket, request: IncomingMessage) => {
    const client: Client = {
      socket,
      sessionId: '',
      authenticated: false,
      lastPing: Date.now()
    };
    
    // Set timeout for authentication
    const authTimeout = setTimeout(() => {
      if (!client.authenticated) {
        console.log('Client failed to authenticate in time');
        socket.close(1008, 'Authentication timeout');
      }
    }, 5000);
    
    socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        
        // Update last ping time for any message
        client.lastPing = Date.now();
        
        // Handle initial authentication
        if (!client.authenticated) {
          if (data.type === 'extension-connected' && data.sessionId) {
            // Verify the session ID
            const session = getSessionById(data.sessionId);
            if (session) {
              client.sessionId = data.sessionId;
              client.authenticated = true;
              clients.set(client.sessionId, client);
              
              clearTimeout(authTimeout);
              socket.send(JSON.stringify({ type: 'auth-success' }));
              console.log(`Client authenticated with session ID: ${client.sessionId}`);
              
              // Test feature: Automatically request DOM content after authing to see if dom grabbing works
            //   setTimeout(() => {
            //     console.log(`Testing: Requesting DOM content from newly authenticated client ${client.sessionId}`);
            //     socket.send(JSON.stringify({ type: 'get-dom-content' }));
            //   }, 10000);
            } else {
              console.log('Invalid session ID provided');
              socket.close(1008, 'Invalid session ID');
            }
          } else {
            console.log('First message was not authentication');
            socket.close(1008, 'Authentication required');
          }
          return;
        }
        // handle pings (used to keep the service worker alive)
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        
        // Handle messages from authenticated clients
        if (data.type === 'dom-content') {
          // Handle DOM content received from extension
        //   console.log(`Received DOM content from session ${client.sessionId}`);
        //   console.log(data.html);
        //   console.log(`HTML content size: ${data.html ? data.html.length : 0} characters`);
          // Process the DOM content as needed
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
        socket.close(1008, 'Invalid message format');
      }
    });
    
    socket.on('close', () => {
      if (client.sessionId) {
        clients.delete(client.sessionId);
        console.log(`Client disconnected: ${client.sessionId}`);
      }
    });
  });
  
  // Start connection check interval
  if (!connectionCheckInterval) {
    connectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds
      
      clients.forEach((client, sessionId) => {
        // Check if client hasn't sent any message in the timeout period
        if (client.lastPing && now - client.lastPing > timeout) {
          console.log(`Client ${sessionId} timed out (no ping in ${timeout/1000}s)`);
          try {
            client.socket.close(1001, 'Connection timeout');
          } catch (err) {
            console.error('Error closing timed out connection:', err);
          }
          clients.delete(sessionId);
        }
      });
    }, 30000); // Check every 30 seconds
  }
  
  return wss;
}

// Clean up on server shutdown
export function stopCompanionServer() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  
  if (wss) {
    wss.close();
    wss = null;
    console.log('Companion WebSocket server stopped');
  }
  
  clients.clear();
}

// Function to request DOM content from a specific client
export function requestDomFromClient(sessionId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = clients.get(sessionId);
    
    if (!client || !client.authenticated) {
      reject(new Error('Client not found or not authenticated'));
      return;
    }
    
    // Set up a one-time listener for the DOM content response
    const messageHandler = (msg: any) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'dom-content' && data.html) {
          client.socket.removeListener('message', messageHandler);
          clearTimeout(timeout);
          resolve(data.html);
        }
        if (data.type === 'dom-content-error') {
          client.socket.removeListener('message', messageHandler);
          clearTimeout(timeout);
          reject(new Error(data.error));
        }
      } catch (error) {
        // Don't reject here, as this might be a different message
      }
    };
    
    // Set timeout for response
    const timeout = setTimeout(() => {
      client.socket.removeListener('message', messageHandler);
      reject(new Error('Timeout waiting for DOM content'));
    }, 5000);
    
    // Add the temporary listener
    client.socket.on('message', messageHandler);
    
    // Request the DOM content
    client.socket.send(JSON.stringify({ type: 'get-dom-content' }));
  });
}
