console.log("Extension running.");

(function hotReloadClient() {
    const WS_URL = "ws://localhost:8000"; // Connect to reload watcher
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 20; // Increased attempts for container startup
    let ws = null;
    let heartbeatInterval = null;

    function connect() {
        console.log(
            `[HotReload] Attempting to connect (attempt ${
                reconnectAttempts + 1
            })`
        );

        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("[HotReload] Connected to server");
            reconnectAttempts = 0;

            ws.send(
                JSON.stringify({
                    status: "clientReady",
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                })
            );

            // Set up heartbeat
            heartbeatInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: "heartbeat",
                            timestamp: Date.now(),
                        })
                    );
                }
            }, 25000); // Send heartbeat every 25 seconds
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log(
                "[HotReload] Reload triggered due to:",
                msg.changedFile
            );

            if (chrome.runtime?.reload) {
                chrome.runtime.reload();
            }
        };

        ws.onclose = (event) => {
            console.log(
                `[HotReload] Disconnected - Code: ${event.code}, Reason: ${event.reason}`
            );

            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }

            if (reconnectAttempts < maxReconnectAttempts) {
                const delay = 1000 * Math.pow(2, reconnectAttempts);
                console.log(`[HotReload] Retrying in ${delay}ms...`);
                reconnectAttempts++;
                setTimeout(connect, delay);
            } else {
                console.log("[HotReload] Max reconnect attempts reached");
            }
        };

        ws.onerror = (e) => {
            console.error("[HotReload] WebSocket error:", e);
            console.error("[HotReload] Failed to connect to:", WS_URL);
        };
    }

    // Handle extension wake-up
    if (chrome.runtime.onStartup) {
        chrome.runtime.onStartup.addListener(() => {
            console.log(
                "[HotReload] Extension startup detected, reconnecting..."
            );
            reconnectAttempts = 0;
            connect();
        });
    }

    // Handle when extension context becomes active
    if (chrome.runtime.onSuspend) {
        chrome.runtime.onSuspend.addListener(() => {
            console.log(
                "[HotReload] Extension suspending, closing connection..."
            );
            if (ws) {
                ws.close();
            }
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        });
    }

    connect();
})();
