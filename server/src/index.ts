import express from 'express';
import { createServer } from 'http';
import { createSession } from './controllers/sessionController';
import { getSessionById } from './services/sessionService';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Socket } from 'net';
import { IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';

const app = express();
const httpServer = createServer(app);

// Increase max listeners to prevent warnings
httpServer.setMaxListeners(20);

// Middleware
app.use(express.json());

// Routes
app.get('/createSession', createSession);
app.post('/updateCode', (req, res) => {
  // Placeholder for future implementation
  res.status(200).json({ message: 'updateCode endpoint placeholder' });
});

// Store WebSocket proxies by session ID to avoid recreating them
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
    // Make sure we only create one proxy per session so it doesn't have a stroke and create an insane amount of listeners
    if (!sessionProxies[id]) {
      sessionProxies[id] = createProxyMiddleware({
        target: `http://localhost:${session.xpraPort}`,
        changeOrigin: true,
        ws: true,
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

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 