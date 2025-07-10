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

        // When the watcher notifies of a file change, refresh every open tab
        // first (so updated content-scripts can be reinjected) and then reload
        // the extension itself. This guarantees both the service-worker and
        // the content scripts pick up the latest version.
        ws.onmessage = (event) => {
            let changedFile = "unknown";
            try {
                const msg = JSON.parse(event.data || "{}");
                changedFile = msg.changedFile || changedFile;
            } catch (err) {
                console.warn("[HotReload] Failed to parse message:", err);
            }

            console.log("[HotReload] Reload triggered due to:", changedFile);

            // 1) Reload all tabs so that once the extension reloads Chrome will
            //    inject a fresh copy of the content-script into each page.
            if (chrome.tabs?.query) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                        if (tab.id) {
                            chrome.tabs.reload(tab.id, {}, () => {
                                if (chrome.runtime.lastError) {
                                    // Ignore errors (e.g. chrome:// pages)
                                }
                            });
                        }
                    });

                    // 2) After a short delay (to ensure reloads have started),
                    //    reload the extension so the background service worker
                    //    and static assets are fully refreshed.
                    setTimeout(() => {
                        chrome.runtime?.reload?.();
                    }, 150);
                });
            } else {
                // Fallback if tabs permission missing – still reload extension.
                chrome.runtime?.reload?.();
            }
        };

        /**
         * After the service worker restarts (either the browser or
         * chrome.runtime.reload) we want to ensure the latest version of the
         * content-script is present on every existing tab. We do this once on
         * startup and also right after installation/updates.
         */
        function reinjectContentScript() {
            if (!chrome.tabs?.query || !chrome.scripting?.executeScript) {
                return;
            }

            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    if (!tab.id) return;
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames: true },
                        files: ["content-script.js"],
                    });
                });
            });
        }

        // Run once the service-worker is (re)-installed.
        if (chrome.runtime.onInstalled) {
            chrome.runtime.onInstalled.addListener(reinjectContentScript);
        }

        // Also run whenever Chrome starts.
        if (chrome.runtime.onStartup) {
            chrome.runtime.onStartup.addListener(reinjectContentScript);
        }

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
