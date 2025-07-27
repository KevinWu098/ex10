module.exports = {
    browser: {
        chrome: {
            browserFlags: [
                "--no-sandbox",
                "--window-size=1200,800",
                "--window-position=0,0", // Force to top-left corner
                "--disable-default-apps",
                "--no-first-run",
                "--start-maximized",
            ],
        },
    },
};
