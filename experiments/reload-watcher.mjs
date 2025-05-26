import chokidar from "chokidar";
import CDP from "chrome-remote-interface";

const EXTENSION_DIR = "/tmp/extension";
let client = null;

async function connectToChrome() {
    try {
        client = await CDP({ port: 9222 });
        console.log("Connected to Chrome DevTools.");
    } catch (e) {
        console.error("Failed to connect to Chrome. Retrying in 2s...");
        setTimeout(connectToChrome, 2000);
    }
}

async function reloadExtension() {
    if (!client) return;
    try {
        const { Runtime } = client;
        await Runtime.evaluate({
            expression: `
        (async () => {
          const extensions = await chrome.management.getAll();
          const target = extensions.find(e => e.installType === 'development');
          if (target) {
            await chrome.management.setEnabled(target.id, false);
            await chrome.management.setEnabled(target.id, true);
            console.log("Extension reloaded:", target.id);
          }
        })();
      `,
        });
        console.log("Reloaded extension via CDP.");
    } catch (err) {
        console.error("CDP reload error:", err.message);
    }
}

chokidar.watch(EXTENSION_DIR, { ignoreInitial: true }).on("all", () => {
    console.log("Detected change in extension. Attempting reload...");
    reloadExtension();
});

connectToChrome();
