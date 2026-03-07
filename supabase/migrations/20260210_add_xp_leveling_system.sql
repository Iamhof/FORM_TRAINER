-- ============================================================================
-- XP & LEVELING SYSTEM MIGRATION
-- Adds a hybrid XP architecture: denormalized counters on profiles for fast
-- reads, plus an xp_log audit table for idempotency and history tracking.
-- ============================================================================

-- 1. Add XP and level columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_xp INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_level INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_current_xp'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_current_xp CHECK (current_xp >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_current_level'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_current_level CHECK (current_level >= 1 AND current_level <= 10);
  END IF;
END $$;

-- 2. Create XP log table (audit trail + idempotency)
CREATE TABLE IF NOT EXISTS public.xp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  source_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_xp_log_user_action_source
  ON public.xp_log(user_id, action, source_id);

CREATE INDEX IF NOT EXISTS idx_xp_log_user_created
  ON public.xp_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_log_user_action
  ON public.xp_log(user_id, action);

-- 4. Row Level Security
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp_log"
  ON public.xp_log FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Atomic XP award function (matches log_workout_transaction pattern)
CREATE OR REPLACE FUNCTION public.award_xp_transaction(
  p_user_id UUID,
  p_action TEXT,
  p_xp_amount INTEGER,
  p_source_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_log_id UUID;
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
  v_xp_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 850, 1300, 1850, 2500, 3300, 4250];
  i INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id parameter is null';
  END IF;

  IF p_xp_amount <= 0 THEN
    RAISE EXCEPTION 'xp_amount must be positive';
  END IF;

  -- Idempotency check
  IF p_source_id IS NOT NULL THEN
    SELECT id INTO v_existing_log_id
    FROM xp_log
    WHERE user_id = p_user_id
      AND action = p_action
      AND source_id = p_source_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_existing_log_id
    FROM xp_log
    WHERE user_id = p_user_id
      AND action = p_action
      AND source_id IS NULL
    LIMIT 1;
  END IF;

  IF v_existing_log_id IS NOT NULL THEN
    SELECT current_xp, current_level
    INTO v_current_xp, v_current_level
    FROM profiles
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'awarded', false,
      'reason', 'already_awarded',
      'existing_xp', COALESCE(v_current_xp, 0),
      'existing_level', COALESCE(v_current_level, 1)
    );
  END IF;

  -- Lock profile row to prevent race conditions
  SELECT current_xp, current_level
  INTO v_current_xp, v_current_level
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found for user_id %', p_user_id;
  END IF;

  v_new_xp := COALESCE(v_current_xp, 0) + p_xp_amount;

  -- Calculate new level
  v_new_level := 1;
  FOR i IN REVERSE array_upper(v_xp_thresholds, 1)..1 LOOP
    IF v_new_xp >= v_xp_thresholds[i] THEN
      v_new_level := i;
      EXIT;
    END IF;
  END LOOP;

  IF v_new_level > 10 THEN
    v_new_level := 10;
  END IF;

  v_leveled_up := v_new_level > COALESCE(v_current_level, 1);

  -- Insert audit log
  INSERT INTO xp_log (user_id, action, xp_amount, source_id, metadata, created_at)
  VALUES (
    p_user_id,
    p_action,
    p_xp_amount,
    p_source_id,
    p_metadata || CASE WHEN v_leveled_up THEN jsonb_build_object('leveled_up_to', v_new_level) ELSE '{}'::jsonb END,
    timezone('utc', now())
  );

  -- Update profile
  UPDATE profiles
  SET current_xp = v_new_xp,
      current_level = v_new_level,
      updated_at = timezone('utc', now())
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'awarded', true,
    'xp_awarded', p_xp_amount,
    'new_xp', v_new_xp,
    'previous_xp', COALESCE(v_current_xp, 0),
    'new_level', v_new_level,
    'previous_level', COALESCE(v_current_level, 1),
    'leveled_up', v_leveled_up
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp_transaction(UUID, TEXT, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_transaction(UUID, TEXT, INTEGER, TEXT, JSONB) TO service_role;
