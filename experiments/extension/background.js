console.log("Extension running.");

(function hotReloadClient() {
    const WS_URL = "ws://localhost:8000"; // Or "ws://host.docker.internal:8000" inside container

    function connect() {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("[HotReload] Connected to server");
            ws.send(JSON.stringify({ status: "clientReady" }));
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

        ws.onclose = () => {
            console.log("[HotReload] Disconnected, retrying...");
            setTimeout(connect, 2000);
        };

        ws.onerror = (e) => {
            console.error("[HotReload] WebSocket error", e.message);
        };
    }

    connect();
})();
