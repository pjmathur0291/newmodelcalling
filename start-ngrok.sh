#!/bin/bash

# Start ngrok in the background and capture its URL
ngrok http 3000 --log=stdout > ngrok.log &
NGROK_PID=$!

# Wait a few seconds for ngrok to initialize
sleep 5

# Extract the https URL from the ngrok logs
URL=$(grep -o "https://[a-z0-9.-]*\.ngrok-free.app" ngrok.log | head -n 1)

if [ -z "$URL" ]; then
  echo "❌ Could not get ngrok URL"
  kill $NGROK_PID
  exit 1
fi

echo "✅ Ngrok URL: $URL"

# Update .env file (replace APP_BASE_URL line)
sed -i '' "s|^APP_BASE_URL=.*|APP_BASE_URL=$URL|" .env

echo "🔄 Updated .env with new APP_BASE_URL=$URL"

# Restart your Node server
echo "🚀 Starting Node.js server..."
npm run dev

# Kill ngrok when you stop Node
kill $NGROK_PID

