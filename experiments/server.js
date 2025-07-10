import express from "express";
import { spawn, exec } from "child_process";
import net from "net";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Curl commands for testing:
// curl -X POST http://localhost:3001/xpra/start
// curl -X POST http://localhost:3001/xpra/stop
// curl -X GET http://localhost:3001/xpra/status


// Node ESM modules don’t have __dirname by default; define it here so we can
// reliably resolve local resources regardless of the working directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const xpraPort = process.env.XPRA_PORT || 10000;

// --- Start hot-reload watcher automatically in development/local runs ---
async function maybeStartHotReloadWatcher() {
    const port = 8000;

    const isPortTaken = await new Promise((resolve) => {
        const tester = net
            .createServer()
            .once("error", (err) => {
                if (err.code === "EADDRINUSE") {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .once("listening", () => {
                tester.close();
                resolve(false);
            })
            .listen(port, "0.0.0.0");
    });

    if (isPortTaken) {
        console.log(
            `[HotReload] Port ${port} already in use – assuming watcher is running`
        );
        return; // do not spawn another watcher
    }

    try {
        const watcherPath = path.join(__dirname, "reload-watcher.mjs");
        const hotReloadWatcher = spawn("node", [watcherPath], {
            stdio: "inherit",
            env: {
                ...process.env,
                EXTENSION_DIR: path.join(__dirname, "extension"),
            }, // ensure watcher monitors local extension dir
        });

        process.on("exit", () => {
            if (hotReloadWatcher) {
                hotReloadWatcher.kill();
            }
        });
        console.log("[HotReload] Watcher started via server.js");
    } catch (err) {
        console.warn(
            "[HotReload] Failed to start reload-watcher:",
            err.message
        );
    }
}

maybeStartHotReloadWatcher();

app.use(express.json());

// Store Xpra process reference
let xpraProcess = null;

// Helper function to check if Xpra is running
function checkXpraRunning() {
    return new Promise((resolve) => {
        exec("xpra list", (error, stdout, stderr) => {
            if (error) {
                resolve(false);
                return;
            }
            // Check if any displays are active
            const hasActiveDisplay =
                stdout.includes("LIVE session") ||
                stdout.includes("session at :");
            resolve(hasActiveDisplay);
        });
    });
}

// Ensure background.js is available in the extension directory
async function ensureBackgroundInjected(extensionDir) {
    try {
        // Ensure the extension directory exists
        await fs.mkdir(extensionDir, { recursive: true });

        // Use __dirname to reliably resolve the hot-reload script location inside the
        // container no matter where the server is started from.
        const hotReloadPath = path.join(
            __dirname,
            "hot-reload",
            "background.js"
        );
        const destPath = path.join(extensionDir, "background.js");

        // Copy/overwrite the file unconditionally (it's idempotent and small)
        const backgroundJsContent = await fs.readFile(hotReloadPath, "utf8");
        await fs.writeFile(destPath, backgroundJsContent, "utf8");
        console.log(
            "[ensureBackgroundInjected] background.js injected at",
            destPath
        );

        // Ensure manifest.json references background.js so the service worker is
        // actually loaded when the browser first starts with the extension.
        try {
            const manifestPath = path.join(extensionDir, "manifest.json");
            const manifestRaw = await fs.readFile(manifestPath, "utf8");
            const manifest = JSON.parse(manifestRaw);

            let manifestChanged = false;

            if (!manifest.background) {
                manifest.background = { service_worker: "background.js" };
                manifestChanged = true;
            } else if (
                manifest.background &&
                manifest.background.service_worker !== "background.js"
            ) {
                manifest.background.service_worker = "background.js";
                manifestChanged = true;
            }

            // Ensure the extension can connect to the local hot-reload WebSocket
            // and use chrome.scripting to re-inject updated content scripts.
            // 1. Ensure required permissions for hot reload
            if (!manifest.permissions) manifest.permissions = [];

            const requiredPerms = ["scripting", "tabs"];
            for (const perm of requiredPerms) {
                if (!manifest.permissions.includes(perm)) {
                    manifest.permissions.push(perm);
                    manifestChanged = true;
                }
            }

            // 2. Add the host permission for localhost:8000 (WebSocket server).
            //    The "ws://" scheme is covered by the corresponding http/https host permission.
            if (!manifest.host_permissions) manifest.host_permissions = [];
            const localHostPerm = "http://localhost:8000/";
            if (!manifest.host_permissions.includes(localHostPerm)) {
                manifest.host_permissions.push(localHostPerm);
                manifestChanged = true;
            }

            if (manifestChanged) {
                await fs.writeFile(
                    manifestPath,
                    JSON.stringify(manifest, null, 2),
                    "utf8"
                );
                console.log(
                    "[ensureBackgroundInjected] manifest.json updated with background.js"
                );
            }
        } catch (manifestErr) {
            // It's possible the manifest doesn't exist yet; log and continue.
            console.warn(
                "[ensureBackgroundInjected] Could not update manifest.json:",
                manifestErr.message
            );
        }
    } catch (err) {
        console.error(
            "[ensureBackgroundInjected] Failed to inject background.js:",
            err
        );
    }
}

// Start Xpra
app.post("/xpra/start", async (req, res) => {
    const isRunning = await checkXpraRunning();
    if (isRunning || xpraProcess) {
        return res.status(400).json({ error: "Xpra is already running" });
    }

    const customPort = req.body.port || xpraPort;

    // NEW: make sure background.js exists before launching xpra
    const extensionDir = "/tmp/extension";
    await ensureBackgroundInjected(extensionDir);

    try {
        xpraProcess = spawn("xpra", [
            "start",
            "--bind-tcp=0.0.0.0:" + customPort,
            "--html=on",
            "--daemon=yes",
            "--exit-with-children=no",
            "--start-child=chromium --no-sandbox --disable-gpu --disable-software-rasterizer --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-data --load-extension=" +
                extensionDir +
                " --disable-extensions-except=" +
                extensionDir,
        ]);

        xpraProcess.stdout.on("data", (data) => {
            console.log(`Xpra stdout: ${data}`);
        });

        xpraProcess.stderr.on("data", (data) => {
            console.error(`Xpra stderr: ${data}`);
        });

        xpraProcess.on("close", (code) => {
            console.log(`Xpra process exited with code ${code}`);
            xpraProcess = null;
        });

        res.json({
            message: "Xpra started successfully",
            port: customPort,
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to start Xpra",
            details: error.message,
        });
    }
});

// Stop Xpra
app.post("/xpra/stop", async (req, res) => {
    const isRunning = await checkXpraRunning();
    if (!isRunning && !xpraProcess) {
        return res.status(400).json({ error: "Xpra is not running" });
    }

    try {
        // Stop all Xpra sessions - get list first, then stop each one
        exec("xpra list", (error, stdout, stderr) => {
            if (error) {
                console.error("Error listing Xpra sessions:", error);
            } else {
                // Parse the output to find active sessions and stop them
                const lines = stdout.split("\n");
                lines.forEach((line) => {
                    if (
                        line.includes("LIVE session") ||
                        line.includes("session at :")
                    ) {
                        // Extract display number from line like "LIVE session at :100"
                        const match = line.match(/:(\d+)/);
                        if (match) {
                            const display = match[1];
                            exec(`xpra stop :${display}`, (stopError) => {
                                if (stopError) {
                                    console.error(
                                        `Error stopping Xpra display :${display}:`,
                                        stopError
                                    );
                                } else {
                                    console.log(
                                        `Successfully stopped Xpra display :${display}`
                                    );
                                }
                            });
                        }
                    }
                });
            }
        });

        if (xpraProcess) {
            xpraProcess.kill();
            xpraProcess = null;
        }
        res.json({ message: "Xpra stopped successfully" });
    } catch (error) {
        res.status(500).json({
            error: "Failed to stop Xpra",
            details: error.message,
        });
    }
});

// Get Xpra status
app.get("/xpra/status", async (req, res) => {
    const isRunning = await checkXpraRunning();
    res.json({
        running: isRunning,
        managedByServer: xpraProcess !== null,
        port: xpraPort,
    });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Add updateCode endpoint
app.post("/updateCode", async (req, res) => {
    try {
        const { sessionId, code } = req.body;

        if (!code || !code.file_path || !code.file_content) {
            return res.status(400).json({
                error: "Missing required fields: file_path and file_content",
            });
        }

        // Ensure the extension directory exists
        const extensionDir = "/tmp/extension";
        await fs.mkdir(extensionDir, { recursive: true });

        // Read and inject the hot reload background.js
        try {
            const hotReloadPath = path.join(
                __dirname,
                "hot-reload",
                "background.js"
            );
            const backgroundJsContent = await fs.readFile(
                hotReloadPath,
                "utf8"
            );
            const backgroundJsPath = path.join(extensionDir, "background.js");
            await fs.writeFile(backgroundJsPath, backgroundJsContent, "utf8");
            console.log("Hot reload background.js injected successfully");
        } catch (error) {
            console.error("Error injecting hot reload background.js:", error);
            // Don't fail the whole request if hot reload injection fails
        }

        // Process the main file content
        let fileContent = code.file_content;

        // If it's a manifest.json, ensure it includes the background service worker
        if (code.file_path === "manifest.json") {
            try {
                const manifest = JSON.parse(fileContent);

                // Ensure background service worker is included
                if (!manifest.background) {
                    manifest.background = {
                        service_worker: "background.js",
                    };
                    console.log(
                        "Added background service worker to manifest.json"
                    );
                } else if (!manifest.background.service_worker) {
                    manifest.background.service_worker = "background.js";
                    console.log(
                        "Updated background service worker in manifest.json"
                    );
                }

                // Ensure the extension has the permissions it needs for hot reload.
                if (!manifest.permissions) manifest.permissions = [];
                if (!manifest.permissions.includes("scripting")) {
                    manifest.permissions.push("scripting");
                    console.log("Added 'scripting' permission to manifest.json");
                }

                if (!manifest.host_permissions) manifest.host_permissions = [];
                const localHostPerm = "http://localhost:8000/";
                if (!manifest.host_permissions.includes(localHostPerm)) {
                    manifest.host_permissions.push(localHostPerm);
                    console.log(
                        "Added localhost host_permission to manifest.json"
                    );
                }

                fileContent = JSON.stringify(manifest, null, 2);
            } catch (error) {
                console.error("Error parsing manifest.json:", error);
                // Continue with original content if parsing fails
            }
        }

        // Normalize the file path to prevent directory traversal
        const normalizedPath = path
            .normalize(code.file_path)
            .replace(/^(\.\.[\/\\])+/, "");
        const filePath = path.join(extensionDir, normalizedPath);

        // Ensure the directory for the file exists
        const fileDir = path.dirname(filePath);
        await fs.mkdir(fileDir, { recursive: true });

        // Write the file content
        await fs.writeFile(filePath, fileContent, "utf8");

        console.log(`File written successfully: ${filePath}`);
        console.log(`File size: ${fileContent.length} characters`);

        res.json({
            success: true,
            message: `File ${code.file_path} updated successfully with hot reload support`,
            filePath: filePath,
        });
    } catch (error) {
        console.error("Error updating code:", error);
        res.status(500).json({
            error: "Failed to update code",
            details: error.message,
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Default Xpra port: ${xpraPort}`);
});
