-- =====================================================
-- LEADERBOARD DATABASE SETUP - PHASE 1
-- =====================================================
-- This SQL file creates all necessary tables and functions for the leaderboard feature
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. ADD GENDER TO PROFILES TABLE
-- =====================================================
-- Add gender column to profiles table for gender-specific leaderboards
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add leaderboard opt-in column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN DEFAULT false;

-- Add display name for leaderboard (can be different from actual name for privacy)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS leaderboard_display_name TEXT;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard 
ON profiles(leaderboard_enabled, gender) 
WHERE leaderboard_enabled = true;

-- =====================================================
-- 2. CREATE LEADERBOARD STATS TABLE
-- =====================================================
-- This table stores calculated stats for each user
-- Updated daily via a scheduled job or triggered by user actions
CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visit metrics
  total_visits INTEGER DEFAULT 0,
  current_month_visits INTEGER DEFAULT 0,
  
  -- Volume metrics (in kg)
  total_volume_kg DECIMAL(12, 2) DEFAULT 0,
  current_month_volume_kg DECIMAL(12, 2) DEFAULT 0,
  
  -- Strength progression metrics
  avg_strength_increase_percent DECIMAL(5, 2) DEFAULT 0,
  current_month_strength_increase_percent DECIMAL(5, 2) DEFAULT 0,
  
  -- Streak metrics
  current_streak_weeks INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  
  -- Exercise-specific records (stored as JSONB for flexibility)
  -- Format: { "exerciseId": { "weight": 100, "reps": 10, "date": "2024-01-01" } }
  exercise_records JSONB DEFAULT '{}'::jsonb,
  
  -- Last update timestamp
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_user 
ON leaderboard_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_total_visits 
ON leaderboard_stats(total_visits DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_month_visits 
ON leaderboard_stats(current_month_visits DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_total_volume 
ON leaderboard_stats(total_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_month_volume 
ON leaderboard_stats(current_month_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_strength_increase 
ON leaderboard_stats(current_month_strength_increase_percent DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_streak 
ON leaderboard_stats(current_streak_weeks DESC);

-- =====================================================
-- 3. CREATE VISIT TRACKING TABLE
-- =====================================================
-- Track user visits/logins for visit-based leaderboards
CREATE TABLE IF NOT EXISTS user_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, visit_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_visits_user_date 
ON user_visits(user_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_visits_date 
ON user_visits(visit_date DESC);

-- =====================================================
-- 4. CREATE WEEKLY COMPLETION TRACKING TABLE
-- =====================================================
-- Track weekly programme completions for streak calculations
CREATE TABLE IF NOT EXISTS weekly_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  total_sessions INTEGER NOT NULL,
  completed_sessions INTEGER NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, programme_id, week_start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_weekly_completions_user 
ON weekly_completions(user_id, week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_completions_complete 
ON weekly_completions(user_id, is_complete, week_start_date DESC) 
WHERE is_complete = true;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_completions ENABLE ROW LEVEL SECURITY;

-- leaderboard_stats policies
-- Users can read all leaderboard stats (needed for leaderboards)
CREATE POLICY "Users can view all leaderboard stats"
ON leaderboard_stats FOR SELECT
TO authenticated
USING (true);

-- Only system can insert/update leaderboard stats (via service role)
CREATE POLICY "Only system can modify leaderboard stats"
ON leaderboard_stats FOR ALL
TO authenticated
USING (false);

-- user_visits policies
-- Users can only insert their own visits
CREATE POLICY "Users can insert own visits"
ON user_visits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own visits
CREATE POLICY "Users can view own visits"
ON user_visits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- weekly_completions policies
-- Users can insert/update their own completions
CREATE POLICY "Users can manage own completions"
ON weekly_completions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
ON weekly_completions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCTIONS FOR LEADERBOARD CALCULATIONS
-- =====================================================

-- Function to record a user visit
CREATE OR REPLACE FUNCTION record_user_visit()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert visit for today if not exists
  INSERT INTO user_visits (user_id, visit_date)
  VALUES (NEW.user_id, CURRENT_DATE)
  ON CONFLICT (user_id, visit_date) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leaderboard stats after workout completion
CREATE OR REPLACE FUNCTION update_leaderboard_stats_on_workout()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume DECIMAL(12, 2);
  current_month_start DATE;
BEGIN
  -- Only process for users with leaderboard enabled
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = NEW.user_id 
    AND leaderboard_enabled = true
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Calculate volume for this workout
  -- This is a simplified calculation - you may need to adjust based on your workout data structure
  workout_volume := 0;
  
  -- Get current month start
  current_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Update or insert leaderboard stats
  INSERT INTO leaderboard_stats (user_id, last_calculated_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET last_calculated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
BEGIN
  -- Start from current week
  check_date := date_trunc('week', CURRENT_DATE)::DATE;
  
  -- Loop backwards through weeks
  LOOP
    -- Check if this week is complete
    IF NOT EXISTS (
      SELECT 1 FROM weekly_completions
      WHERE user_id = p_user_id
      AND week_start_date = check_date
      AND is_complete = true
    ) THEN
      -- Streak broken
      EXIT;
    END IF;
    
    -- Increment streak
    streak_count := streak_count + 1;
    
    -- Move to previous week
    check_date := check_date - INTERVAL '7 days';
    
    -- Safeguard: don't go back more than 2 years
    IF check_date < CURRENT_DATE - INTERVAL '2 years' THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to update leaderboard stats when workout is logged
-- Note: Adjust table name if your workouts table has a different name
CREATE TRIGGER trigger_update_leaderboard_stats
AFTER INSERT ON workouts
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_stats_on_workout();

-- =====================================================
-- 8. INITIAL DATA POPULATION
-- =====================================================

-- Create leaderboard_stats entry for all existing users with leaderboard enabled
-- This will be populated with actual data by the calculation procedures
INSERT INTO leaderboard_stats (user_id)
SELECT user_id FROM profiles
WHERE leaderboard_enabled = true
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON leaderboard_stats TO authenticated;
GRANT INSERT, SELECT ON user_visits TO authenticated;
GRANT ALL ON weekly_completions TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Leaderboard database setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run leaderboard calculation procedures to populate initial data';
  RAISE NOTICE '2. Set up a cron job to recalculate leaderboard stats daily';
  RAISE NOTICE '3. Users can now opt-in to leaderboards via their profile settings';
END $$;
