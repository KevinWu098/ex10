let socket;
let pingInterval;
let isConnecting = false; // Flag to track connection attempts in progress

function startPingInterval() {
    // Clear any existing interval
    if (pingInterval) {
        clearInterval(pingInterval);
    }
    
    // Send ping every second to prevent service worker from sleeping
    pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping", sessionId: "STR_REPLACE_SESSION_ID" }));
        }
    }, 1000);
}

function stopPingInterval() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

function connectToServer() {
    // If already connected or connection attempt in progress, don't create a new connection
    if ((socket && socket.readyState === WebSocket.OPEN) || isConnecting) {
        console.log("Already connected or connection in progress");
        return;
    }
    
    isConnecting = true;
    console.log("Connecting to server...");
    
    try {
        socket = new WebSocket("ws://localhost:4926");

        socket.onopen = () => {
            console.log("Connected to main server");
            isConnecting = false;
            
            // Add a small delay before sending the first message to ensure the connection is fully established
            setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "extension-connected", sessionId: "STR_REPLACE_SESSION_ID" }));
                    startPingInterval();
                }
            }, 500);
        };

        socket.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            console.log("Received from server:", msg);

            // Handle pong from server
            if (msg.type === "pong") {
                console.log("Received pong from server");
                return;
            }

            if (msg.type === "auth-success") {
                console.log("Authentication successful");
            }

            if (msg.type === "click-random-button-test-thingy") {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    
                    // Check if we can access this tab (avoid chrome:// URLs)
                    if (!tab || tab.url.startsWith("chrome://")) {
                        console.warn("Cannot access chrome:// URL or tab not found");
                        return;
                    }

                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            document.querySelector('button')?.click();
                        }
                    }).catch(error => {
                        console.error("Error executing script:", error);
                    });
                } catch (error) {
                    console.error("Error handling click-random-button action:", error);
                }
            }

            if (msg.type === "get-dom-content") {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    
                    // Check if we can access this tab (avoid chrome:// URLs)
                    if (!tab || tab.url.startsWith("chrome://")) {
                        console.warn("Cannot access chrome:// URL or tab not found");
                        socket.send(JSON.stringify({ 
                            type: "dom-content-error", 
                            error: "Cannot access chrome:// URL or tab not found" 
                        }));
                        return;
                    }

                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => document.documentElement.outerHTML
                    }).then(results => {
                        if (results && results[0]) {
                            socket.send(JSON.stringify({ type: "dom-content", html: results[0].result }));
                        }
                    }).catch(error => {
                        console.error("Error executing script:", error);
                        socket.send(JSON.stringify({ 
                            type: "dom-content-error", 
                            error: error.message || "Script execution failed" 
                        }));
                    });
                } catch (error) {
                    console.error("Error handling get-dom-content action:", error);
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ 
                            type: "dom-content-error", 
                            error: error.message || "Unknown error occurred" 
                        }));
                    }
                }
            }
        };

        socket.onclose = (event) => {
            console.warn(`Socket closed (${event.code}): ${event.reason || "No reason provided"}. Retrying...`);
            isConnecting = false;
            stopPingInterval();
            setTimeout(connectToServer, 2000);
        };

        socket.onerror = (e) => {
            console.error("Socket error:", e);
            isConnecting = false;
            try {
                socket.close();
            } catch (closeError) {
                console.error("Error closing socket:", closeError);
            }
        };
    } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        isConnecting = false;
        setTimeout(connectToServer, 2000);
    }
}

// Ensure the extension stays active by registering for events
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, connecting to server");
    connectToServer();
});

// Reconnect when the browser starts
chrome.runtime.onStartup.addListener(() => {
    console.log("Browser started, connecting to server");
    connectToServer();
});

// Keep the service worker alive
chrome.runtime.onConnect.addListener(port => {
    port.onDisconnect.addListener(() => {
        console.log("Port disconnected, ensuring connection is active");
        connectToServer();
    });
});

// Initial connection - only call once
connectToServer();
