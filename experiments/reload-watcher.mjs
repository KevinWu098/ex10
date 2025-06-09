import fs from "fs";
import path from "path";
import CDP from "chrome-remote-interface";

const EXTENSION_DIR = "/tmp/extension";
let client = null;

async function connectToChrome() {
    try {
        client = await CDP({ port: 9222 });
        console.log("✅ Connected to Chrome DevTools.");

        const { Target } = client;
        const { targetInfos } = await Target.getTargets();

        console.log("🔍 CDP Targets:");
        for (const t of targetInfos) {
            console.log(` - ${t.type} | ${t.url} | ${t.title}`);
        }
    } catch (e) {
        console.error("❌ Failed to connect to Chrome. Retrying in 2s...");
        setTimeout(connectToChrome, 2000);
    }
}

async function reloadExtension() {
    if (!client) return;

    try {
        const { Runtime } = client;

        await Runtime.evaluate({
            expression: "chrome.runtime.reload()",
        });

        console.log("🔁 Reloaded extension.");
    } catch (err) {
        console.error("CDP reload error:", err.message);
    }
}

function watchDirectory(dir) {
    console.log(`👀 Watching ${dir} for changes...`);
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename) {
            console.log(`📁 Detected ${eventType} on ${filename}`);
            reloadExtension();
        }
    });
}

// Delay to allow Chromium to boot and service worker to wake up
setTimeout(() => {
    connectToChrome();
    watchDirectory(EXTENSION_DIR);
}, 5000);
