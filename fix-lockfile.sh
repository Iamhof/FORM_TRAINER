#!/bin/bash
set -e

echo "🔧 Fixing zod version mismatch..."

# Remove the lockfile completely
rm -f bun.lock

# Remove node_modules
rm -rf node_modules

# Clear bun cache completely
rm -rf ~/.bun/install/cache

# Force install with exact version
bun add zod@3.23.8 --exact

# Reinstall everything else
bun install

echo "✅ Done! Now run: npx rork start"
