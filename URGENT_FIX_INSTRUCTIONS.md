# 🚨 URGENT FIX: Class Extends Error

## The Problem
Your app won't start because of this error:
```
npm error Class extends value undefined is not a constructor or null
```

## Root Cause
**Line 59 in `package.json` has an invalid package version:**
```json
"zod": "^4.1.12"  ← THIS VERSION DOESN'T EXIST!
```

Zod's latest version is 3.x, not 4.x. This causes the package manager to fail, which breaks module loading, which causes the "Class extends value undefined" error.

## The Fix (3 Steps)

### Step 1: Stop the Server
Press `Ctrl+C` in your terminal to stop the dev server.

### Step 2: Edit package.json
Open `/home/user/rork-app/package.json` in a text editor and find line 59:

**Change this:**
```json
"zod": "^4.1.12",
```

**To this:**
```json
"zod": "^3.23.8",
```

Save the file.

### Step 3: Clean Install and Restart
Run these commands in your terminal:

```bash
# Navigate to your project
cd /home/user/rork-app

# Remove old installations
rm -rf node_modules
rm -f bun.lock

# Fresh install
bun install

# Clear Expo cache and start
npx expo start -c
```

## Expected Result
After these steps, you should see:
- ✅ No "Class extends value undefined" error
- ✅ Server starts successfully
- ✅ App loads in simulator/device
- ✅ Console shows: `[Supabase] Creating client with: { url: '...', keyPresent: true }`

## Additional Fixes Already Applied

I've already fixed these issues in your code:

### 1. Fixed `backend/hono.ts`
- Removed broken `import { cors } from "hono/cors"`
- Added working CORS middleware

### 2. Fixed `lib/supabase.ts`
- Better error handling for missing env vars
- Throws clear error instead of using placeholders

## If You Still Get Errors

### "Missing Supabase environment variables"
Your `.env` file is correct. This means the server needs a restart:
```bash
npx expo start -c
```

### "Failed to fetch" or tRPC errors
Update your backend URL in `.env`:
```bash
# When you start the server, look for the tunnel URL in the output
# It will look like: https://abc123.ngrok-free.app

# Update .env with that URL:
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-actual-tunnel-url.ngrok-free.app
```

Then restart:
```bash
npx expo start -c
```

## Why This Matters

Your app uses Zod for:
- ✅ tRPC input validation (all backend routes)
- ✅ Type-safe API schemas
- ✅ Runtime data validation

Without a working Zod installation, the entire backend fails to initialize, which causes the cryptic "Class extends value undefined" error.

## Quick Verification

After fixing, verify Zod is installed correctly:
```bash
bun list | grep zod
# Should show: zod@3.23.8 (or similar 3.x version)
```

## Summary

1. ❌ **Problem:** Invalid Zod version (4.x doesn't exist)
2. ✅ **Solution:** Change to Zod 3.x in package.json
3. 🔄 **Action:** Clean install and restart
4. ✅ **Result:** App starts successfully

**This is a simple fix that will resolve your issue immediately.**
