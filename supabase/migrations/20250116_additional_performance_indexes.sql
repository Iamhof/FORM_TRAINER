-- Additional performance indexes based on analysis recommendations
-- These indexes optimize common query patterns and improve overall database performance

-- Indexes for workouts table (additional)
CREATE INDEX IF NOT EXISTS idx_workouts_user_completed_at 
  ON workouts(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workouts_date 
  ON workouts(date DESC);

-- Indexes for analytics table (additional)
CREATE INDEX IF NOT EXISTS idx_analytics_exercise_date 
  ON analytics(exercise_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_user_exercise_date 
  ON analytics(user_id, exercise_id, date DESC);

-- Indexes for leaderboard_stats (composite for common queries)
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_monthly_sessions 
  ON leaderboard_stats(monthly_sessions DESC);

-- Indexes for shared_programmes (for PT client queries)
CREATE INDEX IF NOT EXISTS idx_shared_programmes_pt_client 
  ON shared_programmes(pt_id, client_id);

CREATE INDEX IF NOT EXISTS idx_shared_programmes_client 
  ON shared_programmes(client_id);

-- Indexes for schedules (if schedules table exists)
CREATE INDEX IF NOT EXISTS idx_schedules_user_programme 
  ON schedules(user_id, programme_id);

CREATE INDEX IF NOT EXISTS idx_schedules_user_day 
  ON schedules(user_id, day_of_week);

-- Indexes for personal_records (if exists)
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise 
  ON personal_records(user_id, exercise_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_user_date 
  ON personal_records(user_id, achieved_at DESC);

-- Indexes for leaderboard_profiles
CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_opted_in 
  ON leaderboard_profiles(user_id, is_opted_in)
  WHERE is_opted_in = true;

CREATE INDEX IF NOT EXISTS idx_leaderboard_profiles_gender 
  ON leaderboard_profiles(gender)
  WHERE is_opted_in = true;

-- Composite index for leaderboard queries (optimizes the common join)
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_profiles 
  ON leaderboard_stats(user_id)
  INCLUDE (total_volume_kg, monthly_volume_kg, total_sessions, monthly_sessions);

-- Analyze tables after creating indexes for query planner optimization
ANALYZE workouts;
ANALYZE analytics;
ANALYZE leaderboard_stats;
ANALYZE shared_programmes;
ANALYZE schedules;
ANALYZE personal_records;
ANALYZE leaderboard_profiles;

