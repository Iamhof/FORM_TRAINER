-- Speed up programmes.list query: WHERE user_id = ? ORDER BY created_at DESC
-- Previously doing sequential scan; this index covers the exact query pattern.
CREATE INDEX IF NOT EXISTS idx_programmes_user_id
  ON programmes (user_id, created_at DESC);
