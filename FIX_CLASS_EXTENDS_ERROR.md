# Fix: "Class extends value undefined is not a constructor or null"

## Root Causes Identified

### 1. **Invalid Zod Version (PRIMARY ISSUE)**
Your `package.json` has `"zod": "^4.1.12"` but Zod v4 doesn't exist. The latest stable version is 3.x.
This causes npm/bun to fail during installation, leading to undefined module exports.

### 2. **Incorrect Hono CORS Import**
The `hono/cors` import in `backend/hono.ts` was causing module resolution issues.
✅ **FIXED** - Replaced with manual CORS middleware.

### 3. **Environment Variables**
Your `.env` file has the correct Supabase credentials, but the error handling was too lenient.
✅ **FIXED** - Now throws proper error if env vars are missing.

## How to Fix

### Step 1: Clean Everything
```bash
# Stop the dev server (Ctrl+C)

# Remove node_modules and lock files
rm -rf node_modules
rm -f bun.lock package-lock.json yarn.lock

# Clear Expo cache
npx expo start -c --clear
```

### Step 2: Fix Zod Version Manually
Edit `package.json` and change line 59:
```json
// FROM:
"zod": "^4.1.12",

// TO:
"zod": "^3.23.8",
```

### Step 3: Reinstall Dependencies
```bash
# Using bun (recommended for this project)
bun install

# OR using npm
npm install
```

### Step 4: Verify Backend Dependencies
The backend should now work with these fixed imports:
- ✅ Hono CORS: Manual middleware (no external package needed)
- ✅ Supabase: Proper error handling
- ✅ tRPC: Correct version compatibility

### Step 5: Restart Dev Server
```bash
# Clear cache and restart
npx expo start -c

# Or use your custom script
npm run start
```

## What Was Fixed in Code

### 1. `backend/hono.ts`
- ❌ Removed: `import { cors } from "hono/cors";`
- ✅ Added: Manual CORS middleware that works with Hono v4

### 2. `lib/supabase.ts`
- ✅ Now throws error immediately if env vars are missing (instead of using placeholders)
- ✅ Better error messages for debugging

## Testing After Fix

1. **Check if server starts without errors:**
   ```bash
   npx expo start -c
   ```
   You should see:
   - ✅ No "Class extends value undefined" error
   - ✅ Supabase client initialized successfully
   - ✅ Backend API running

2. **Test authentication:**
   - Try signing up with a new account
   - Try signing in with existing credentials
   - Check console logs for `[UserContext]` and `[Supabase]` messages

3. **Verify tRPC connection:**
   - Open the app
   - Check console for `[TRPC]` logs
   - Should see successful connection to backend

## If Issues Persist

### Error: "Missing Supabase environment variables"
Your `.env` file exists and has the correct values. This error means:
1. The dev server wasn't restarted after adding `.env`
2. The `.env` file isn't being loaded

**Fix:**
```bash
# Make sure .env is in the root directory
ls -la .env

# Restart with cache clear
npx expo start -c
```

### Error: "Failed to fetch" or "Network request failed"
This means the backend URL is incorrect.

**Fix:**
1. Check your tunnel URL when you start the server
2. Update `.env`:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-actual-tunnel-url.ngrok-free.app
   ```
3. Restart the server

### Error: Still seeing "Class extends value undefined"
This means Zod wasn't fixed properly.

**Verify:**
```bash
# Check installed zod version
npm list zod
# Should show: zod@3.23.8 (or similar 3.x version)

# If it shows 4.x or error, manually fix:
npm uninstall zod
npm install zod@^3.23.8
```

## Why This Happened

1. **Zod v4 doesn't exist** - Someone (or an AI tool) incorrectly specified version 4.x
2. **Package manager confusion** - When a package version doesn't exist, the package manager may install nothing or a broken version
3. **Module initialization order** - When dependencies are broken, JavaScript's class extension fails because the parent class is `undefined`

## Prevention

- Always verify package versions exist before adding to `package.json`
- Use `npm view <package> versions` to check available versions
- Keep dependencies up to date but use stable versions
- Test after adding new dependencies

## Summary

✅ **Fixed:** Hono CORS import issue
✅ **Fixed:** Supabase error handling
⚠️ **Manual fix needed:** Change Zod version from 4.x to 3.x in package.json
⚠️ **Then:** Clean install and restart

After following these steps, your app should start successfully and authentication should work with Supabase's native auth system.
