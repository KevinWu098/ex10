import express from 'express';
import { createServer } from 'http';
import { createSession, getSession } from './controllers/sessionController';
import { getSessionById } from './services/sessionService';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());

// Routes
app.get('/createSession', createSession);
app.get('/session/:id', getSession);
app.post('/updateCode', (req, res) => {
  // Placeholder for future implementation
  res.status(200).json({ message: 'updateCode endpoint placeholder' });
});

// Direct redirect to xpra port instead of proxying
app.get('/session/:id/xpra', async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Redirect to the actual xpra port
    return res.redirect(`http://localhost:${session.xpraPort}`);
  } catch (error: any) {
    console.error('Redirect error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to redirect to xpra session',
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