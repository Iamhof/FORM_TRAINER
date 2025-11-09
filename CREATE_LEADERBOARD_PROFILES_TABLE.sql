-- =====================================================
-- CREATE LEADERBOARD_PROFILES TABLE
-- =====================================================
-- This creates the leaderboard_profiles table that the backend expects

-- Create the leaderboard_profiles table
CREATE TABLE IF NOT EXISTS leaderboard_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Opt-in status
  is_opted_in BOOLEAN DEFAULT false,
  
  -- Display settings
  display_name TEXT NOT NULL,
  show_real_name BOOLEAN DEFAULT false,
  
  -- Privacy settings for different leaderboard categories
  show_in_total_volume BOOLEAN DEFAULT true,
  show_in_monthly_volume BOOLEAN DEFAULT true,
  show_in_total_sessions BOOLEAN DEFAULT true,
  show_in_monthly_sessions BOOLEAN DEFAULT true,
  
  -- Gender for fair competition
  gender TEXT CHECK (gender IN ('male', 'female')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_user_id 
ON leaderboard_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_opted_in 
ON leaderboard_profiles(is_opted_in) 
WHERE is_opted_in = true;

CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_gender 
ON leaderboard_profiles(gender) 
WHERE is_opted_in = true;

-- Enable RLS
ALTER TABLE leaderboard_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all opted-in leaderboard profiles (needed for leaderboards)
CREATE POLICY "Users can view opted-in leaderboard profiles"
ON leaderboard_profiles FOR SELECT
TO authenticated
USING (is_opted_in = true OR user_id = auth.uid());

-- Users can insert/update their own profile
CREATE POLICY "Users can manage own leaderboard profile"
ON leaderboard_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON leaderboard_profiles TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leaderboard_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard_profiles_updated_at
BEFORE UPDATE ON leaderboard_profiles
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_profiles_updated_at();

-- =====================================================
-- MIGRATION: Copy existing data from profiles table
-- =====================================================
-- If you had leaderboard data in the profiles table, migrate it here
-- This is optional and only if you were using the old schema

INSERT INTO leaderboard_profiles (user_id, is_opted_in, display_name, gender)
SELECT 
  user_id,
  COALESCE(leaderboard_enabled, false) as is_opted_in,
  COALESCE(leaderboard_display_name, name, email) as display_name,
  gender
FROM profiles
WHERE leaderboard_enabled = true
  OR leaderboard_display_name IS NOT NULL
  OR gender IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'leaderboard_profiles table created successfully!';
  RAISE NOTICE 'Migrated existing leaderboard data from profiles table';
  RAISE NOTICE 'Users can now join the leaderboard';
END $$;
