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
                "--window-size=1300,800",
                "--window-position=70,50",
                "--disable-features=VizDisplayCompositor",
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
