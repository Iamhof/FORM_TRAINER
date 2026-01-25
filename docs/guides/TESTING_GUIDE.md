# Testing Guide - Verify Supabase Setup

After running all database setup scripts, use this guide to verify everything works correctly.

## Step 1: Test Environment Variables

### 1.1 Restart Expo Dev Server

```powershell
cd "C:\My Apps\FORM_APP\form-pt-app"
npx expo start -c
```

The `-c` flag clears the cache to ensure environment variables are loaded fresh.

### 1.2 Check Console Logs

Look for these messages in your terminal:

**✅ Success indicators:**
```
[Supabase] Initializing client
[Supabase] URL: https://yshbcfifmkflhahjengk.supabase.co
[Supabase] Platform: ios (or android/web)
```

**❌ Error indicators:**
```
[Supabase] Missing environment variables: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY
```

If you see errors:
1. Check `env` file exists in project root
2. Verify variable names are correct (case-sensitive)
3. Ensure no extra spaces around `=` sign
4. Restart Expo again with `-c` flag

## Step 2: Test Account Creation

### 2.1 Sign Up a Test Account

1. Open the app on your phone/emulator
2. Navigate to Sign Up screen
3. Enter test credentials:
   - Email: `test@example.com` (or any email)
   - Password: `testpassword123`
   - Confirm password: `testpassword123`
4. Click "Sign Up"

### 2.2 Verify in Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project: `yshbcfifmkflhahjengk`
3. Navigate to **Authentication** → **Users**
4. You should see the new user with the email you used

### 2.3 Verify Profile Auto-Creation

1. In Supabase Dashboard, go to **Table Editor**
2. Select **profiles** table
3. You should see a new row with:
   - `user_id` matching the user from Authentication
   - `name` as empty string (default)
   - `role` as 'user'
   - `is_pt` as false

**✅ Success:** Profile was auto-created by the trigger

**❌ If profile not created:**
- Check trigger exists: Run verification query from `VERIFY_DATABASE_SETUP.sql`
- Check Supabase Dashboard → **Database** → **Triggers** for `on_auth_user_created`

## Step 3: Test Core Features

### 3.1 Test Programme Creation

1. In the app, navigate to create programme
2. Create a test programme with:
   - Name: "Test Programme"
   - Days: 3
   - Weeks: 4
   - Add some exercises
3. Save the programme

**Verify in Supabase:**
- Go to **Table Editor** → **programmes**
- Should see your new programme with `user_id` matching your test user

### 3.2 Test Workout Logging

1. In the app, start a workout session
2. Complete the workout
3. Log the workout

**Verify in Supabase:**
- Go to **Table Editor** → **workouts**
- Should see your completed workout

### 3.3 Test Leaderboard Opt-In

1. In the app, navigate to Leaderboard tab
2. Click "Get Started" or "Join Leaderboard"
3. Enter display name and select gender
4. Click "Join Leaderboard"

**Verify in Supabase:**
- Go to **Table Editor** → **leaderboard_profiles**
- Should see a new row with:
  - `user_id` matching your test user
  - `is_opted_in` as true
  - `display_name` as what you entered
  - `gender` as what you selected

**Verify in App:**
- After joining, you should see the leaderboard screen
- You should be able to select different leaderboard types
- Rankings should load (may be empty if no other users)

## Step 4: Test Data Persistence

### 4.1 Close and Reopen App

1. Close the app completely
2. Reopen the app
3. You should still be signed in (session persisted)

**✅ Success:** Session stored in SecureStore/localStorage

### 4.2 Verify Data Still Exists

1. Check your programmes are still there
2. Check your workouts are still there
3. Check leaderboard opt-in status is still there

**✅ Success:** All data persisted in Supabase

## Troubleshooting

### Issue: "Failed to fetch" or Network Errors

**Possible causes:**
1. Supabase project is paused (check Dashboard)
2. Environment variables not loaded (restart with `-c`)
3. Network connectivity issues
4. Incorrect Supabase URL in env file

**Solutions:**
- Verify Supabase project is active
- Check `EXPO_PUBLIC_SUPABASE_URL` matches your project URL exactly
- Verify you're on the same network (for local dev) or using tunnel mode

### Issue: Profile Not Auto-Creating

**Possible causes:**
1. Trigger not created
2. Trigger function has errors
3. RLS policies blocking insert

**Solutions:**
1. Run verification query to check trigger exists
2. Check Supabase Dashboard → **Database** → **Functions** for `handle_new_user`
3. Verify RLS policies allow inserts

### Issue: Can't Create Programmes/Workouts

**Possible causes:**
1. RLS policies too restrictive
2. User not authenticated
3. Missing tables

**Solutions:**
1. Verify tables exist (run verification queries)
2. Check RLS policies in Supabase Dashboard
3. Verify user is signed in (check Authentication → Users)

### Issue: Leaderboard Not Loading

**Possible causes:**
1. `leaderboard_stats` table not created
2. No stats calculated yet
3. RLS policies blocking access

**Solutions:**
1. Verify `leaderboard_stats` table exists
2. Stats are calculated when workouts are logged
3. Check RLS policies allow SELECT on leaderboard tables

## Success Checklist

- [ ] Environment variables load correctly (no errors in console)
- [ ] Can sign up new account
- [ ] Profile auto-creates on signup (visible in Supabase)
- [ ] Can create programmes (saved in Supabase)
- [ ] Can log workouts (saved in Supabase)
- [ ] Can join leaderboard (profile created in leaderboard_profiles)
- [ ] Leaderboard screen loads after opt-in
- [ ] Session persists after app restart
- [ ] All data persists in Supabase

## Next Steps

Once all tests pass:
- Your app is fully configured with Supabase
- All features should work correctly
- Data is securely stored in Supabase
- No dependency on Rork

You can now continue developing with confidence that your backend is properly set up!

