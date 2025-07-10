import chokidar from "chokidar";
import WebSocket, { WebSocketServer } from "ws";
import chalk from "chalk";

const EXTENSION_DIR = process.env.EXTENSION_DIR || "/tmp/extension";
const WEBSOCKET_PORT = 8000;

const formatTime = () => {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return chalk.gray(`[${hours}:${minutes}:${seconds}]`);
};

const log = (emoji, color, message) => {
    console.log(`${formatTime()} ${chalk[color](emoji)} ${message}`);
};

const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
log(
    "🧠",
    "cyan",
    chalk.cyan.bold("Hot Reload WebSocket server running on ") +
        chalk.yellow.underline(`ws://localhost:${WEBSOCKET_PORT}`)
);

wss.on("connection", (ws) => {
    const clientId = Math.random().toString(36).substr(2, 9);
    log(
        "🧩",
        "green",
        `Extension connected ${chalk.blue(`(ID: ${clientId})`)}`
    );

    ws.on("message", (msg) => {
        try {
            const parsed = JSON.parse(msg.toString());
            if (parsed.type === "heartbeat") {
                log("💓", "magenta", `Heartbeat from ${chalk.blue(clientId)}`);
            } else {
                log(
                    "🔁",
                    "cyan",
                    `Message from ${chalk.blue(clientId)}: ${chalk.white(
                        msg.toString()
                    )}`
                );
            }
        } catch (e) {
            log(
                "🔁",
                "cyan",
                `Message from ${chalk.blue(clientId)}: ${chalk.white(
                    msg.toString()
                )}`
            );
        }
    });

    ws.on("close", (code, reason) => {
        log(
            "❌",
            "red",
            `Extension disconnected ${chalk.blue(
                `(${clientId})`
            )} - ${chalk.yellow(`Code: ${code}`)}${
                reason ? `, ${chalk.yellow(`Reason: ${reason}`)}` : ""
            }`
        );
    });

    ws.on("error", (error) => {
        log(
            "⚠️",
            "red",
            `WebSocket error ${chalk.blue(`(${clientId})`)}: ${chalk.red(
                error.message
            )}`
        );
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
            log("🏓", "green", `Ping sent to ${chalk.blue(clientId)}`);
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);

    ws.on("pong", () => {
        log("🏓", "green", `Pong received from ${chalk.blue(clientId)}`);
    });
});

function notifyClients(changedFile) {
    const payload = JSON.stringify({ changedFile });

    for (const ws of wss.clients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }

    log(
        "📦",
        "yellow",
        `Change notification sent: ${chalk.green(changedFile)}`
    );
}

// Use chokidar for robust, cross-platform file watching (recursive on Linux).
const watcher = chokidar.watch(EXTENSION_DIR, {
    persistent: true,
    ignoreInitial: true, // ignore events for existing files on startup
});

watcher.on("all", (event, changedPath) => {
    log(
        "📁",
        "blue",
        `File ${event} detected: ${chalk.green(changedPath)}`
    );
    notifyClients(changedPath);
});