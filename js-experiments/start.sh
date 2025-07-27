#!/bin/bash
set -e

echo "🚀 Starting Extension.js, then connecting Xpra to its display..."

# Ensure extension directory exists
mkdir -p /tmp/extension

# Start virtual display server first so Extension.js has a display to use
echo "📺 Starting virtual display server..."
Xvfb :99 -screen 0 1920x1080x24 -ac &
XVFB_PID=$!
sleep 3

# Set display environment for Extension.js
export DISPLAY=:99

# Start window manager for proper window handling
echo "🖼️  Starting window manager..."
twm &
TWM_PID=$!
sleep 2

echo "🌐 Starting Extension.js with hot reloading on display $DISPLAY..."
cd /app

# Start extension.js with the display set
npx extension@latest dev /tmp/extension \
    --chromium-binary=/usr/bin/chromium \
    --polyfill \
    --open &
EXTENSION_PID=$!
echo "Extension.js started with PID: $EXTENSION_PID"

# Wait for chromium to spawn
echo "⏳ Waiting for chromium to spawn..."
sleep 10

# Find the actual chromium process and verify it's running
echo "🔍 Detecting chromium processes..."
CHROMIUM_FOUND=false
for i in {1..20}; do
    # Look for actual chromium binary processes
    if ps aux | grep -E "/usr/lib/chromium/chromium" | grep -v grep > /dev/null; then
        echo "✅ Found actual chromium binary processes!"
        ps aux | grep -E "/usr/lib/chromium/chromium" | grep -v grep | head -3
        CHROMIUM_FOUND=true
        break
    elif ps aux | grep -E "(chromium|chrome)" | grep -v grep > /dev/null; then
        echo "⚠️  Found chromium-related processes (but no binary):"
        ps aux | grep -E "(chromium|chrome)" | grep -v grep
    fi
    echo "⏱️  ${i}s: No chromium binary yet..."
    sleep 1
done

# Check what windows exist on the display
echo "🔍 Checking windows on display $DISPLAY..."
DISPLAY=$DISPLAY xwininfo -root -tree | grep -E "(chromium|chrome|Chromium|Chrome)" || echo "No chromium windows found"

if [ "$CHROMIUM_FOUND" = false ]; then
    echo "❌ Extension.js failed to spawn chromium binary. Trying manual test..."
    
    # Try manual chromium launch for debugging
    echo "🧪 Testing manual chromium launch..."
    DISPLAY=$DISPLAY /usr/bin/chromium \
        --no-sandbox \
        --window-size=800,600 \
        --window-position=100,100 \
        --new-window \
        "chrome://version/" &
    TEST_PID=$!
    sleep 5
    if ps aux | grep -E "/usr/lib/chromium/chromium" | grep -v grep > /dev/null; then
        echo "✅ Manual chromium launch worked!"
        kill $TEST_PID 2>/dev/null || true
    else
        echo "❌ Even manual chromium launch failed"
    fi
fi

echo "📺 Connecting Xpra to display $DISPLAY..."

# Start xpra shadow to capture the display where chromium is running
xpra shadow $DISPLAY \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    --daemon=no \
    --notifications=no \
    --bell=no \
    --mdns=no &

XPRA_PID=$!

# Wait for Xpra to start
sleep 3

echo "✅ Setup complete!"
echo "🌐 Access via Xpra HTML client at: http://localhost:10000"
echo "📝 Extension directory: /tmp/extension"
echo "🔧 Extension.js PID: $EXTENSION_PID"
echo "🔧 Xpra PID: $XPRA_PID"
echo "🔧 Xvfb PID: $XVFB_PID"
echo "🔧 TWM PID: $TWM_PID"
echo "🔧 Display: $DISPLAY"

# Show current status
echo "🔍 Current chromium processes:"
ps aux | grep -E "(chromium|chrome)" | grep -v grep || echo "No chromium processes found"

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    kill $EXTENSION_PID 2>/dev/null || true
    kill $XPRA_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    kill $TWM_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Keep the container running and monitor processes
while true; do
    # Check if extension.js is still running
    if ! kill -0 $EXTENSION_PID 2>/dev/null; then
        echo "❌ Extension.js process died, restarting..."
        cd /app
        DISPLAY=$DISPLAY npx extension@latest dev /tmp/extension \
            --chromium-binary=/usr/bin/chromium \
            --polyfill \
            --open &
        EXTENSION_PID=$!
        echo "🔄 Extension.js restarted with PID: $EXTENSION_PID"
        sleep 8
    fi
    
    if ! kill -0 $XPRA_PID 2>/dev/null; then
        echo "❌ Xpra process died, restarting shadow..."
        xpra shadow $DISPLAY \
            --bind-tcp=0.0.0.0:10000 \
            --html=on \
            --daemon=no \
            --notifications=no \
            --bell=no \
            --mdns=no &
        XPRA_PID=$!
        echo "🔄 Xpra shadow restarted with PID: $XPRA_PID"
    fi
    
    sleep 10
done 