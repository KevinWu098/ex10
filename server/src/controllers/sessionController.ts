import { Request, Response } from 'express';
import { createUserSession } from '../services/sessionService';

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
 * Register session routes
 */
export const getSessionRoutes = () => {
  // Placeholder for future routing extensions
  return [];
}; 