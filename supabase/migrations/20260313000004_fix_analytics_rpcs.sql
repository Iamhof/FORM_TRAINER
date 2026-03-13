-- Migration: Fix get_volume and get_strength_trend to accept explicit user_id
-- Why: Both functions use auth.uid() but are called via supabaseAdmin (service_role),
-- so auth.uid() returns NULL and analytics returns zeros for every user.

-- Recreate get_volume with p_user_id parameter
CREATE OR REPLACE FUNCTION public.get_volume(p_user_id uuid, p_period text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := p_user_id;
  v_period text := lower(coalesce(p_period, 'week'));
  v_today date := (timezone('utc', now()))::date;
  v_start_current date;
  v_end_current date;
  v_start_previous date;
  v_end_previous date;
  v_total_volume numeric := 0;
  v_previous_volume numeric := 0;
  v_workout_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('totalVolumeKg', 0, 'workoutCount', 0, 'previousPeriodVolumeKg', 0, 'percentageChange', 0);
  END IF;

  IF v_period NOT IN ('week', 'month', 'total') THEN
    RAISE EXCEPTION 'invalid period %', v_period;
  END IF;

  IF v_period = 'week' THEN
    v_start_current := date_trunc('week', v_today);
    v_end_current := v_start_current + interval '6 day';
    v_start_previous := v_start_current - interval '7 day';
    v_end_previous := v_start_current - interval '1 day';
  ELSIF v_period = 'month' THEN
    v_start_current := date_trunc('month', v_today);
    v_end_current := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
    v_start_previous := (v_start_current - interval '1 month')::date;
    v_end_previous := (v_start_current - interval '1 day')::date;
  ELSE
    v_start_current := to_date('1970-01-01', 'YYYY-MM-DD');
    v_end_current := v_today;
    v_start_previous := NULL;
    v_end_previous := NULL;
  END IF;

  SELECT coalesce(sum(total_volume), 0), count(distinct date)
  INTO v_total_volume, v_workout_count
  FROM analytics
  WHERE user_id = v_user_id
    AND date BETWEEN v_start_current AND v_end_current;

  IF v_start_previous IS NOT NULL THEN
    SELECT coalesce(sum(total_volume), 0)
    INTO v_previous_volume
    FROM analytics
    WHERE user_id = v_user_id
      AND date BETWEEN v_start_previous AND v_end_previous;
  END IF;

  RETURN jsonb_build_object(
    'totalVolumeKg', round((v_total_volume / 1000)::numeric, 1),
    'workoutCount', v_workout_count,
    'previousPeriodVolumeKg', round((v_previous_volume / 1000)::numeric, 1),
    'percentageChange', CASE
      WHEN v_previous_volume > 0 THEN round(((v_total_volume - v_previous_volume) / v_previous_volume * 100)::numeric, 1)
      WHEN v_total_volume > 0 THEN 100
      ELSE 0
    END
  );
END;
$$;

-- Drop the old single-param version
DROP FUNCTION IF EXISTS public.get_volume(text);

-- Grant only to service_role (already revoked from authenticated in 20260313000001)
GRANT EXECUTE ON FUNCTION public.get_volume(uuid, text) TO service_role;


-- Recreate get_strength_trend with p_user_id parameter
CREATE OR REPLACE FUNCTION public.get_strength_trend(p_user_id uuid, p_months integer DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := p_user_id;
  v_months integer := greatest(coalesce(p_months, 6), 1);
  v_start date := (date_trunc('month', timezone('utc', now())) - (v_months - 1) * interval '1 month')::date;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('analytics', '[]'::jsonb, 'workouts', '[]'::jsonb, 'schedules', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
    'analytics', coalesce((SELECT jsonb_agg(row_to_json(a)) FROM (SELECT * FROM analytics WHERE user_id = v_user_id AND date >= v_start ORDER BY date) a), '[]'::jsonb),
    'workouts', coalesce((SELECT jsonb_agg(row_to_json(w)) FROM (SELECT id, programme_id, programme_name, completed_at FROM workouts WHERE user_id = v_user_id AND completed_at >= v_start ORDER BY completed_at) w), '[]'::jsonb),
    'schedules', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', s.id,
      'programmeId', s.programme_id,
      'weekStart', s.week_start,
      'schedule', coalesce(s.schedule::jsonb, build_default_schedule(s.week_start))
    )) FROM schedules s WHERE s.user_id = v_user_id AND s.week_start >= v_start ORDER BY s.week_start), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Drop the old single-param version
DROP FUNCTION IF EXISTS public.get_strength_trend(integer);

-- Grant only to service_role
GRANT EXECUTE ON FUNCTION public.get_strength_trend(uuid, integer) TO service_role;
