#!/bin/bash

# Use full path to Bun
BUN_PATH="$HOME/.bun/bin/bun"

# Verify Bun is accessible
echo "Checking Bun installation..."
if [ ! -f "$BUN_PATH" ]; then
    echo "❌ Bun not found at $BUN_PATH"
    exit 1
fi

echo "✅ Bun found: $($BUN_PATH --version)"

# Start the server using full path
echo "Starting server..."
cd /home/user/rork-app
$BUN_PATH x rork start -p mv67vqriwoe5fscxfu5r0 --tunnel
