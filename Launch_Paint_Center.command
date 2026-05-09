#!/bin/bash
# Move to the directory where the script is located
cd "$(dirname "$0")"

echo "🚀 Starting Paint Center ERP..."

# Start the backend in the background using the protected (minified) code
cd backend
node index.min.js &

# Wait a second for the server to spin up
sleep 2

# Open the browser
open "http://localhost:3000"

echo "✅ App is running! You can minimize this window."
echo "⚠️  Closing this window will stop the app."

# Keep the window open so the server keeps running
wait
