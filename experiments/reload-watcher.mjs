import fs from "fs";
import WebSocket from "ws";

const EXTENSION_DIR = "/tmp/extension";
const WEBSOCKET_PORT = 8000;

const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
console.log(
    `🧠 Hot Reload WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`
);

wss.on("connection", (ws) => {
    console.log("🧩 Extension connected to hot reload server");

    ws.on("message", (msg) => {
        console.log("🔁 From extension:", msg.toString());
    });

    ws.on("close", () => {
        console.log("❌ Extension disconnected");
    });
});

function notifyClients(changedFile) {
    const payload = JSON.stringify({ changedFile });

    for (const ws of wss.clients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }

    console.log(`📦 Change sent to extension: ${changedFile}`);
}

fs.watch(EXTENSION_DIR, { recursive: true }, (eventType, filename) => {
    if (filename) {
        console.log(`📁 Detected ${eventType} on ${filename}`);
        notifyClients(filename);
    }
});
