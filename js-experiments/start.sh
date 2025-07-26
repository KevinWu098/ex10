#!/bin/bash
set -e

echo "🚀 Starting Extension.js with Xpra streaming..."

# Ensure extension directory exists
mkdir -p /tmp/extension

# Start Xpra on display :100 with TCP binding for HTML client
echo "📺 Starting Xpra server..."
xpra start :100 \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    # --xvfb="Xvfb -nolisten unix -nolisten tcp" \
    --daemon=no \
    --exit-with-children=no \
    --start-new-commands=yes \
    --notifications=no \
    --bell=no \
    --start-child="bash -c 'sleep 3 && cd /app && DISPLAY=:100 npx extension@latest dev /tmp/extension --chromium-binary=/usr/bin/chromium --polyfill'" &

# Wait for Xpra to start
sleep 5

echo "✅ Xpra and Extension.js starting!"
echo "🌐 Access via Xpra HTML client at: http://localhost:10000"
echo "📝 Extension directory: /tmp/extension"

# Keep the container running and show logs
wait 