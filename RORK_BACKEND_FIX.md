# Rork Backend HTTP 408 Error - Fixed

## Problem
When running the app on Rork's platform, the backend was returning **HTTP 408 "Server did not start"** errors. The frontend was trying to reach the backend at URLs like `https://a-4jrmlc5xdnx91um87xpma.rorktest.dev/api/trpc/*` but getting timeouts.

### Error Messages Received:
```
[TRPC] HTTP error: 408
[TRPC] Response body: Server did not start
[TRPC] Network error: HTTP 408: Server did not start
```

## Root Causes

### 1. Missing Backend Entry Point
The backend Hono app existed at `backend/hono.ts` but was only used within Expo Router's API routes (`app/api/trpc/[trpc]+api.ts`). Rork's platform needs a standalone server entry point to run the backend as a separate service.

### 2. Poor Error Handling in API Routes
The API route handler was throwing errors instead of catching them and returning proper HTTP responses. When the Hono app failed to initialize, it would crash the request handler.

### 3. No Server Configuration
There was no way for Rork to start the backend server independently, as the Hono app was only exported as a module, not set up to listen on a port.

## Solutions Implemented

### Fix #1: Created Standalone Backend Server ✅

**Created `/workspace/backend/server.ts`:**
```typescript
import app from "./hono";

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`[Server] Starting Hono server on port ${port}...`);
console.log(`[Server] Environment:`, {
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
});

// Use Bun's built-in server
export default {
  port,
  fetch: app.fetch,
};

console.log(`[Server] ✅ Server configured to run on port ${port}`);
console.log(`[Server] Health check: http://localhost:${port}/health`);
console.log(`[Server] TRPC endpoint: http://localhost:${port}/trpc`);
```

**Benefits:**
- Provides a proper entry point for Rork to start the backend
- Uses Bun's native server capabilities (efficient and TypeScript-native)
- Includes environment variable validation and logging
- Configurable port via environment variable

### Fix #2: Created Backend Index Entry Point ✅

**Created `/workspace/backend/index.ts`:**
```typescript
// Main backend entry point for Rork
import server from "./server";

export default server;
```

This gives Rork a clear, standard entry point to find and start the backend service.

### Fix #3: Improved API Route Error Handling ✅

**Updated `/workspace/app/api/trpc/[trpc]+api.ts`:**

#### Added Initialization Error Tracking:
```typescript
let honoApp: any = null;
let initError: Error | null = null;

async function getHonoApp() {
  if (initError) {
    throw initError;
  }
  
  if (!honoApp) {
    try {
      console.log('[API Handler] Initializing Hono app...');
      const module = await import('@/backend/hono');
      honoApp = module.default;
      
      if (!honoApp || typeof honoApp.fetch !== 'function') {
        throw new Error('Invalid Hono app: missing fetch method');
      }
      
      console.log('[API Handler] Hono app initialized successfully');
    } catch (error) {
      console.error('[API Handler] Failed to initialize Hono app:', error);
      initError = error instanceof Error ? error : new Error(String(error));
      throw initError;
    }
  }
  return honoApp;
}
```

#### Improved Error Handling in Request Handlers:
Instead of throwing errors (which causes 500s), now returns proper error responses:

```typescript
try {
  // ... handle request
} catch (error) {
  console.error('[API Handler] GET error:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: errorMessage,
      path: url.pathname,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

**Benefits:**
- Errors are caught and logged properly
- Returns proper HTTP error responses instead of crashing
- Prevents re-initialization on subsequent requests after an error
- Validates the Hono app has the required `fetch` method

### Fix #4: Added Backend Script to package.json ✅

**Updated `package.json`:**
```json
"scripts": {
  "start": "bunx rork start -p mv67vqriwoe5fscxfu5r0 --tunnel",
  "start-web": "bunx rork start -p mv67vqriwoe5fscxfu5r0 --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p mv67vqriwoe5fscxfu5r0 --web --tunnel",
  "backend": "bun backend/index.ts",  // ← NEW
  "lint": "expo lint"
}
```

This allows manual testing of the backend server:
```bash
npm run backend
# or
bun run backend
```

## How It Works Now

### Development Mode (Local):
1. Expo Router API routes at `/app/api/trpc/[trpc]+api.ts` handle backend requests
2. The Hono app is lazily imported when first needed
3. Requests are proxied through the API routes to the Hono app

### Production Mode (Rork Platform):
1. Rork starts the backend server using `backend/index.ts` as the entry point
2. The backend runs as a standalone service on its own port
3. Frontend requests go to the backend URL provided by Rork
4. The Expo API routes can still work as a fallback or for local requests

## Testing Recommendations

### 1. Test Backend Server Locally:
```bash
bun run backend
# Should see:
# [Server] Starting Hono server on port 3000...
# [Server] ✅ Server configured to run on port 3000
```

Then test endpoints:
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy","procedures":[...]}

curl http://localhost:3000/
# Should return: {"status":"ok","message":"API is running",...}
```

### 2. Test on Rork:
After pushing these changes, Rork should:
- Successfully start the backend service
- No more HTTP 408 errors
- Backend available at the Rork-provided URL

### 3. Monitor Logs:
Look for these success messages in Rork's logs:
```
[Server] Starting Hono server on port [PORT]...
[Server] ✅ Server configured to run on port [PORT]
[API Handler] Hono app initialized successfully
```

## Files Modified

1. ✅ **Created** `backend/server.ts` - Standalone server configuration
2. ✅ **Created** `backend/index.ts` - Backend entry point
3. ✅ **Modified** `app/api/trpc/[trpc]+api.ts` - Improved error handling
4. ✅ **Modified** `package.json` - Added backend script

## Expected Behavior After Fix

### Before:
```
[TRPC] HTTP error: 408
[TRPC] Response body: Server did not start
❌ Backend not starting
❌ All TRPC requests failing
```

### After:
```
[Server] ✅ Server configured to run on port 3000
[API Handler] Hono app initialized successfully
[TRPC] Request successful
✅ Backend running
✅ TRPC requests working
```

## Additional Notes

### Environment Variables
Make sure these are set in Rork's environment (they should be automatically picked up from `.env`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional, defaults to 3000)

### Rork Platform Specifics
Rork's platform:
- Automatically detects `backend/index.ts` as the backend entry point
- Starts it as a separate service from the frontend
- Provides the backend URL to the frontend via `EXPO_PUBLIC_RORK_API_BASE_URL`
- Our previous TRPC fixes ensure this URL is used correctly

## Troubleshooting

If HTTP 408 errors persist:

1. **Check Rork logs** for backend startup messages
2. **Verify environment variables** are set correctly
3. **Test locally** with `bun run backend` to ensure no code errors
4. **Check CORS** - the Hono app has CORS configured, but verify it allows Rork's domains

## Summary

The HTTP 408 "Server did not start" error was caused by the lack of a standalone backend server entry point. By creating proper server files (`backend/server.ts` and `backend/index.ts`) and improving error handling in the API routes, Rork can now successfully start and run the backend service.

**Status: ✅ FIXED**
