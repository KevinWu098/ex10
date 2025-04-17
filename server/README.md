# Ex10 Session Management

## System Overview

Ex10 Session Management is a server application that provides isolated browser environments for extension development. The system:

1. Creates isolated Linux user accounts for each session
2. Runs Xpra servers to provide browser access
3. Sets up browser extension development environments
4. Implements network restrictions for security
5. Provides an API for session management and code updates

## Implementation Details

### Session Creation

When a user requests a new session via `/createSession`:

1. A unique session ID is generated using secure random bytes
2. A restricted Linux user is created with:
   - Random username (prefixed with `ex10_user_`)
   - Disabled password authentication
   - Restricted login shell (`/usr/sbin/nologin`)
   - Secure home directory permissions
3. Network restrictions are configured using iptables:
   - Allow connections to the session's Xpra port
   - Allow outbound DNS (port 53)
   - Allow outbound HTTP/HTTPS (ports 80/443)
   - Block access to all other Xpra ports
4. A unique port is allocated for the Xpra server (range 9000-9500)
5. An Xpra server is started for the user
6. A browser extension development environment is set up:
   - Extension template is copied to user's home directory
   - Dependencies are installed
   - Development server is started
7. The session details are stored in memory

### Session Access

When a user accesses their session:

1. Via `/session/:id`:
   - The session ID is validated
   - The user is redirected to the session's index.html

2. The system creates a proxy to the Xpra server
   - Uses http-proxy-middleware to forward requests
   - Handles both HTTP and WebSocket traffic
   - Rewrites paths to remove the `/session/:id` prefix

### Code Management

The system provides an API for managing code in the extension directory:

- `POST /updateCode` - Update a file in the extension directory
  - Parameters: `sessionId`, `filePath`, `content`
  - Path validation prevents directory traversal attacks
  - File ownership is set to the session user

### Session Termination

When a session is terminated via `/session/:id` (DELETE):

1. The extension development server process is stopped
2. The Xpra server is terminated
3. All user processes are killed
4. Network restrictions are removed
5. The Linux user account is deleted
6. The allocated port is released
7. Session information is removed from memory

### Cleanup and Monitoring

The system includes:

1. Process monitoring to detect crashed development servers
2. Signal handlers for graceful shutdown (SIGINT, SIGTERM)
3. Automatic cleanup of all sessions on server shutdown

## API Endpoints

- `GET /createSession` - Create a new session (returns streaming updates)
- `DELETE /session/:id` - Terminate a session
- `POST /updateCode` - Update code in the extension directory
- `GET /session/:id` - Access the session UI
- `GET /session/:id/*` - Access resources within the session

## Security Considerations

- Each session runs under a separate Linux user account
- Network restrictions are enforced using iptables
- Sessions are isolated from each other
- File operations are performed with proper ownership and permissions
- Path validation prevents directory traversal attacks

## Extensions Development

The system creates a browser extension development environment for each session:
- Uses a template extension with manifest.json
- Installs necessary dependencies
- Runs a development server
- Provides live updates for code changes

## Cleanup Process

Session resources are cleaned up:
- On explicit termination request
- On server shutdown
- After session crashes (monitored periodically) 