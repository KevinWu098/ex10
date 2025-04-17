/**
 * Represents a user session with an Xpra server
 */
export interface Session {
  /** Unique session identifier */
  id: string;
  
  /** Linux username for this session */
  username: string;
  
  /** Port number for the Xpra server */
  xpraPort: number;
  
  /** Whether this is a newly created session */
  isNew: boolean;
  
  /** Session creation timestamp */
  createdAt: Date;
  
  /** Process ID of the extension dev server (if running) */
  devServerPid?: number;
} 