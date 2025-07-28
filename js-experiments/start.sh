#!/bin/bash
set -e

echo "🚀 Starting Extension.js with Xpra remote access..."

# Ensure extension directory exists
mkdir -p /tmp/extension

# Start virtual display with reasonable size (matching common laptop screens)
echo "📺 Starting display server..."
Xvfb :99 -screen 0 1440x900x24 -ac &
XVFB_PID=$!
export DISPLAY=:99

# Start window manager
twm &
TWM_PID=$!

# Wait for display to be ready
sleep 3

# Start extension.js 
echo "🌐 Starting Extension.js..."
cd /app
DISPLAY=$DISPLAY npx extension@latest dev /tmp/extension --browser=chromium-based --open &
EXTENSION_PID=$!

# Wait for chromium to start
sleep 10

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
        DISPLAY=$DISPLAY npx extension@latest dev /tmp/extension --browser=chromium-based --open &
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