#!/bin/bash

echo "Cleaning up dependencies..."

# Remove node_modules and lock file
rm -rf node_modules
rm -f bun.lock

echo "Reinstalling dependencies..."
bun install

echo "Done! Now run: npx rork start"
