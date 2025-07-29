#!/bin/bash
set -e

echo "🚀 Starting Extension.js with Xpra remote access..."

# Ensure extension directory exists
mkdir -p /tmp/extension

# Install extension dependencies
echo "📦 Installing extension dependencies..."
cd /tmp/extension
npm install

# Create the specific directory structure Extension.js expects for polyfill (global location)
echo "🔧 Setting up Extension.js polyfill structure..."
mkdir -p /usr/local/lib/node_modules/extension/node_modules/extension-develop/node_modules
cd /usr/local/lib/node_modules/extension/node_modules/extension-develop/node_modules
npm install webextension-polyfill@^0.10.0

# Start virtual display with reasonable size (matching common laptop screens)
echo "📺 Starting display server..."
Xvfb :99 -screen 0 1440x900x24 -ac &
XVFB_PID=$!
export DISPLAY=:99

# Wait longer for display to be ready and verify it's available
echo "⏳ Waiting for display server to be ready..."
sleep 5
until xdpyinfo -display :99 >/dev/null 2>&1; do
    echo "Display not ready yet, waiting..."
    sleep 2
done
echo "✅ Display server ready"

# Start window manager
echo "🪟 Starting window manager..."
twm &
TWM_PID=$!

# Wait for display to be ready
sleep 3

# Start extension.js 
echo "🌐 Starting Extension.js..."
cd /app
DISPLAY=$DISPLAY npx extension@latest dev /tmp/extension --browser=chromium-based --chromium-binary=/usr/bin/chromium --open &
EXTENSION_PID=$!

# Wait for chromium to start and check if it's running
sleep 5
echo "🔍 Checking Chromium processes..."
ps aux | grep chromium | grep -v grep || echo "❌ No Chromium processes found"

# Wait for chromium to fully start
sleep 5

# Start xpra with better scaling and positioning options
echo "📺 Starting Xpra remote access..."
xpra shadow $DISPLAY \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    --daemon=no \
    --notifications=no \
    --bell=no \
    --mdns=no \
    --desktop-scaling=auto \
    --resize-display=yes &
XPRA_PID=$!

sleep 2

echo "✅ Ready! Access at: http://localhost:10000"

# Cleanup function
cleanup() {
    echo "🧹 Shutting down..."
    kill $EXTENSION_PID 2>/dev/null || true
    kill $XPRA_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    kill $TWM_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Monitor processes and restart if needed
while true; do
    if ! kill -0 $EXTENSION_PID 2>/dev/null; then
        echo "🔄 Extension.js stopped, restarting..."
        cd /app
        DISPLAY=$DISPLAY npx extension@latest dev /tmp/extension --browser=chromium-based --chromium-binary=/usr/bin/chromium --open &
        EXTENSION_PID=$!
        sleep 10
    fi
    
    if ! kill -0 $XPRA_PID 2>/dev/null; then
        echo "🔄 Xpra stopped, restarting..."
        xpra shadow $DISPLAY \
            --bind-tcp=0.0.0.0:10000 \
            --html=on \
            --daemon=no \
            --notifications=no \
            --bell=no \
            --mdns=no \
            --desktop-scaling=auto \
            --resize-display=yes &
        XPRA_PID=$!
        sleep 2
    fi
    
    sleep 10
done 