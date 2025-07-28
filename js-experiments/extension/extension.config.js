module.exports = {
    browser: {
        "chromium-based": {
            chromiumBinary: "/usr/bin/chromium",
            browserFlags: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--remote-debugging-port=9222",
            ],
            excludeBrowserFlags: ["--mute-audio"],
        },
    },
    commands: {
        dev: {
            browser: "chromium-based",
        },
    },
};
