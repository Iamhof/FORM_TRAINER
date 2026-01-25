-- Body Metrics Table
-- Stores user body metrics (weight, muscle mass, body fat %)
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2), -- in kg
  muscle_mass DECIMAL(5,2), -- in kg
  body_fat_percentage DECIMAL(4,2), -- percentage (0-100)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One entry per user per date
  UNIQUE(user_id, date)
);

-- Personal Records Table
-- Stores personal records for each exercise
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  weight DECIMAL(6,2) NOT NULL, -- max weight lifted
  reps INTEGER NOT NULL,
  date DATE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One PR per exercise per user
  UNIQUE(user_id, exercise_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON body_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(user_id, exercise_id);

-- RLS Policies for body_metrics
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body metrics"
  ON body_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body metrics"
  ON body_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body metrics"
  ON body_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body metrics"
  ON body_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- PTs can view their clients' body metrics
CREATE POLICY "PTs can view client body metrics"
  ON body_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pt_client_relationships
      WHERE pt_client_relationships.pt_id = auth.uid()
        AND pt_client_relationships.client_id = body_metrics.user_id
        AND pt_client_relationships.status = 'active'
    )
  );

-- RLS Policies for personal_records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal records"
  ON personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal records"
  ON personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal records"
  ON personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal records"
  ON personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- PTs can view their clients' personal records
CREATE POLICY "PTs can view client personal records"
  ON personal_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pt_client_relationships
      WHERE pt_client_relationships.pt_id = auth.uid()
        AND pt_client_relationships.client_id = personal_records.user_id
        AND pt_client_relationships.status = 'active'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_body_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for body_metrics
CREATE TRIGGER update_body_metrics_timestamp
  BEFORE UPDATE ON body_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_body_metrics_updated_at();
