# Quick Fix for "Class extends value undefined" Error

## The Problem

Your app is crashing with `Class extends value undefined is not a constructor or null` because:

1. **Environment variables are not being loaded** from your `.env` file
2. The Supabase client tries to initialize with `undefined` values
3. This causes a cascade of module loading failures

## The Solution

### Option 1: Restart with Clean Cache (Try This First)

```bash
# Stop the current server (Ctrl+C in terminal)

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo

# Restart Expo with clean cache
npx expo start -c
```

**Wait for the bundler to finish**, then reload the app.

### Option 2: Check Your .env File Location

Your `.env` file MUST be in the same directory as `package.json`:

```
/home/user/rork-app/
├── .env          ← Must be here
├── package.json  ← Same level
├── app/
├── backend/
└── ...
```

Run this to verify:
```bash
ls -la /home/user/rork-app/.env
```

If it doesn't exist or is in the wrong place, create it:

```bash
cat > /home/user/rork-app/.env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://yshbcfifmkflhahjengk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjI3NjcsImV4cCI6MjA3NTIzODc2N30.ide524ouRN9wDvl3gdcqL0QVEShOJpM720FNisSj-CQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY2Mjc2NywiZXhwIjoyMDc1MjM4NzY3fQ.H52cvIeL5fYTrVZXIGa6jC_fECfuUFr3BPT84Jkaoqk
JWT_SECRET=form_fitness_app_jwt_secret_2024_change_in_production_32chars_minimum
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
EOF
```

Then restart:
```bash
npx expo start -c
```

### Option 3: Debug Environment Variables

Run the debug script to see what's being loaded:

```bash
node debug-env.js
```

This will show you:
- Which environment variables are present
- Whether your .env file exists
- What variables are defined in it

### Option 4: Check the Logs

When you start the app, look for these log messages:

**Good (working):**
```
[Supabase] Creating client with: { url: 'https://yshbcfifmkflhahjengk.supabase.co', keyPresent: true, platform: 'ios' }
[TRPC] Base URL: http://localhost:8081
```

**Bad (not working):**
```
[Supabase] Creating client with: { url: 'MISSING', keyPresent: false, platform: 'ios' }
[Supabase] ⚠️  Missing environment variables!
```

## What I Changed

I've updated these files to handle missing environment variables gracefully:

1. **lib/supabase.ts** - Now uses lazy initialization and won't crash if env vars are missing
2. **lib/trpc.ts** - Falls back to localhost if API URL is missing
3. **backend/lib/auth.ts** - Won't crash if service role key is missing

These changes mean the app will start even if env vars are missing, but you'll see error messages in the console telling you what's wrong.

## Testing Sign Up/Sign In

Once the app starts successfully:

### To Sign Up:
1. Open the app
2. Navigate to the auth screen
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Tap "Sign Up"

### To Sign In:
1. Open the app
2. Navigate to the auth screen
3. Enter:
   - Email: test@example.com
   - Password: password123
4. Tap "Sign In"

### Check Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication > Users
4. You should see the new user
5. Go to Table Editor > profiles
6. You should see the user's profile

## Still Not Working?

If you're still getting the error after trying all the above:

1. **Check if you're in the right directory:**
   ```bash
   pwd
   # Should show: /home/user/rork-app
   ```

2. **Check if the .env file has the right content:**
   ```bash
   cat .env
   ```

3. **Try running from the project root:**
   ```bash
   cd /home/user/rork-app
   npx expo start -c
   ```

4. **Check for typos in environment variable names:**
   - Must be `EXPO_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
   - Must be `EXPO_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)

5. **Provide the full error log:**
   - Copy the entire terminal output
   - Include any error messages from the app
   - Share the output of `node debug-env.js`

## Why This Happened

The migration from custom tRPC auth to Supabase native auth introduced new dependencies on environment variables. The Supabase client needs these variables at module load time, but Expo wasn't loading them from the `.env` file properly.

This is a common issue with Expo and environment variables - they need to be:
1. Prefixed with `EXPO_PUBLIC_` for client-side code
2. Loaded before the app starts
3. Cached by the bundler

Restarting with a clean cache forces Expo to re-read the `.env` file and bundle the variables into the app.
