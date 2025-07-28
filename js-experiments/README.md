# Extension.js with Xpra Remote Access

This setup allows you to develop browser extensions using [Extension.js](https://extension.js.org) with remote browser access via Xpra.

## Features

-   **Cross-browser development** with Extension.js
-   **Remote browser access** via Xpra web client
-   **Hot reloading** during development
-   **Clean, minimal setup** that works with extension.js defaults

## Quick Start

```bash
# Start the development environment
docker-compose up

# Access the browser remotely
open http://localhost:10000
```

## How It Works

1. **Display Setup**: Creates a virtual X11 display using Xvfb
2. **Extension.js**: Runs `extension dev` which automatically spawns Chromium with the extension loaded
3. **Remote Access**: Xpra captures the display and serves it via web interface
4. **Hot Reloading**: Extension.js handles automatic reloading when files change

## Extension Configuration

The extension uses a simplified config in `extension/extension.config.js`:

```js
module.exports = {
    browser: "chrome",
    browserFlags: [
        "--no-sandbox", // Required for Docker
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu", // Better for virtual displays
        "--remote-debugging-port=9222",
    ],
};
```

## Architecture

Extension.js handles the browser lifecycle automatically:

-   Uses its built-in `RunChromiumPlugin` to spawn Chromium
-   Applies default flags optimized for development
-   Manages extension loading and hot reloading
-   Handles process cleanup

This setup works **with** extension.js rather than against it, allowing the framework to handle what it does best while adding remote access capabilities.

## Development

-   **Extension code**: Edit files in `extension/`
-   **Manifest**: Modify `extension/manifest.json`
-   **Hot reload**: Changes are automatically detected
-   **Remote access**: Browser runs in container, accessible at `localhost:10000`

## Browser Features

The extension includes:

-   **Background service worker** for extension logic
-   **Content script** that shows visual feedback on pages
-   **Hot reload support** for rapid development

## Troubleshooting

If the browser doesn't start:

1. Check container logs: `docker-compose logs`
2. Verify display is ready: logs should show "Starting Extension.js..."
3. Extension.js will automatically restart if it crashes

The setup is designed to be robust and self-healing.
