# Sign Up Issue - Complete Fix Guide

## Problem Diagnosis

Your sign-up is failing because of **Row Level Security (RLS)** on the `users` table. Here's what's happening:

1. Your app uses **custom JWT authentication** (not Supabase Auth)
2. The `users` table has RLS enabled with policies that check `auth.uid()`
3. Since you're not using Supabase Auth, `auth.uid()` returns `NULL`
4. RLS blocks the insert operation even though you're using the service role key

## The Fix (Choose ONE option)

### ✅ OPTION 1: Disable RLS on Users Table (RECOMMENDED)

This is the **simplest and most appropriate** solution for custom JWT authentication.

**Steps:**

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor**
3. Run this SQL command:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

4. Also add the missing `is_pt` column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pt BOOLEAN DEFAULT FALSE;
```

5. Try signing up again with: `Admin@ojgyms.co.uk`

**Why this works:**
- Your backend uses the service role key, which has full database access
- RLS is designed for client-side security (when clients query directly)
- Since all queries go through your tRPC backend, you control security there
- This is the standard approach for custom authentication systems

---

### OPTION 2: Keep RLS but Fix Policies (More Complex)

If you want to keep RLS enabled for future Supabase Auth integration:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `FIX_RLS_ISSUE.sql` (I created this file for you)
3. Run the script
4. Try signing up again

---

## Verification Steps

After applying the fix, verify it worked:

### 1. Check RLS Status

Run this in Supabase SQL Editor:

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';
```

Expected result: `rls_enabled` should be `false`

### 2. Check if is_pt Column Exists

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users';
```

You should see `is_pt` in the list.

### 3. Test Sign Up

Try signing up with:
- Email: `Admin@ojgyms.co.uk`
- Password: (at least 6 characters)
- Name: Your name

### 4. Check Backend Logs

Look for these log messages in your terminal:
```
[SIGNUP] Starting signup for email: Admin@ojgyms.co.uk
[SIGNUP] Service role key configured: true
[SIGNUP] Hashing password...
[SIGNUP] Inserting user into database...
[SIGNUP] User created successfully: [uuid]
```

If you see an error, it will now show detailed information about what went wrong.

---

## Why This Happened

Your `SUPABASE_SETUP.md` file contains SQL commands that enable RLS with policies designed for Supabase Auth:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

But your app uses **custom JWT tokens** (not Supabase Auth), so `auth.uid()` is always `NULL`.

---

## Understanding Your Auth Architecture

Your current setup:

```
User Sign Up
    ↓
Frontend (app/auth.tsx)
    ↓
tRPC Client (lib/trpc.ts)
    ↓
Backend (backend/trpc/routes/auth/signup/route.ts)
    ↓
Custom JWT (backend/lib/auth.ts)
    ↓
Supabase with Service Role Key
    ↓
❌ RLS blocks insert (auth.uid() is NULL)
```

After the fix:

```
User Sign Up
    ↓
Frontend (app/auth.tsx)
    ↓
tRPC Client (lib/trpc.ts)
    ↓
Backend (backend/trpc/routes/auth/signup/route.ts)
    ↓
Custom JWT (backend/lib/auth.ts)
    ↓
Supabase with Service Role Key
    ↓
✅ Insert succeeds (RLS disabled or bypassed)
```

---

## Security Considerations

**Q: Is it safe to disable RLS on the users table?**

**A: Yes**, because:

1. ✅ All database access goes through your tRPC backend
2. ✅ Your backend validates all requests with JWT tokens
3. ✅ Your backend has `protectedProcedure` that checks authentication
4. ✅ Users cannot query Supabase directly (they don't have the service role key)
5. ✅ This is the standard pattern for custom authentication

**Q: When should I use RLS?**

**A: Use RLS when:**
- Clients query Supabase directly (using anon key)
- You use Supabase Auth (auth.uid() works)
- You want defense-in-depth security

**Q: What about other tables?**

**A: Keep RLS enabled on other tables** (programmes, workouts, analytics) because:
- They have proper RLS policies that work with your custom auth
- They provide an extra security layer
- Your backend properly sets user context

---

## Next Steps After Fix

1. ✅ Apply the fix (Option 1 recommended)
2. ✅ Test sign up with `Admin@ojgyms.co.uk`
3. ✅ Verify user appears in Supabase Dashboard → Table Editor → users
4. ✅ Test sign in with the same credentials
5. ✅ Test creating a programme
6. ✅ Test logging a workout

---

## If It Still Doesn't Work

If sign up still fails after disabling RLS, check:

### 1. Service Role Key is Correct

In your `.env` file, verify:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaGJjZmlmbWtmbGhhaGplbmdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY2Mjc2NywiZXhwIjoyMDc1MjM4NzY3fQ.H52cvIeL5fYTrVZXIGa6jC_fECfuUFr3BPT84Jkaoqk
```

### 2. Restart Your Dev Server

After changing `.env`, restart:
```bash
# Stop the server (Ctrl+C)
# Start again
bun run start
```

### 3. Check Backend Logs

Look for the detailed error messages I added:
```
[SIGNUP] Error code: ...
[SIGNUP] Error message: ...
[SIGNUP] Error details: ...
[SIGNUP] Error hint: ...
```

Share these logs if you need more help.

### 4. Verify Database Connection

Test the connection in Supabase SQL Editor:
```sql
SELECT NOW();
```

Should return the current timestamp.

---

## Summary

**The Issue:** RLS policies blocking user creation because `auth.uid()` is NULL with custom JWT auth

**The Fix:** Disable RLS on users table (or update policies)

**Why It's Safe:** All access goes through your authenticated tRPC backend

**Next Step:** Run the SQL command in Option 1 and try signing up again

---

## Questions?

If you're still having issues after applying the fix, please share:
1. The exact error message from the app
2. The backend logs (especially the `[SIGNUP]` lines)
3. Screenshot of the RLS status from Supabase Dashboard
