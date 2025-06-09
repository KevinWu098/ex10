#!/bin/bash
set -e

# Start Xpra on :100 with TCP
xpra start \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    --daemon=yes \
    --exit-with-children=no \
    --start-child="chromium --no-sandbox --disable-gpu --disable-software-rasterizer --load-extension=/tmp/extension --disable-extensions-except=/tmp/extension"

# Optional: Wait for things to initialize
sleep 3

# Run the reload watcher (assumes it's non-blocking or exits cleanly)
node /app/reload-watcher.mjs