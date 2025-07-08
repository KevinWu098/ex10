import express from "express";
import { spawn, exec } from "child_process";

const app = express();
const port = process.env.PORT || 3001;
const xpraPort = process.env.XPRA_PORT || 10000;

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

// Start Xpra
app.post("/xpra/start", async (req, res) => {
    const isRunning = await checkXpraRunning();
    if (isRunning || xpraProcess) {
        return res.status(400).json({ error: "Xpra is already running" });
    }

    const customPort = req.body.port || xpraPort;

    try {
        xpraProcess = spawn("xpra", [
            "start",
            "--bind-tcp=0.0.0.0:" + customPort,
            "--html=on",
            "--daemon=yes",
            "--exit-with-children=no",
            "--start-child=chromium --no-sandbox --disable-gpu --disable-software-rasterizer --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-data --load-extension=/tmp/extension --disable-extensions-except=/tmp/extension",
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
        // Stop all Xpra sessions
        exec("xpra stop-all", (error, stdout, stderr) => {
            if (error) {
                console.error("Error stopping Xpra:", error);
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Default Xpra port: ${xpraPort}`);
});
