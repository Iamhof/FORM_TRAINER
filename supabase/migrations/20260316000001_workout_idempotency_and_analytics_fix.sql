-- Step 2+3: Workout idempotency constraint + analytics accumulation fix
-- Prevents duplicate workout submissions and fixes volume/reps overwrite bug

-- 0. Immutable helper for extracting date from timestamptz (UTC)
-- Required because timestamptz::date is not immutable (timezone-dependent)
CREATE OR REPLACE FUNCTION public.completed_at_date(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$ SELECT (ts AT TIME ZONE 'UTC')::date; $$;

-- 1. Add unique index to prevent duplicate workouts
-- Allows the same day/week on different calendar days (re-doing a session)
-- but prevents exact duplicates on the same calendar day
CREATE UNIQUE INDEX IF NOT EXISTS workouts_no_duplicate
  ON workouts (user_id, programme_id, day, week, completed_at_date(completed_at));

-- 2. Replace log_workout_transaction to:
--    a) Handle duplicate inserts gracefully (return existing workout)
--    b) Accumulate total_volume and total_reps instead of overwriting
CREATE OR REPLACE FUNCTION public.log_workout_transaction(
  p_user_id uuid,
  p_programme_id uuid,
  p_programme_name text,
  p_day integer,
  p_week integer,
  p_exercises jsonb,
  p_completed_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := p_user_id;
  v_week_start date;
  v_day_idx integer;
  v_workout workouts%rowtype;
  v_schedule_id uuid;
  v_schedule jsonb;
  v_exercise jsonb;
  v_completed_sets jsonb;
  v_total_volume numeric;
  v_total_reps integer;
  v_max_weight numeric;
  v_best_set jsonb;
  v_best_weight numeric;
  v_best_reps integer;
  v_existing_pr record;
  v_new_one_rm numeric;
  v_existing_one_rm numeric;
  v_schedule_row schedules%rowtype;
  v_new_schedule jsonb;
  v_programme_days integer := 7;
  v_is_duplicate boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id parameter is null';
  END IF;

  v_week_start := (date_trunc('week', timezone('utc', p_completed_at)))::date;
  v_day_idx := CASE WHEN extract(dow FROM p_completed_at) = 0 THEN 6 ELSE extract(dow FROM p_completed_at)::int - 1 END;

  -- Attempt insert; on duplicate return the existing workout
  BEGIN
    INSERT INTO workouts (
      user_id,
      programme_id,
      programme_name,
      day,
      week,
      exercises,
      completed_at,
      created_at
    )
    VALUES (
      v_user_id,
      p_programme_id,
      p_programme_name,
      p_day,
      p_week,
      p_exercises,
      p_completed_at,
      timezone('utc', now())
    )
    RETURNING * INTO v_workout;
  EXCEPTION WHEN unique_violation THEN
    -- Duplicate submission — return the existing workout
    SELECT * INTO v_workout
    FROM workouts
    WHERE user_id = v_user_id
      AND programme_id = p_programme_id
      AND day = p_day
      AND week = p_week
      AND completed_at_date(completed_at) = completed_at_date(p_completed_at);

    v_is_duplicate := true;
  END;

  -- If this was a duplicate, skip all side effects and return existing workout
  IF v_is_duplicate THEN
    RETURN to_jsonb(v_workout);
  END IF;

  SELECT * INTO v_schedule_row
  FROM schedules
  WHERE user_id = v_user_id
    AND week_start = v_week_start
  FOR UPDATE;

  IF NOT FOUND THEN
    v_schedule := build_default_schedule(v_week_start);
    INSERT INTO schedules (
      user_id,
      programme_id,
      week_start,
      schedule,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      p_programme_id,
      v_week_start,
      v_schedule,
      timezone('utc', now()),
      timezone('utc', now())
    )
    RETURNING id, schedule INTO v_schedule_id, v_schedule;
  ELSE
    v_schedule_id := v_schedule_row.id;
    v_schedule := coalesce(v_schedule_row.schedule::jsonb, build_default_schedule(v_week_start));
  END IF;

  IF p_programme_id IS NOT NULL THEN
    SELECT days INTO v_programme_days FROM programmes WHERE id = p_programme_id;
  ELSIF v_schedule_row.programme_id IS NOT NULL THEN
    SELECT days INTO v_programme_days FROM programmes WHERE id = v_schedule_row.programme_id;
  END IF;

  v_new_schedule := jsonb_set(
    jsonb_set(
      jsonb_set(
        v_schedule,
        ARRAY[v_day_idx::text, 'status'],
        to_jsonb('completed'::text),
        true
      ),
      ARRAY[v_day_idx::text, 'sessionId'],
      to_jsonb(null),
      true
    ),
    ARRAY[v_day_idx::text, 'weekStart'],
    to_jsonb(to_char(v_week_start, 'YYYY-MM-DD')),
    true
  );

  UPDATE schedules
  SET schedule = v_new_schedule,
      programme_id = coalesce(p_programme_id, programme_id),
      updated_at = timezone('utc', now())
  WHERE id = v_schedule_id;

  FOR v_exercise IN SELECT value FROM jsonb_array_elements(p_exercises)
  LOOP
    v_completed_sets := (
      SELECT coalesce(jsonb_agg(elem.value), '[]'::jsonb)
      FROM jsonb_array_elements(v_exercise -> 'sets') elem
      WHERE coalesce((elem.value ->> 'completed')::boolean, false)
    );

    IF jsonb_array_length(v_completed_sets) = 0 THEN
      CONTINUE;
    END IF;

    SELECT
      coalesce(sum((elem ->> 'weight')::numeric * (elem ->> 'reps')::numeric), 0),
      coalesce(sum((elem ->> 'reps')::integer), 0),
      coalesce(max((elem ->> 'weight')::numeric), 0)
    INTO
      v_total_volume,
      v_total_reps,
      v_max_weight
    FROM jsonb_array_elements(v_completed_sets) elem;

    SELECT elem.value
    INTO v_best_set
    FROM jsonb_array_elements(v_completed_sets) elem
    ORDER BY calculate_one_rep_max((elem.value ->> 'weight')::numeric, (elem.value ->> 'reps')::integer) DESC
    LIMIT 1;

    v_best_weight := (v_best_set ->> 'weight')::numeric;
    v_best_reps := (v_best_set ->> 'reps')::integer;
    v_new_one_rm := calculate_one_rep_max(v_best_weight, v_best_reps);

    INSERT INTO analytics (
      user_id,
      exercise_id,
      date,
      max_weight,
      total_volume,
      total_reps,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_exercise ->> 'exerciseId',
      p_completed_at::date,
      v_max_weight,
      v_total_volume,
      v_total_reps,
      timezone('utc', now()),
      timezone('utc', now())
    )
    ON CONFLICT (user_id, exercise_id, date)
    DO UPDATE SET
      max_weight = greatest(excluded.max_weight, analytics.max_weight),
      total_volume = analytics.total_volume + excluded.total_volume,
      total_reps = analytics.total_reps + excluded.total_reps,
      updated_at = timezone('utc', now());

    SELECT *
    INTO v_existing_pr
    FROM personal_records
    WHERE user_id = v_user_id
      AND exercise_id = v_exercise ->> 'exerciseId';

    IF FOUND THEN
      v_existing_one_rm := calculate_one_rep_max(coalesce(v_existing_pr.weight, 0), coalesce(v_existing_pr.reps, 0));
    ELSE
      v_existing_one_rm := 0;
    END IF;

    IF NOT FOUND OR v_new_one_rm > v_existing_one_rm THEN
      INSERT INTO personal_records (
        user_id,
        exercise_id,
        weight,
        reps,
        date,
        workout_id,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        v_exercise ->> 'exerciseId',
        v_best_weight,
        v_best_reps,
        p_completed_at::date,
        v_workout.id,
        timezone('utc', now()),
        timezone('utc', now())
      )
      ON CONFLICT (user_id, exercise_id)
      DO UPDATE SET
        weight = excluded.weight,
        reps = excluded.reps,
        date = excluded.date,
        workout_id = excluded.workout_id,
        updated_at = timezone('utc', now());
    END IF;
  END LOOP;

  RETURN to_jsonb(v_workout);
END;
$$;
