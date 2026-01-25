# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Form-PT-App. Follow these steps in order.

## Prerequisites

1. ✅ Environment variables are configured in `env` file
2. Access to Supabase Dashboard: https://app.supabase.com
3. Your project: `yshbcfifmkflhahjengk`

## Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `yshbcfifmkflhahjengk`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run Core Database Setup

### 2.1 Copy COMPLETE_DATABASE_SETUP.sql

1. Open `COMPLETE_DATABASE_SETUP.sql` in your project
2. Copy the **entire contents** of the file
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

**What this creates:**
- `profiles` table (user profiles)
- `programmes` table (workout programmes)
- `workouts` table (completed workouts)
- `analytics` table (exercise performance)
- `pt_client_relationships` table (PT-client connections)
- `pt_invitations` table (invitation system)
- `shared_programmes` table (PT-shared programmes)
- `client_progress_sharing` table (privacy settings)
- All indexes, triggers, and RLS policies

**⚠️ Important:** This script DROPS existing tables first. If you have data, backup first!

**Expected Result:** You should see a success message and a table showing 8 tables created.

## Step 3: Run Leaderboard Setup

### 3.1 Run CREATE_LEADERBOARD_PROFILES_TABLE.sql

1. In Supabase SQL Editor, click **New Query** (or clear current query)
2. Open `CREATE_LEADERBOARD_PROFILES_TABLE.sql` in your project
3. Copy the **entire contents**
4. Paste into SQL Editor
5. Click **Run**

**What this creates:**
- `leaderboard_profiles` table (opt-in settings, display names)
- Indexes for performance
- RLS policies
- Trigger for updated_at

**Expected Result:** Success message: "leaderboard_profiles table created successfully!"

### 3.2 Run FIX_LEADERBOARD_TABLES.sql

1. In Supabase SQL Editor, click **New Query**
2. Open `FIX_LEADERBOARD_TABLES.sql` in your project
3. Copy the **entire contents**
4. Paste into SQL Editor
5. Click **Run**

**What this creates/updates:**
- `leaderboard_profiles` table (if not exists)
- `leaderboard_stats` table (volume, sessions, rankings)
- All indexes and RLS policies
- Database functions

**Expected Result:** Success message with "LEADERBOARD TABLES SETUP COMPLETE!"

## Step 4: Verify Database Setup

### Option A: Run Complete Verification Script

1. In Supabase SQL Editor, click **New Query**
2. Open `VERIFY_DATABASE_SETUP.sql` in your project
3. Copy the **entire contents**
4. Paste into SQL Editor
5. Click **Run**

This will run all verification checks and provide a summary report.

### Option B: Run Individual Verification Queries

Run these verification queries one by one in Supabase SQL Editor:

### 4.1 Check All Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles',
  'programmes',
  'workouts',
  'analytics',
  'leaderboard_profiles',
  'leaderboard_stats',
  'pt_client_relationships',
  'pt_invitations',
  'shared_programmes',
  'client_progress_sharing'
)
ORDER BY table_name;
```

**Expected:** Should return 10 rows (one for each table)

### 4.2 Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 
  'programmes', 
  'workouts', 
  'analytics', 
  'leaderboard_profiles', 
  'leaderboard_stats'
);
```

**Expected:** All should show `rowsecurity = true`

### 4.3 Check Triggers Exist

```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN (
  'on_auth_user_created', 
  'set_updated_at', 
  'trigger_update_leaderboard_profiles_updated_at'
);
```

**Expected:** Should return at least `on_auth_user_created` trigger

## Step 5: Optional - Additional Tables

### 5.1 Body Metrics Table (if using body metrics feature)

1. In Supabase SQL Editor, click **New Query**
2. Open `BODY_METRICS_SETUP.sql` in your project
3. Copy the **entire contents**
4. Paste into SQL Editor
5. Click **Run**

**What this creates:**
- `body_metrics` table (weight, muscle mass, body fat tracking)
- `personal_records` table (exercise PRs)
- Indexes and RLS policies

### 5.2 Schedules Table (if using schedule feature)

1. In Supabase SQL Editor, click **New Query**
2. Open `SCHEDULES_TABLE_SETUP.sql` in your project
3. Copy the **entire contents**
4. Paste into SQL Editor
5. Click **Run**

**What this creates:**
- `schedules` table (workout scheduling/week planner)
- Indexes and RLS policies

## Step 6: Test the Setup

### 6.1 Restart Expo Dev Server

```powershell
cd "C:\My Apps\FORM_APP\form-pt-app"
npx expo start -c
```

Check console for:
- `[Supabase] Initializing client`
- `[Supabase] URL: https://yshbcfifmkflhahjengk.supabase.co`
- No warnings about missing environment variables

### 6.2 Test Account Creation

1. Open the app on your phone/emulator
2. Try signing up with a test account
3. Check Supabase Dashboard → **Authentication** → **Users** - should see new user
4. Check Supabase Dashboard → **Table Editor** → **profiles** - should see auto-created profile

## Troubleshooting

### If SQL Errors Occur:

1. **Check you're in the correct project** - Verify project name in Supabase Dashboard
2. **Check for syntax errors** - Ensure you copied the entire SQL file
3. **Check table conflicts** - If tables already exist, the DROP statements in COMPLETE_DATABASE_SETUP.sql will handle it
4. **Check permissions** - Ensure you have admin access to the Supabase project

### If Environment Variables Not Loading:

1. Ensure file is named `env` (not `.env`)
2. Restart Expo with `-c` flag: `npx expo start -c`
3. Check variable names start with `EXPO_PUBLIC_` for client-side variables

### If Profile Not Auto-Creating:

1. Check trigger exists: Run Step 4.3 verification query
2. Check Supabase Dashboard → **Database** → **Triggers** for `on_auth_user_created`
3. Verify the trigger function `handle_new_user()` exists

## Success Checklist

- [ ] COMPLETE_DATABASE_SETUP.sql ran successfully
- [ ] CREATE_LEADERBOARD_PROFILES_TABLE.sql ran successfully
- [ ] FIX_LEADERBOARD_TABLES.sql ran successfully
- [ ] All 10 core tables exist (verification query returns 10 rows)
- [ ] RLS is enabled on all tables
- [ ] Auto-profile trigger exists
- [ ] Can sign up new account
- [ ] Profile auto-creates on signup
- [ ] Can create programmes
- [ ] Can log workouts
- [ ] Leaderboard opt-in works

## Next Steps

Once setup is complete:
1. Your app is ready to use with Supabase
2. All data will be stored securely in Supabase
3. Account creation, programmes, workouts, and leaderboards will all work
4. No dependency on Rork - everything runs through Supabase

