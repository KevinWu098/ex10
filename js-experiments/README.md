# Extension.js with Xpra Streaming

This setup allows you to develop browser extensions using Extension.js while streaming the development environment through Xpra to port 10000.

## What's Included

-   **Extension.js**: Modern browser extension development framework
-   **Xpra**: X11 forwarding to stream the development environment via HTML5
-   **Sample Extension**: A basic Chrome extension to get started

## Quick Start

### 1. Build and Run

```bash
cd js-experiments
docker-compose up --build
```

### 2. Access the Development Environment

Open your browser and navigate to:

```
http://localhost:10000
```

You'll see the Xpra HTML5 client with Chromium running Extension.js in development mode.

### 3. Extension Development

The sample extension is located in `./extension/` and includes:

-   `manifest.json` - Extension manifest
-   `popup.html/js` - Extension popup interface
-   `background.js` - Service worker
-   `content.js` - Content script

Files are automatically synced with the container via Docker volumes.

## Available Commands

### Local Development (Outside Container)

```bash
# Install dependencies
pnpm add extension@latest --save-dev

# Build extension
npm run build

# Start development server
npm run dev

# Start extension (after build)
npm start
```

### Container Commands

```bash
# Build and start with Xpra streaming
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# Stop services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose up --build
```

## How It Works

1. **Docker Container**: Runs Debian with Node.js, Chromium, and Xpra
2. **Extension.js**: Provides hot-reload development for browser extensions
3. **Xpra Server**: Captures the X11 display and serves it via HTML5 on port 10000
4. **Volume Mounting**: `./extension` directory is mounted to `/tmp/extension` in container

## Extension.js Features

-   **Hot Reload**: Automatic extension reloading during development
-   **Cross-Browser**: Supports Chrome, Firefox, and other browsers
-   **Modern Tooling**: Built-in TypeScript support and modern build pipeline
-   **Polyfills**: Automatic polyfills for cross-browser compatibility

## Accessing the Extension

1. Once the container is running, visit `http://localhost:10000`
2. You'll see Chromium with your extension loaded
3. Click the extension icon in the toolbar to test the popup
4. Check the browser console for content script logs
5. Make changes to files in `./extension/` and see them hot-reload

## Ports

-   **10000**: Xpra HTML5 client (main access point)
-   **3001**: Additional server port (if needed)
-   **8000**: Additional server port (if needed)

## Development Tips

-   **Extension Files**: Edit files in `./extension/` on your host machine
-   **Hot Reload**: Extension.js automatically reloads when files change
-   **Debugging**: Use Chromium dev tools within the Xpra session
-   **Logs**: Check `docker-compose logs` for container output

## Troubleshooting

### Container Won't Start

```bash
# Check for port conflicts
docker-compose down
docker-compose up --build
```

### Xpra Not Accessible

-   Ensure port 10000 is not blocked by firewall
-   Try accessing `http://localhost:10000` directly

### Extension Not Loading

-   Check that `./extension/manifest.json` is valid
-   Verify Extension.js logs in container output

## File Structure

```
js-experiments/
├── docker-compose.yml          # Docker services configuration
├── Dockerfile.extensionjs      # Container setup
├── package.json               # Node.js dependencies and scripts
├── start.sh                   # Container startup script
├── extension/                 # Your extension source code
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── content.js
└── README.md                  # This file
```
