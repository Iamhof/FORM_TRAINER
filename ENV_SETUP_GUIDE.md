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
