#!/bin/bash

# Add Bun to PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Verify Bun is accessible
echo "Checking Bun installation..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found in PATH"
    exit 1
fi

echo "✅ Bun found: $(bun --version)"

# Start the server
echo "Starting server..."
cd /home/user/rork-app
bun run start
