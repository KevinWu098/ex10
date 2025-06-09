#!/bin/bash

# Start Chrome via Xpra virtual display
xpra start :100 \
  --bind-tcp=0.0.0.0:14500 \
  --html=on \
  --start-child="chromium-browser --no-sandbox \
    --disable-gpu \
    --remote-debugging-port=9222 \
    --load-extension=/tmp/extension \
    --user-data-dir=/tmp/profile"

# Wait for Chrome to initialize
sleep 5

# Start file watcher for hot reload
node /app/reload-watcher.mjs
