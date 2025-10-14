# Fix Missing Profiles Table

## The Problem
Your app is trying to query a `profiles` table that doesn't exist in your Supabase database yet.

## The Solution
You need to run the migration SQL in your Supabase dashboard.

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Migration
1. Click "New Query" button
2. Copy the ENTIRE contents of the file `SUPABASE_MIGRATION.sql` from your project
3. Paste it into the SQL editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)

### 3. Verify the Migration
After running the migration, run this verification query:

```sql
-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);
```

It should return `true`.

### 4. Test Your App
1. Stop your dev server (Ctrl+C)
2. Start it again: `npx rork start`
3. Try to sign up with a new test account
4. The profile should be created automatically

## What This Migration Does

1. **Creates `profiles` table** - Stores user profile data (name, role, is_pt)
2. **Links to auth.users** - Each profile is linked to a Supabase auth user
3. **Auto-creates profiles** - When a user signs up, a profile is automatically created
4. **Sets up RLS policies** - Users can only see/edit their own profiles
5. **Updates all other tables** - Ensures programmes, workouts, analytics use auth.uid()

## After Migration

Once the migration is complete:
- New signups will automatically create a profile
- Login will work properly
- Programmes will save and load correctly
- All data will be properly secured with RLS policies
