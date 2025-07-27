#!/bin/bash
set -e

echo "🚀 Starting Extension.js with Xpra shadow mode..."

# Ensure extension directory exists
mkdir -p /tmp/extension

# Option 2: Use xpra shadow mode to capture existing display
echo "📺 Starting Xvfb display server..."
Xvfb :100 -screen 0 1920x1080x24 -ac &
XVFB_PID=$!
sleep 2

# Start the browser first on the Xvfb display
echo "🌐 Starting Extension.js browser..."
cd /app
DISPLAY=:100 npx extension@latest dev /tmp/extension --chromium-binary=/usr/bin/chromium --polyfill &
EXTENSION_PID=$!
echo "Extension.js started with PID: $EXTENSION_PID"

# Wait for browser to fully initialize
sleep 8

# Use xpra shadow to capture and stream the existing display
echo "📺 Starting Xpra shadow to capture display :100..."
xpra shadow :100 \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    --daemon=no \
    --notifications=no \
    --bell=no &

XPRA_PID=$!

# Wait for Xpra to start
sleep 3

echo "✅ Setup complete!"
echo "🌐 Access via Xpra HTML client at: http://localhost:10000"
echo "📝 Extension directory: /tmp/extension"
echo "🔧 Extension.js PID: $EXTENSION_PID"
echo "🔧 Xpra PID: $XPRA_PID"
echo "🔧 Using shadow mode - more reliable capture"

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    kill $EXTENSION_PID 2>/dev/null || true
    kill $XPRA_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Keep the container running and monitor processes
while true; do
    if ! kill -0 $EXTENSION_PID 2>/dev/null; then
        echo "❌ Extension.js process died, restarting..."
        cd /app
        DISPLAY=:100 npx extension@latest dev /tmp/extension --chromium-binary=/usr/bin/chromium --polyfill &
        EXTENSION_PID=$!
        echo "🔄 Extension.js restarted with PID: $EXTENSION_PID"
        sleep 5  # Give browser time to start before xpra tries to capture
    fi
    
    if ! kill -0 $XPRA_PID 2>/dev/null; then
        echo "❌ Xpra process died, restarting shadow..."
        xpra shadow :100 \
            --bind-tcp=0.0.0.0:10000 \
            --html=on \
            --daemon=no \
            --notifications=no \
            --bell=no &
        XPRA_PID=$!
        echo "🔄 Xpra shadow restarted with PID: $XPRA_PID"
    fi
    
    sleep 10
done 