# EAS Environment Variables Setup Guide

## Problem
The app crashes immediately on launch in TestFlight because required environment variables are not set in the EAS build configuration.

## Solution
Set the required environment variables as EAS secrets for your production builds.

## Required Environment Variables

1. **EXPO_PUBLIC_SUPABASE_URL** - Your Supabase project URL
2. **EXPO_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key

## Steps to Fix

### 1. Get Your Supabase Credentials

Your Supabase credentials are in the `env` file in the project root:
- `EXPO_PUBLIC_SUPABASE_URL=https://yshbcfifmkflhahjengk.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Set EAS Secrets

Run these commands in your terminal (from the `rork-OJ-form-main` directory):

```bash
# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://yshbcfifmkflhahjengk.supabase.co"

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjI3NjcsImV4cCI6MjA3NTIzODc2N30.ide524ouRN9wDvl3gdcqL0QVEShOJpM720FNisSj-CQ"
```

**Note:** Replace the values above with your actual credentials from your `env` file.

### 3. Verify Secrets Are Set

```bash
eas secret:list
```

You should see both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the list.

### 4. Rebuild Your App

After setting the secrets, rebuild your app:

```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

### 5. Submit to TestFlight/App Store

After the build completes, submit it:

```bash
# For iOS
eas submit --platform ios --profile production

# For Android
eas submit --platform android --profile production
```

## Optional: Set API Base URL (if using backend)

If you have a deployed backend API, you can also set:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_RORK_API_BASE_URL --value "https://your-api-url.com"
```

## Verification

After setting secrets and rebuilding:
1. The app should no longer crash immediately on launch
2. If env vars are still missing, you'll see a helpful error screen with instructions
3. Check the app logs to verify environment variables are loaded correctly

## Troubleshooting

### Secrets not working?
- Make sure you're using `--scope project` (not `--scope account`)
- Verify secrets are set for the correct EAS project
- Check that you're using the `production` build profile (or the profile that uses these secrets)

### Still seeing crashes?
- Check the EAS build logs for environment variable errors
- Verify the secret names match exactly (case-sensitive)
- Ensure you've rebuilt the app after setting secrets

## Additional Resources

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
