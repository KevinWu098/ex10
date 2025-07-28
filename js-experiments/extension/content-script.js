// Extension.js demo content script
console.log("Extension.js content script loaded!");

// Add a subtle visual indicator that the extension is working
const indicator = document.createElement("div");
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  z-index: 9999;
  pointer-events: none;
`;
indicator.textContent = "Extension.js Active";
document.body.appendChild(indicator);
