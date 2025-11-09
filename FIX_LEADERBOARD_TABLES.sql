-- =====================================================
-- FIX LEADERBOARD TABLES - Complete Setup
-- =====================================================
-- This creates all necessary tables for the leaderboard feature
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CREATE LEADERBOARD_PROFILES TABLE
-- =====================================================

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
  
  -- Gender for fair competition (only male or female allowed)
  gender TEXT CHECK (gender IN ('male', 'female')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_user_id 
ON leaderboard_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_opted_in 
ON leaderboard_profiles(is_opted_in) 
WHERE is_opted_in = true;

CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_gender 
ON leaderboard_profiles(gender) 
WHERE is_opted_in = true;

-- =====================================================
-- 2. CREATE OR UPDATE LEADERBOARD_STATS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Volume metrics (in kg)
  total_volume_kg DECIMAL(12, 2) DEFAULT 0,
  monthly_volume_kg DECIMAL(12, 2) DEFAULT 0,
  
  -- Session metrics
  total_sessions INTEGER DEFAULT 0,
  monthly_sessions INTEGER DEFAULT 0,
  
  -- Current month tracking
  monthly_period TEXT,
  
  -- Rankings (optional, can be calculated on-the-fly)
  total_volume_rank INTEGER,
  monthly_volume_rank INTEGER,
  total_sessions_rank INTEGER,
  monthly_sessions_rank INTEGER,
  
  -- Last calculation timestamp
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_user 
ON leaderboard_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_total_volume 
ON leaderboard_stats(total_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_monthly_volume 
ON leaderboard_stats(monthly_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_total_sessions 
ON leaderboard_stats(total_sessions DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_monthly_sessions 
ON leaderboard_stats(monthly_sessions DESC);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE leaderboard_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "Users can view opted-in leaderboard profiles" ON leaderboard_profiles;
DROP POLICY IF EXISTS "Users can manage own leaderboard profile" ON leaderboard_profiles;
DROP POLICY IF EXISTS "Users can view all leaderboard stats" ON leaderboard_stats;
DROP POLICY IF EXISTS "Users can manage own leaderboard stats" ON leaderboard_stats;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- leaderboard_profiles policies
CREATE POLICY "Users can view opted-in leaderboard profiles"
ON leaderboard_profiles FOR SELECT
TO authenticated
USING (is_opted_in = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own leaderboard profile"
ON leaderboard_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- leaderboard_stats policies
CREATE POLICY "Users can view all leaderboard stats"
ON leaderboard_stats FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own leaderboard stats"
ON leaderboard_stats FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON leaderboard_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON leaderboard_stats TO authenticated;

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Trigger to update leaderboard_profiles updated_at
CREATE OR REPLACE FUNCTION update_leaderboard_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard_profiles_updated_at ON leaderboard_profiles;

CREATE TRIGGER trigger_update_leaderboard_profiles_updated_at
BEFORE UPDATE ON leaderboard_profiles
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_profiles_updated_at();

-- Trigger to update leaderboard_stats updated_at
CREATE OR REPLACE FUNCTION update_leaderboard_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard_stats_updated_at ON leaderboard_stats;

CREATE TRIGGER trigger_update_leaderboard_stats_updated_at
BEFORE UPDATE ON leaderboard_stats
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_stats_updated_at();

-- =====================================================
-- 8. MIGRATION: Copy existing data (if any)
-- =====================================================

-- Migrate from profiles table if it has leaderboard columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'leaderboard_enabled'
  ) THEN
    INSERT INTO leaderboard_profiles (user_id, is_opted_in, display_name, gender)
    SELECT 
      user_id,
      COALESCE(leaderboard_enabled, false) as is_opted_in,
      COALESCE(leaderboard_display_name, name, email) as display_name,
      CASE 
        WHEN gender IN ('male', 'female') THEN gender
        ELSE NULL
      END as gender
    FROM profiles
    WHERE leaderboard_enabled = true
      OR leaderboard_display_name IS NOT NULL
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated existing leaderboard data from profiles table';
  END IF;
END $$;

-- =====================================================
-- 9. INITIALIZE STATS FOR EXISTING OPTED-IN USERS
-- =====================================================

INSERT INTO leaderboard_stats (user_id)
SELECT user_id 
FROM leaderboard_profiles 
WHERE is_opted_in = true
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LEADERBOARD TABLES SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - leaderboard_profiles';
  RAISE NOTICE '  - leaderboard_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  ✓ Male/Female gender filter only';
  RAISE NOTICE '  ✓ Privacy controls';
  RAISE NOTICE '  ✓ RLS policies';
  RAISE NOTICE '  ✓ Automatic timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now join the leaderboard!';
  RAISE NOTICE '========================================';
END $$;
