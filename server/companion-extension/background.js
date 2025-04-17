let socket;
let pingInterval;

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
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
// TODO: CLIENT CONNECTS  MULTIPLE TIMES (twice i think)
function connectToServer() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Already connected");
        return;
    }
    
    socket = new WebSocket("ws://localhost:4926");

    socket.onopen = () => {
        console.log("Connected to main server");
        
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
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    document.querySelector('button')?.click();
                }
            });
        }

        if (msg.type === "get-html") {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.documentElement.outerHTML
            }, (results) => {
                if (results && results[0]) {
                    socket.send(JSON.stringify({ type: "dom-content", html: results[0].result }));
                }
            });
        }
    };

    socket.onclose = (event) => {
        console.warn(`Socket closed (${event.code}): ${event.reason || "No reason provided"}. Retrying...`);
        stopPingInterval();
        setTimeout(connectToServer, 2000);
    };

    socket.onerror = (e) => {
        console.error("Socket error:", e);
        socket.close();
    };
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

// Initial connection
connectToServer();
