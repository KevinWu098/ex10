# To build and run:
# docker build -t example-chromium-xpra .
# docker rm -f example-chromium-xpra
# docker run -p 10000:10000 -p 3000:3000 example-chromium-xpra

FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    xpra \
    chromium \
    xvfb \
    python3-dbus \
    python3-gi \
    python3-pil \
    python3-pyinotify \
    python3-netifaces \
    python3-xdg \
    dbus-x11 \
    x11-utils \
    nodejs npm \
    curl \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Prepare environment
RUN dbus-uuidgen > /etc/machine-id && mkdir -p /run/user/0

# Working dir
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies and build
RUN pnpm install
RUN pnpm run build

# Expose ports for xpra HTML client and dev server
EXPOSE 10000
EXPOSE 3000

# Add start script
RUN echo '#!/bin/bash\n\
xpra start :100 --start=chromium --html=on --bind-tcp=0.0.0.0:10000 &\n\
pnpm start\n\
tail -f /dev/null' > /start.sh

RUN chmod +x /start.sh

# Entrypoint
CMD ["/start.sh"] 