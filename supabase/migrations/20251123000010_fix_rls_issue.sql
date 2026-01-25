-- FIX FOR SIGNUP ISSUE: RLS Blocking User Creation
-- 
-- PROBLEM: The users table has RLS policies that reference auth.uid(), 
-- but we're using custom JWT authentication (not Supabase Auth).
-- This causes auth.uid() to return NULL, blocking all operations.
--
-- SOLUTION: Update RLS policies to work with service role key OR disable RLS on users table

-- ============================================================================
-- OPTION 1: Disable RLS on users table (RECOMMENDED for custom auth)
-- ============================================================================
-- This is the simplest solution when using custom JWT authentication
-- The service role key will handle all user operations from the backend

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: Update RLS policies (if you want to keep RLS enabled)
-- ============================================================================
-- Uncomment the lines below if you prefer to keep RLS enabled
-- Note: This still requires service role key for user creation

/*
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policy that allows service role to bypass RLS
-- (Service role automatically bypasses RLS, so no policy needed for it)

-- Users can read their own data (for when you add Supabase Auth later)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);
*/

-- ============================================================================
-- VERIFY: Add is_pt column if it doesn't exist
-- ============================================================================
-- The TypeScript types reference is_pt but it might be missing from the schema

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_pt'
  ) THEN
    ALTER TABLE users ADD COLUMN is_pt BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_pt column to users table';
  ELSE
    RAISE NOTICE 'is_pt column already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFY: Check current RLS status
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- ============================================================================
-- VERIFY: List all policies on users table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
