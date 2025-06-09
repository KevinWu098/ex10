#!/bin/bash
set -e

# Start Xpra on :100 with TCP and enable remote debugging
xpra start \
    --bind-tcp=0.0.0.0:10000 \
    --html=on \
    --daemon=yes \
    --exit-with-children=no \
    --start-child="chromium --no-sandbox \
                              --disable-gpu \
                              --disable-software-rasterizer \
                              --remote-debugging-port=9222 \
                              --user-data-dir=/tmp/chrome-data \
                              --load-extension=/tmp/extension \
                              --disable-extensions-except=/tmp/extension"

# Give Chrome a moment to initialize
sleep 3

# Start the hot-reload watcher
node /app/reload-watcher.mjs
