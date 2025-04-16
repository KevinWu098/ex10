import { Request, Response } from 'express';
import { createUserSession, getSessionById } from '../services/sessionService';
import { Session } from '../types/session';

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
 * Get session by ID - redirects to the session's xpra endpoint
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const session = await getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Redirect to the session's xpra endpoint
    return res.redirect(`/session/${id}/xpra`);
  } catch (error: any) {
    console.error('Error getting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get session',
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