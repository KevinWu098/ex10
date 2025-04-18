import express from 'express';
import { createServer, ServerResponse } from 'http';
import { createSession, terminateSession, updateCode } from './controllers/sessionController';
import { getSessionById, cleanupAllSessions } from './services/sessionService';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Socket } from 'net';
import { parse as parseUrl } from 'url';
import path from 'path';
import { requestDomFromClient, startCompanionServer, stopCompanionServer } from './companion-ws-server';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Increase max listeners to prevent warnings
httpServer.setMaxListeners(20);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Routes
app.get('/createSession', createSession);
app.delete('/session/:id', terminateSession);
app.post('/updateCode', updateCode);

// DOM content retrieval endpoint
app.get('/getSessionDom/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    try {
      const domContent = await requestDomFromClient(id);
      return res.status(200).json({
        success: true,
        dom: domContent
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve DOM content',
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('DOM retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// store session proxies for each session id so we don't recreate them on each request
const sessionProxies: Record<string, any> = {};

// Proxy to xpra server instead of redirecting
app.use('/session/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // If it's the exact session path with no trailing parts, redirect to index.html
    if (req.path === '/' || req.path === '') {
      return res.redirect(`/session/${id}/index.html`);
    }
    
    // Create a proxy middleware if it doesn't exist for this session
    // Important: Set ws: false to disable automatic WebSocket handling
    if (!sessionProxies[id]) {
      sessionProxies[id] = createProxyMiddleware({
        target: `http://localhost:${session.xpraPort}`,
        changeOrigin: true,
        ws: false, // Disable automatic WebSocket handling
        secure: false,
        pathRewrite: {
          [`^/session/${id}`]: ''
        },
        //logger: console,
        on: {
          error: (err, req, res, target) => {
            console.error('Proxy error:', err);
            // Check if res is a ServerResponse (HTTP) and not a Socket (WebSocket)
            if (res instanceof ServerResponse) {
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
              }
            } else if (res instanceof Socket) {
              // Handle WebSocket error
              if (!res.destroyed) {
                res.destroy();
              }
            }
          }
        }
      });
    }
    
    // Apply the proxy middleware
    return sessionProxies[id](req, res, next);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to proxy to xpra session',
      error: error.message
    });
  }
});

// Manually handle WebSocket upgrade events
httpServer.on('upgrade', async (req, socket, head) => {
  try {
    const pathname = parseUrl(req.url || '').pathname || '';
    const matches = pathname.match(/^\/session\/([^\/]+)/);
    
    if (!matches) {
      socket.destroy();
      return;
    }
    
    const sessionId = matches[1];
    
    // Check if session exists
    const session = await getSessionById(sessionId);
    if (!session) {
      console.error(`WebSocket upgrade: Session ${sessionId} not found`);
      socket.destroy();
      return;
    }
    
    // Create proxy if it doesn't exist yet
    if (!sessionProxies[sessionId]) {
      console.error(`WebSocket upgrade: Proxy for session ${sessionId} not initialized yet`);
      socket.destroy();
      return;
    }
    
    // Use the proxy's upgrade function to handle the WebSocket
    console.log(`Upgrading WebSocket for session: ${sessionId}`);
    sessionProxies[sessionId].upgrade(req, socket, head);
    
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    if (!socket.destroyed) {
      socket.destroy();
    }
  }
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the companion WebSocket server
  startCompanionServer();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  // Stop the companion WebSocket server
  stopCompanionServer();
  // Close HTTP server
  httpServer.close();
  // Cleanup will be handled by the handlers in sessionService.ts
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  // Stop the companion WebSocket server
  stopCompanionServer();
  // Close HTTP server
  httpServer.close();
  // Cleanup will be handled by the handlers in sessionService.ts
});

export default app; 