import { Request, Response } from 'express';
import { createUserSession, cleanupSession, getSessionById } from '../services/sessionService';

/**
 * Create a new user session
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const session = await createUserSession();
    
    return res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        isNew: session.isNew,
      }
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
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
 * Register session routes
 */
export const getSessionRoutes = () => {
  // Placeholder for future routing extensions
  return [];
}; 