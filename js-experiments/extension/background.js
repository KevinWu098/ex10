// Background service worker for Extension.js demo

console.log("Extension.js background script loaded!");

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "test") {
        console.log("Test action received from popup");
        sendResponse({ status: "success", message: "Hello from background!" });
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension.js demo extension installed!");
});
