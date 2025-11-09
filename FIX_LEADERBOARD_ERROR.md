# Fix Leaderboard Join Error

## Problem Diagnosis

The leaderboard join error is caused by **missing database tables**. The backend code expects two tables that don't exist:

1. **`leaderboard_profiles`** - Stores user opt-in status, display names, gender, and privacy settings
2. **`leaderboard_stats`** - Stores calculated statistics like volume and session counts

### Why This Happened

The original `LEADERBOARD_DATABASE_SETUP.sql` file used an older schema design that added columns to the `profiles` table. However, the backend code was updated to use separate `leaderboard_profiles` and `leaderboard_stats` tables for better data organization and performance.

## Solution

Run the SQL migration to create the missing tables.

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of **`FIX_LEADERBOARD_TABLES.sql`**
5. Click **Run**

### Step 2: Verify the Fix

After running the SQL, verify that the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leaderboard_profiles', 'leaderboard_stats');
```

You should see both tables listed.

### Step 3: Test the Join Flow

1. Open the app
2. Navigate to the Leaderboard tab
3. Click "Join Leaderboard"
4. Enter a display name
5. Select "Male" or "Female"
6. Click "Join Leaderboard"

The join should now succeed without errors.

## What the Migration Does

1. **Creates `leaderboard_profiles` table**
   - Stores user opt-in status (`is_opted_in`)
   - Stores display name for privacy
   - Stores gender (only `male` or `female` allowed)
   - Stores privacy preferences for each leaderboard type

2. **Creates `leaderboard_stats` table**
   - Stores calculated statistics:
     - `total_volume_kg` - All-time volume
     - `monthly_volume_kg` - Current month volume
     - `total_sessions` - All-time sessions
     - `monthly_sessions` - Current month sessions

3. **Sets up Row Level Security (RLS)**
   - Users can view opted-in profiles
   - Users can only manage their own profile
   - Users can view all leaderboard stats

4. **Creates indexes** for fast queries

5. **Migrates existing data** (if any)

## Additional Notes

### Gender Options

As per your previous request, the gender options are now restricted to only **Male** or **Female**. The database constraint ensures no other values can be stored:

```sql
gender TEXT CHECK (gender IN ('male', 'female'))
```

### Backend Compatibility

The migration creates tables that match exactly what the backend expects:
- ✅ `leaderboard_profiles` table with correct columns
- ✅ `leaderboard_stats` table with correct columns
- ✅ Proper RLS policies for authentication
- ✅ Correct foreign key relationships

## Troubleshooting

### If the error persists after migration:

1. **Check table creation:**
   ```sql
   SELECT * FROM leaderboard_profiles LIMIT 1;
   SELECT * FROM leaderboard_stats LIMIT 1;
   ```

2. **Check RLS policies:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE tablename IN ('leaderboard_profiles', 'leaderboard_stats');
   ```

3. **Verify foreign key constraints:**
   ```sql
   SELECT 
     tc.table_name, 
     kcu.column_name, 
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
   AND tc.table_name IN ('leaderboard_profiles', 'leaderboard_stats');
   ```

### If you see permission errors:

Make sure you're logged in to the app when testing. The RLS policies require authentication.

## Next Steps

After fixing the database:

1. Users can successfully join the leaderboard
2. Leaderboard rankings will display correctly
3. Stats will be calculated from workout data
4. Gender filtering will work properly

## Summary

**The issue:** Backend code expects `leaderboard_profiles` and `leaderboard_stats` tables that don't exist in the database.

**The fix:** Run `FIX_LEADERBOARD_TABLES.sql` to create these tables with the correct schema.

**Time to fix:** ~2 minutes (just run the SQL script)

---

✅ After running the migration, the leaderboard join functionality should work perfectly!
