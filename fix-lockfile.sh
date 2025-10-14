#!/bin/bash
set -e

echo "🔧 Fixing zod version mismatch..."

# Remove the lockfile completely
rm -f bun.lock

# Remove node_modules
rm -rf node_modules

# Clear bun cache
bun pm cache rm

# Reinstall everything fresh
bun install

echo "✅ Done! Now run: npx rork start"
