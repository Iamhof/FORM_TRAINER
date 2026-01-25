# Environment Variables Setup Guide

## Current Issue
The app is failing to start with the error: `Class extends value undefined is not a constructor or null`

This is caused by environment variables not being loaded properly from the `.env` file.

## Your Current .env File
```
EXPO_PUBLIC_SUPABASE_URL=https://yshbcfifmkflhahjengk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjI3NjcsImV4cCI6MjA3NTIzODc2N30.ide524ouRN9wDvl3gdcqL0QVEShOJpM720FNisSj-CQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY2Mjc2NywiZXhwIjoyMDc1MjM4NzY3fQ.H52cvIeL5fYTrVZXIGa6jC_fECfuUFr3BPT84Jkaoqk
JWT_SECRET=form_fitness_app_jwt_secret_2024_change_in_production_32chars_minimum
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-tunnel-url.ngrok-free.app
```

## Solution Steps

### Step 1: Clear All Caches
```bash
# Stop the current server (Ctrl+C)

# Clear Expo cache
rm -rf node_modules/.cache

# Clear Metro bundler cache
rm -rf .expo

# Clear watchman cache (if you have watchman installed)
watchman watch-del-all 2>/dev/null || true
```

### Step 2: Restart the Development Server
```bash
# Start with clean cache
npx expo start -c

# Or if using the custom start script
bun run start
```

### Step 3: If Still Not Working - Check babel.config.js

Your `babel.config.js` should look like this:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'nativewind/babel',
    ],
  };
};
```

### Step 4: Alternative - Use app.json for Configuration

If environment variables still don't work, you can hardcode them in `app.json` (NOT recommended for production):

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://yshbcfifmkflhahjengk.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

Then update `lib/supabase.ts` to read from Constants:

```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;
```

### Step 5: Verify Environment Variables Are Loaded

Add this temporary debug code to `app/index.tsx`:

```typescript
console.log('ENV CHECK:', {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
  apiUrl: process.env.EXPO_PUBLIC_RORK_API_BASE_URL ? 'PRESENT' : 'MISSING',
});
```

## Common Issues

### Issue 1: .env file not in root directory
**Solution**: Ensure `.env` is in the same directory as `package.json`

### Issue 2: Environment variables not prefixed with EXPO_PUBLIC_
**Solution**: All client-side env vars must start with `EXPO_PUBLIC_`

### Issue 3: Server not restarted after .env changes
**Solution**: Always restart with `npx expo start -c` after changing `.env`

### Issue 4: Using wrong .env file
**Solution**: Expo looks for `.env` by default. If using `.env.local`, rename it to `.env`

## Testing

After following the steps above, you should see these logs when the app starts:

```
[Supabase] Initializing with: { url: 'https://yshbcfifmkflhahjengk.supabase.co', keyPresent: true, platform: 'ios' }
[TRPC] Base URL: https://your-tunnel-url.ngrok-free.app
```

If you see "MISSING" instead, the environment variables are not being loaded.

## Next Steps

Once environment variables are loading correctly:

1. Try signing up with a new account
2. Check the Supabase dashboard to verify the user was created
3. Try signing in with the new account
4. Check that the profile was created in the `profiles` table

## Need Help?

If you're still having issues, please provide:
1. The output of `npx expo start -c`
2. Any error messages in the terminal
3. Any error messages in the app
4. The contents of your `babel.config.js` file

---

## Production Environment Setup

### Required Variables (Client-Side)
These are bundled into the app and visible in the app bundle:

1. **EXPO_PUBLIC_SUPABASE_URL**
   - Description: Your Supabase project URL
   - Example: `https://your-project.supabase.co`
   - How to get: Supabase Dashboard > Project Settings > API > Project URL
   - Security: Public (safe to expose, protected by RLS)

2. **EXPO_PUBLIC_SUPABASE_ANON_KEY**
   - Description: Supabase anonymous/public key
   - Example: `eyJhbGci...`
   - How to get: Supabase Dashboard > Project Settings > API > anon/public key
   - Security: Public (designed to be exposed, protected by RLS)

### Optional Variables (Client-Side)

3. **EXPO_PUBLIC_RORK_API_BASE_URL**
   - Description: Backend API base URL for production
   - Example: `https://api.yourapp.com` or `https://your-app.vercel.app`
   - Default: Uses localhost in development
   - Security: Public

4. **EXPO_PUBLIC_LOG_LEVEL**
   - Description: Logging level for production
   - Values: `debug`, `info`, `warn`, `error`
   - Default: `error` in production, `debug` in development
   - Security: Public
   - Recommendation: Set to `error` for production

5. **EXPO_PUBLIC_SENTRY_DSN** ⭐ NEW - Remote Logging
   - Description: Sentry Data Source Name for production error tracking
   - Example: `https://abc123@o123456.ingest.sentry.io/7890123`
   - How to get: 
     1. Sign up at https://sentry.io
     2. Create a new React Native project
     3. Copy the DSN from Project Settings > Client Keys (DSN)
   - Security: Public (designed to be exposed)
   - Usage: Enables remote error tracking and log aggregation in production
   - Benefits:
     - Captures production errors with full context
     - Stores log breadcrumbs for debugging
     - Automatic performance monitoring
     - User session tracking
   - Recommendation: **HIGHLY RECOMMENDED** for production apps
   - Note: Only active in production mode, logs locally in development

6. **EXPO_PUBLIC_WEB_URL**
   - Description: Web app URL (if applicable)
   - Example: `https://yourapp.com`
   - Security: Public

### Server-Side Only Variables

6. **SUPABASE_SERVICE_ROLE_KEY**
   - Description: Supabase service role key (full access)
   - How to get: Supabase Dashboard > Project Settings > API > service_role key
   - Security: SECRET - Never expose to client
   - Usage: Only in backend/server code
   - Note: Not used in Expo app, but needed if you have a separate backend

7. **NODE_ENV**
   - Description: Environment mode
   - Values: `development`, `production`, `test`
   - Default: `development`
   - Security: Can be public

## Setting Production Variables

### For EAS Builds

Use EAS Secrets (recommended for production):

```bash
# Install EAS CLI (if not already installed)
bun i -g @expo/eas-cli

# Login to Expo
eas login

# Set secrets (replace with your actual values)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
eas secret:create --scope project --name EXPO_PUBLIC_RORK_API_BASE_URL --value "https://api.yourapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_LOG_LEVEL --value "error"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://your-sentry-dsn@sentry.io/project-id"

# List all secrets to verify
eas secret:list

# Delete a secret if needed
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL
```

**Important:** EAS secrets are automatically injected during the build process. You don't need to create a `.env` file for production builds.

### For Local Production Testing

Create `.env.production` file (DO NOT commit to git):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.yourapp.com
EXPO_PUBLIC_LOG_LEVEL=error
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EXPO_PUBLIC_WEB_URL=https://yourapp.com
```

**Note:** Expo doesn't automatically load `.env.production`. You may need to use a tool like `dotenv` or manually set variables.

## Verification

After setting variables, verify they load correctly:

```bash
# In development
bun run start

# Check console for env validation messages
# Should see: [Env] Validation successful (or error if missing)
```

## Security Notes

- ✅ EXPO_PUBLIC_* variables are safe to expose (designed for client)
- ❌ Never expose SUPABASE_SERVICE_ROLE_KEY
- ✅ Use Supabase Row Level Security (RLS) to protect data
- ✅ Anon key is protected by RLS policies
- ✅ Always use HTTPS URLs in production
