import { Session } from './session';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      params: any;
    }
    
    interface Response {
      status(code: number): Response;
      json(body: any): Response;
      redirect(url: string): Response;
    }
  }
} 