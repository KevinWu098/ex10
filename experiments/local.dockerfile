FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 18 (or 20) from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update && apt-get install -y \
    chromium-browser xpra xvfb \
    libnss3 libatk-bridge2.0-0 libgtk-3-0 libasound2 \
    libgbm1 fonts-liberation \
    nodejs npm curl


# Set working directory
WORKDIR /app

# Copy reload watcher
COPY reload-watcher.mjs .

# Install watcher dependencies
RUN npm install chokidar chrome-remote-interface

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose Xpra (14500) and CDP (9222)
EXPOSE 14500 9222

CMD ["/start.sh"]
