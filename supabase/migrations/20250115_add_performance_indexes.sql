-- Indexes for workouts table
CREATE INDEX IF NOT EXISTS idx_workouts_user_date 
  ON workouts(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_workouts_user_created 
  ON workouts(user_id, created_at DESC);

-- Indexes for analytics table
CREATE INDEX IF NOT EXISTS idx_analytics_user_exercise 
  ON analytics(user_id, exercise_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_date 
  ON analytics(user_id, date DESC);

-- Indexes for leaderboard_stats
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_volume 
  ON leaderboard_stats(total_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_monthly_volume 
  ON leaderboard_stats(monthly_volume_kg DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_sessions 
  ON leaderboard_stats(total_sessions DESC);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_pt 
  ON profiles(is_pt) WHERE is_pt = true;

-- Indexes for pt_client_relationships
CREATE INDEX IF NOT EXISTS idx_pt_relationships_pt 
  ON pt_client_relationships(pt_id, status);

CREATE INDEX IF NOT EXISTS idx_pt_relationships_client 
  ON pt_client_relationships(client_id, status);

-- Indexes for body_metrics
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date 
  ON body_metrics(user_id, date DESC);





