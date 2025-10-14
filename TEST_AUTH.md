# Testing Authentication After Fix

Once your app starts successfully (no more "Class extends value undefined" error), follow these steps to test authentication.

## Pre-Test Checklist

✅ App starts without errors
✅ You see these logs in the console:
```
[Supabase] Creating client with: { url: 'https://yshbcfifmkflhahjengk.supabase.co', keyPresent: true, platform: 'ios' }
```
✅ No "MISSING" environment variable warnings

## Test 1: Sign Up with New Account

### Steps:
1. Open the app
2. You should see the onboarding or auth screen
3. Navigate to the Sign Up form
4. Enter:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** TestPass123!
5. Tap "Sign Up" button

### Expected Result:
- ✅ No error messages
- ✅ User is created in Supabase
- ✅ Automatically signed in
- ✅ Redirected to profile setup or home screen
- ✅ Console shows: `[UserContext] Sign up successful`

### If It Fails:
Check the console for error messages:
- `Sign up error: User already registered` → Email already exists, try a different email
- `Sign up error: Password should be at least 6 characters` → Use a longer password
- `TRPCClientError: Failed to fetch` → Backend connection issue, check EXPO_PUBLIC_RORK_API_BASE_URL
- `Database error` → Check Supabase RLS policies

## Test 2: Verify User in Supabase Dashboard

### Steps:
1. Go to https://supabase.com/dashboard
2. Select your project (yshbcfifmkflhahjengk)
3. Navigate to **Authentication** > **Users**
4. Look for test@example.com

### Expected Result:
- ✅ User exists with email test@example.com
- ✅ Email confirmed (or pending if email confirmation is enabled)
- ✅ Created timestamp is recent

### Also Check Profiles Table:
1. Navigate to **Table Editor** > **profiles**
2. Look for a row with the user's ID

### Expected Result:
- ✅ Profile row exists
- ✅ `user_id` matches the auth user's ID
- ✅ `name` is "Test User"
- ✅ `role` is "user" (or null)
- ✅ `is_pt` is false

## Test 3: Sign Out

### Steps:
1. In the app, navigate to Profile or Settings
2. Tap "Sign Out" button

### Expected Result:
- ✅ Redirected to auth screen
- ✅ Console shows: `[UserContext] Signing out`
- ✅ No errors

## Test 4: Sign In with Existing Account

### Steps:
1. On the auth screen, navigate to Sign In form
2. Enter:
   - **Email:** test@example.com
   - **Password:** TestPass123!
3. Tap "Sign In" button

### Expected Result:
- ✅ No error messages
- ✅ Successfully signed in
- ✅ Redirected to home screen
- ✅ Console shows: `[UserContext] Sign in successful`
- ✅ User profile loads correctly

### If It Fails:
Check the console for error messages:
- `Sign in error: Invalid login credentials` → Wrong email or password
- `Sign in error: Email not confirmed` → Check email for confirmation link (if enabled)
- `User not found` → User doesn't exist in database
- `TRPCClientError: Failed to fetch` → Backend connection issue

## Test 5: Sign In with Wrong Password

### Steps:
1. On the auth screen, navigate to Sign In form
2. Enter:
   - **Email:** test@example.com
   - **Password:** WrongPassword123
3. Tap "Sign In" button

### Expected Result:
- ✅ Error message displayed: "Invalid login credentials" or similar
- ✅ User stays on auth screen
- ✅ No crash

## Test 6: Sign Up with Existing Email

### Steps:
1. On the auth screen, navigate to Sign Up form
2. Enter:
   - **Name:** Another User
   - **Email:** test@example.com (same as before)
   - **Password:** TestPass123!
3. Tap "Sign Up" button

### Expected Result:
- ✅ Error message displayed: "User already registered" or similar
- ✅ User stays on auth screen
- ✅ No crash

## Test 7: Profile Setup (if applicable)

If your app has a profile setup screen after sign-up:

### Steps:
1. Sign up with a new account
2. You should be redirected to profile setup
3. Fill in any additional fields (e.g., role selection)
4. Tap "Complete Setup" or similar

### Expected Result:
- ✅ Profile updated in Supabase
- ✅ Redirected to home screen
- ✅ No errors

## Test 8: Session Persistence

### Steps:
1. Sign in to the app
2. Close the app completely (swipe away from app switcher)
3. Reopen the app

### Expected Result:
- ✅ User is still signed in
- ✅ No need to sign in again
- ✅ Profile loads automatically
- ✅ Console shows: `[UserContext] Initial session: Found`

## Test 9: Protected Routes

### Steps:
1. Without signing in, try to access protected screens (e.g., workouts, programmes)

### Expected Result:
- ✅ Redirected to auth screen
- ✅ Or shown a "Please sign in" message
- ✅ No crash

## Common Issues and Solutions

### Issue: "TRPCClientError: Failed to fetch"
**Cause:** Backend server not running or wrong URL
**Solution:** 
- Check that `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
- If using tunnel, ensure the tunnel URL is up to date
- Try using `http://localhost:8081` for local development

### Issue: "Database error" or "permission denied"
**Cause:** Row Level Security (RLS) policies blocking access
**Solution:**
- Check Supabase RLS policies for `profiles` table
- Ensure policies allow authenticated users to read/write their own data
- See `FIX_RLS_ISSUE.sql` for policy examples

### Issue: "Email not confirmed"
**Cause:** Email confirmation is enabled in Supabase
**Solution:**
- Disable email confirmation: Supabase Dashboard > Authentication > Providers > Email > Confirm email: OFF
- Or check your email for confirmation link

### Issue: User created but profile not created
**Cause:** Database trigger not working
**Solution:**
- Check that the `handle_new_user()` trigger exists
- Run the SQL from `SUPABASE_MIGRATION.sql` to create it
- Or manually insert profile after sign-up

### Issue: "Invalid JWT" or "Token expired"
**Cause:** Token verification failing on backend
**Solution:**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in backend
- Ensure backend is using the same Supabase project
- Check backend logs for auth errors

## Success Criteria

All tests should pass with:
- ✅ No crashes
- ✅ Appropriate error messages for invalid inputs
- ✅ Successful sign-up creates user and profile
- ✅ Successful sign-in loads user data
- ✅ Session persists across app restarts
- ✅ Sign-out works correctly

## Next Steps After Successful Auth

Once authentication is working:

1. **Test Programme Creation:**
   - Create a new workout programme
   - Verify it saves to Supabase
   - Check that it appears in the programmes list

2. **Test Workout Logging:**
   - Start a workout session
   - Log exercises and sets
   - Complete the workout
   - Verify data is saved

3. **Test Analytics:**
   - Check that workout data appears in analytics
   - Verify charts and stats are calculated correctly

4. **Test PT Features (if applicable):**
   - Test PT invitation flow
   - Test client management
   - Test programme sharing

## Need Help?

If any test fails, provide:
1. Which test failed
2. The exact error message
3. Console logs (both app and backend)
4. Screenshots if applicable
5. Output of `node debug-env.js`
