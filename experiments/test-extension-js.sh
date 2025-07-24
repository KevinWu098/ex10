#!/bin/bash

# Test script for Extension.js + Xpra integration
set -e

echo "🚀 Testing Extension.js + Xpra Integration"
echo "==========================================="

SERVER_URL="http://localhost:3001"

# Function to check if server is running
check_server() {
    if ! curl -s "$SERVER_URL/health" > /dev/null; then
        echo "❌ Server is not running. Please start the server first:"
        echo "   cd experiments && npm start"
        exit 1
    fi
}

# Function to wait for user input
wait_for_input() {
    read -p "Press Enter to continue..."
}

echo "Checking if server is running..."
check_server
echo "✅ Server is running"
echo

# Test 1: Start Xpra and Extension.js together
echo "🔧 Test 1: Starting Xpra and Extension.js together"
echo "This will start both Xpra and Extension.js dev server in one command"
echo

response=$(curl -s -X POST "$SERVER_URL/xpra/start-with-extension" \
    -H "Content-Type: application/json" \
    -d '{"extensionDir": "/tmp/extension"}')

echo "Response: $response"
echo

if echo "$response" | grep -q "successfully"; then
    echo "✅ Test 1 passed: Xpra and Extension.js started successfully"
    
    # Check status
    echo "📊 Checking Xpra status..."
    status=$(curl -s "$SERVER_URL/xpra/status")
    echo "Status: $status"
    echo
    
    echo "🌐 You can now access the Xpra session at:"
    echo "   http://localhost:10000"
    echo "   (The Extension.js dev server should be running within Xpra)"
    echo
    
    echo "⏸️  Test completed. The session is still running."
    echo "   To stop: curl -X POST $SERVER_URL/xpra/stop"
else
    echo "❌ Test 1 failed"
fi

echo
echo "🏁 Testing complete!"
echo
echo "📝 Available API endpoints:"
echo "   POST /xpra/start-only         - Start only Xpra (no browser)"
echo "   POST /extension/dev           - Start Extension.js dev in existing Xpra"
echo "   POST /xpra/start-with-extension - Start both together"
echo "   POST /xpra/stop               - Stop everything"
echo "   GET  /xpra/status             - Check status" 