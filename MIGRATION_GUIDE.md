# Supabase Native Authentication Migration Guide

## Overview
This guide walks you through migrating your React Native app from custom tRPC-based authentication (with manual password hashing and JWT tokens) to Supabase's native authentication system. This resolves issues like "TRPCClientError: Failed to fetch," database query failures, and password verification errors.

## What Changed

### Before (Custom Auth)
- ❌ Manual password hashing with bcryptjs
- ❌ Custom JWT token generation and verification
- ❌ Custom `users` table in public schema
- ❌ Token stored in AsyncStorage
- ❌ Manual auth state management

### After (Supabase Native Auth)
- ✅ Supabase handles all password hashing securely
- ✅ Supabase JWT tokens (validated server-side)
- ✅ `auth.users` table + `profiles` table for user data
- ✅ Tokens stored in SecureStore (mobile) / localStorage (web)
- ✅ Real-time auth state with `onAuthStateChange`
- ✅ Case-insensitive email handling
- ✅ Automatic session refresh

## Migration Steps

### Step 1: Run Database Migration

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: `yshbcfifmkflhahjengk`
3. Go to **SQL Editor**
4. Copy the entire contents of `SUPABASE_MIGRATION.sql` (in your project root)
5. Paste into the SQL Editor and click **Run**

**What this does:**
- Drops the old `public.users` table
- Creates `public.profiles` table linked to `auth.users`
- Sets up a trigger to auto-create profiles on user signup
- Configures Row Level Security (RLS) policies
- Updates all existing table policies to use `auth.uid()`

**Verification:**
Run these queries in SQL Editor to confirm:
```sql
-- Check profiles table exists
SELECT * FROM public.profiles LIMIT 1;

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
```

### Step 2: Disable Email Confirmation (For Testing)

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Click on **Email**
3. Scroll to **Email Settings**
4. Toggle **OFF**: "Confirm email"
5. Click **Save**

**Note:** Re-enable this in production for security.

### Step 3: Clear Old Data

Since we're starting fresh (as per migration plan):

1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Delete any existing test users
3. This ensures clean slate for testing

### Step 4: Update Environment Variables

Verify your `.env` file has:
```env
EXPO_PUBLIC_SUPABASE_URL=https://yshbcfifmkflhahjengk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-tunnel-url.ngrok-free.app
```

**Important:** Update `EXPO_PUBLIC_RORK_API_BASE_URL` with your current ngrok tunnel URL.

### Step 5: Clear App Cache and Restart

```bash
# Clear Expo cache
npx expo start -c

# Or if using Rork CLI
bunx rork start -p mv67vqriwoe5fscxfu5r0 --tunnel -c
```

### Step 6: Test Authentication Flow

#### Test Sign-Up

1. Open your app (on simulator/device via QR code)
2. Navigate to the auth screen
3. Toggle to **Sign Up** mode
4. Enter:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** password123
   - **Confirm Password:** password123
5. Click **Sign Up**

**Expected Result:**
- ✅ User created in `auth.users` (check Supabase Dashboard > Authentication > Users)
- ✅ Profile created in `public.profiles` (check Table Editor)
- ✅ Redirected to home screen
- ✅ Console logs show:
  ```
  [UserContext] Signing up: test@example.com
  [UserContext] User created, updating profile with name: Test User
  [UserContext] Sign up successful
  [UserContext] Auth state changed: SIGNED_IN Session exists
  [UserContext] Loading profile for user: <uuid>
  [UserContext] Profile loaded: { name: 'Test User', ... }
  ```

**If it fails:**
- Check console for error messages
- Verify SQL migration ran successfully
- Ensure email confirmation is disabled
- Check Supabase logs (Dashboard > Logs)

#### Test Sign-In

1. Sign out (if signed in)
2. Navigate to auth screen
3. Toggle to **Sign In** mode
4. Enter:
   - **Email:** test@example.com
   - **Password:** password123
5. Click **Sign In**

**Expected Result:**
- ✅ Signed in successfully
- ✅ Redirected to home screen
- ✅ Console logs show:
  ```
  [UserContext] Signing in: test@example.com
  [UserContext] Sign in successful
  [UserContext] Auth state changed: SIGNED_IN Session exists
  ```

#### Test Session Persistence

1. Close the app completely
2. Reopen the app
3. **Expected:** Automatically signed in (no auth screen shown)

**Console logs:**
```
[UserContext] Initializing auth state...
[UserContext] Initial session: Found
[UserContext] Loading profile for user: <uuid>
```

#### Test Protected tRPC Routes

1. Sign in
2. Navigate to any screen that uses tRPC (e.g., Workouts, Programmes)
3. **Expected:** Data loads successfully

**Console logs:**
```
[TRPC] Request headers - Token present: true
[TRPC] Making request to: https://...
[AUTH] Verifying Supabase token...
[AUTH] Token verified for user: <uuid>
```

**If tRPC fails:**
- Check `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
- Verify backend server is running
- Check network connectivity (use device IP for Android emulator)

### Step 7: Test Edge Cases

#### Invalid Credentials
- Try signing in with wrong password
- **Expected:** Alert: "Invalid email or password"

#### Duplicate Email
- Try signing up with existing email
- **Expected:** Alert with Supabase error (e.g., "User already registered")

#### Weak Password
- Try signing up with password < 6 characters
- **Expected:** Alert: "Password must be at least 6 characters"

#### Network Failure
- Turn off WiFi/data
- Try signing in
- **Expected:** User-friendly error message

## Troubleshooting

### Issue: "Failed to fetch" on Sign-Up/Sign-In

**Cause:** Network issue or wrong Supabase URL

**Fix:**
1. Check `.env` has correct `EXPO_PUBLIC_SUPABASE_URL`
2. Verify internet connection
3. Check Supabase project is active (not paused)

### Issue: "Profile not found" after Sign-In

**Cause:** Trigger didn't create profile, or RLS blocking access

**Fix:**
1. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Manually create profile:
   ```sql
   INSERT INTO public.profiles (user_id, name, role, is_pt)
   VALUES ('<user_id_from_auth.users>', 'Test User', 'user', false);
   ```
3. Check RLS policies allow SELECT for own profile

### Issue: tRPC Routes Return "UNAUTHORIZED"

**Cause:** Token not being sent or invalid

**Fix:**
1. Check console for `[TRPC] Request headers - Token present: true`
2. If false, check session exists:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```
3. Try signing out and back in to refresh token

### Issue: "Email not confirmed" Error

**Cause:** Email confirmation is enabled

**Fix:**
1. Disable in Supabase Dashboard (see Step 2)
2. Or confirm email manually in Dashboard > Authentication > Users > Click user > Confirm email

### Issue: App Crashes on Startup

**Cause:** Likely SecureStore issue on web

**Fix:**
- Check `lib/supabase.ts` has web fallback to localStorage
- Clear browser cache/localStorage
- Restart dev server with `-c` flag

## Verification Checklist

After migration, verify:

- [ ] Sign-up creates user in `auth.users`
- [ ] Sign-up creates profile in `public.profiles` with correct name
- [ ] Sign-in works with correct credentials
- [ ] Sign-in fails with wrong credentials (shows error)
- [ ] Session persists after app restart
- [ ] Sign-out clears session
- [ ] Protected tRPC routes work (e.g., fetch programmes)
- [ ] Console shows no errors related to auth
- [ ] Supabase Dashboard > Logs shows no errors

## Code Changes Summary

### Files Modified
1. **lib/supabase.ts** - Added SecureStore adapter for session persistence
2. **contexts/UserContext.tsx** - Rewritten to use Supabase auth with `onAuthStateChange`
3. **lib/trpc.ts** - Updated to use Supabase `access_token` in headers
4. **backend/lib/auth.ts** - Replaced custom JWT with Supabase token verification
5. **backend/trpc/create-context.ts** - Updated to verify Supabase tokens
6. **backend/trpc/routes/auth/me/route.ts** - Updated to query `profiles` table

### Files Deleted
1. **backend/trpc/routes/auth/signup/route.ts** - No longer needed (Supabase handles)
2. **backend/trpc/routes/auth/signin/route.ts** - No longer needed (Supabase handles)

### Dependencies Added
- `expo-secure-store` - For secure token storage on mobile

### Dependencies Removed (Can Clean Up)
- `bcryptjs` - No longer needed
- `@types/bcryptjs` - No longer needed
- `jsonwebtoken` - No longer needed
- `@types/jsonwebtoken` - No longer needed

To remove:
```bash
bun remove bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken
```

## Security Improvements

✅ **Passwords never stored in plain text** - Supabase uses bcrypt with proper salting
✅ **Secure token storage** - SecureStore on mobile, localStorage on web
✅ **Automatic token refresh** - No manual refresh logic needed
✅ **Case-insensitive emails** - Supabase handles this automatically
✅ **Row Level Security** - Users can only access their own data
✅ **No custom JWT secrets** - Supabase manages keys securely

## Next Steps

1. **Test on physical device** - Ensure SecureStore works correctly
2. **Re-enable email confirmation** - For production security
3. **Add password reset** - Implement via `supabase.auth.resetPasswordForEmail()`
4. **Add social auth** - Optional: Google, Apple, etc. via Supabase
5. **Monitor Supabase logs** - Check for any auth errors in production

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Review Supabase Dashboard > Logs
3. Verify all migration steps completed
4. Check this guide's Troubleshooting section

## Rollback (If Needed)

If you need to rollback (not recommended):
1. Restore `public.users` table from backup
2. Revert code changes via git
3. Reinstall removed dependencies

**Note:** This will bring back the original auth issues.
