const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    config: (config) => {
        config.plugins.push(new NodePolyfillPlugin());
        return config;
    },
    browser: {
        chromium: {
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--window-size=1200,800",
                "--window-position=100,100",
            ],
        },
    },
};
