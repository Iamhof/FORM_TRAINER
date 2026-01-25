-- Data RPCs for workouts, analytics and scheduling integrity

set check_function_bodies = off;

create or replace function public.build_default_schedule(p_week_start date)
returns jsonb
language sql
as $$
  select jsonb_agg(
    jsonb_build_object(
      'dayOfWeek', gs,
      'status', 'empty',
      'sessionId', null,
      'weekStart', to_char(p_week_start, 'YYYY-MM-DD')
    )
  )
  from generate_series(0, 6) as gs;
$$;

create or replace function public.calculate_one_rep_max(p_weight numeric, p_reps integer)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_reps, 0) <= 0 then 0
    when p_reps = 1 then coalesce(p_weight, 0)
    else coalesce(p_weight, 0) * (1 + (p_reps::numeric / 30))
  end;
$$;

create or replace function public.log_workout_transaction(
  p_user_id uuid,
  p_programme_id uuid,
  p_programme_name text,
  p_day integer,
  p_week integer,
  p_exercises jsonb,
  p_completed_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
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
begin
  if v_user_id is null then
    raise exception 'user_id parameter is null';
  end if;

  v_week_start := (date_trunc('week', timezone('utc', p_completed_at)))::date;
  v_day_idx := case when extract(dow from p_completed_at) = 0 then 6 else extract(dow from p_completed_at)::int - 1 end;

  insert into workouts (
    user_id,
    programme_id,
    programme_name,
    day,
    week,
    exercises,
    completed_at,
    created_at
  )
  values (
    v_user_id,
    p_programme_id,
    p_programme_name,
    p_day,
    p_week,
    p_exercises,
    p_completed_at,
    timezone('utc', now())
  )
  returning * into v_workout;

  select * into v_schedule_row
  from schedules
  where user_id = v_user_id
    and week_start = v_week_start
  for update;

  if not found then
    v_schedule := build_default_schedule(v_week_start);
    insert into schedules (
      user_id,
      programme_id,
      week_start,
      schedule,
      created_at,
      updated_at
    )
    values (
      v_user_id,
      p_programme_id,
      v_week_start,
      v_schedule,
      timezone('utc', now()),
      timezone('utc', now())
    )
    returning id, schedule into v_schedule_id, v_schedule;
  else
    v_schedule_id := v_schedule_row.id;
    v_schedule := coalesce(v_schedule_row.schedule::jsonb, build_default_schedule(v_week_start));
  end if;

  if p_programme_id is not null then
    select days into v_programme_days from programmes where id = p_programme_id;
  elsif v_schedule_row.programme_id is not null then
    select days into v_programme_days from programmes where id = v_schedule_row.programme_id;
  end if;

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

  update schedules
  set schedule = v_new_schedule,
      programme_id = coalesce(p_programme_id, programme_id),
      updated_at = timezone('utc', now())
  where id = v_schedule_id;

  for v_exercise in select value from jsonb_array_elements(p_exercises)
  loop
    v_completed_sets := (
      select coalesce(jsonb_agg(elem.value), '[]'::jsonb)
      from jsonb_array_elements(v_exercise -> 'sets') elem
      where coalesce((elem.value ->> 'completed')::boolean, false)
    );

    if jsonb_array_length(v_completed_sets) = 0 then
      continue;
    end if;

    select
      coalesce(sum((elem ->> 'weight')::numeric * (elem ->> 'reps')::numeric), 0),
      coalesce(sum((elem ->> 'reps')::integer), 0),
      coalesce(max((elem ->> 'weight')::numeric), 0)
    into
      v_total_volume,
      v_total_reps,
      v_max_weight
    from jsonb_array_elements(v_completed_sets) elem;

    select elem.value
    into v_best_set
    from jsonb_array_elements(v_completed_sets) elem
    order by calculate_one_rep_max((elem.value ->> 'weight')::numeric, (elem.value ->> 'reps')::integer) desc
    limit 1;

    v_best_weight := (v_best_set ->> 'weight')::numeric;
    v_best_reps := (v_best_set ->> 'reps')::integer;
    v_new_one_rm := calculate_one_rep_max(v_best_weight, v_best_reps);

    insert into analytics (
      user_id,
      exercise_id,
      date,
      max_weight,
      total_volume,
      total_reps,
      created_at,
      updated_at
    )
    values (
      v_user_id,
      v_exercise ->> 'exerciseId',
      p_completed_at::date,
      v_max_weight,
      v_total_volume,
      v_total_reps,
      timezone('utc', now()),
      timezone('utc', now())
    )
    on conflict (user_id, exercise_id, date)
    do update set
      max_weight = greatest(excluded.max_weight, analytics.max_weight),
      total_volume = excluded.total_volume,
      total_reps = excluded.total_reps,
      updated_at = timezone('utc', now());

    select *
    into v_existing_pr
    from personal_records
    where user_id = v_user_id
      and exercise_id = v_exercise ->> 'exerciseId';

    if found then
      v_existing_one_rm := calculate_one_rep_max(coalesce(v_existing_pr.weight, 0), coalesce(v_existing_pr.reps, 0));
    else
      v_existing_one_rm := 0;
    end if;

    if not found or v_new_one_rm > v_existing_one_rm then
      insert into personal_records (
        user_id,
        exercise_id,
        weight,
        reps,
        date,
        workout_id,
        created_at,
        updated_at
      )
      values (
        v_user_id,
        v_exercise ->> 'exerciseId',
        v_best_weight,
        v_best_reps,
        p_completed_at::date,
        v_workout.id,
        timezone('utc', now()),
        timezone('utc', now())
      )
      on conflict (user_id, exercise_id)
      do update set
        weight = excluded.weight,
        reps = excluded.reps,
        date = excluded.date,
        workout_id = excluded.workout_id,
        updated_at = timezone('utc', now());
    end if;
  end loop;

  return to_jsonb(v_workout);
end;
$$;

create or replace function public.get_volume(p_period text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period text := lower(coalesce(p_period, 'week'));
  v_today date := (timezone('utc', now()))::date;
  v_start_current date;
  v_end_current date;
  v_start_previous date;
  v_end_previous date;
  v_total_volume numeric := 0;
  v_previous_volume numeric := 0;
  v_workout_count integer := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('totalVolumeKg', 0, 'workoutCount', 0, 'previousPeriodVolumeKg', 0, 'percentageChange', 0);
  end if;

  if v_period not in ('week', 'month', 'total') then
    raise exception 'invalid period %', v_period;
  end if;

  if v_period = 'week' then
    v_start_current := date_trunc('week', v_today);
    v_end_current := v_start_current + interval '6 day';
    v_start_previous := v_start_current - interval '7 day';
    v_end_previous := v_start_current - interval '1 day';
  elsif v_period = 'month' then
    v_start_current := date_trunc('month', v_today);
    v_end_current := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
    v_start_previous := (v_start_current - interval '1 month')::date;
    v_end_previous := (v_start_current - interval '1 day')::date;
  else
    v_start_current := to_date('1970-01-01', 'YYYY-MM-DD');
    v_end_current := v_today;
    v_start_previous := null;
    v_end_previous := null;
  end if;

  select coalesce(sum(total_volume), 0), count(distinct date)
  into v_total_volume, v_workout_count
  from analytics
  where user_id = v_user_id
    and date between v_start_current and v_end_current;

  if v_start_previous is not null then
    select coalesce(sum(total_volume), 0)
    into v_previous_volume
    from analytics
    where user_id = v_user_id
      and date between v_start_previous and v_end_previous;
  end if;

  return jsonb_build_object(
    'totalVolumeKg', round((v_total_volume / 1000)::numeric, 1),
    'workoutCount', v_workout_count,
    'previousPeriodVolumeKg', round((v_previous_volume / 1000)::numeric, 1),
    'percentageChange', case
      when v_previous_volume > 0 then round(((v_total_volume - v_previous_volume) / v_previous_volume * 100)::numeric, 1)
      when v_total_volume > 0 then 100
      else 0
    end
  );
end;
$$;

create or replace function public.get_strength_trend(p_months integer default 6)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_months integer := greatest(coalesce(p_months, 6), 1);
  v_start date := (date_trunc('month', timezone('utc', now())) - (v_months - 1) * interval '1 month')::date;
  v_result jsonb;
begin
  if v_user_id is null then
    return jsonb_build_object('analytics', '[]'::jsonb, 'workouts', '[]'::jsonb, 'schedules', '[]'::jsonb);
  end if;

  select jsonb_build_object(
    'analytics', coalesce((select jsonb_agg(row_to_json(a)) from (select * from analytics where user_id = v_user_id and date >= v_start order by date) a), '[]'::jsonb),
    'workouts', coalesce((select jsonb_agg(row_to_json(w)) from (select id, programme_id, programme_name, completed_at from workouts where user_id = v_user_id and completed_at >= v_start order by completed_at) w), '[]'::jsonb),
    'schedules', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'programmeId', s.programme_id,
      'weekStart', s.week_start,
      'schedule', coalesce(s.schedule::jsonb, build_default_schedule(s.week_start))
    )) from schedules s where s.user_id = v_user_id and s.week_start >= v_start order by s.week_start), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.toggle_schedule_day(
  p_week_start date,
  p_day_index integer,
  p_programme_id uuid,
  p_force_status text default null,
  p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_schedule_row schedules%rowtype;
  v_schedule jsonb;
  v_schedule_id uuid;
  v_required_days integer := 7;
  v_new_status text;
  v_scheduled_count integer;
  v_payload jsonb;
begin
  if v_user_id is null then
    raise exception 'auth.uid() is null';
  end if;

  select * into v_schedule_row
  from schedules
  where user_id = v_user_id
    and week_start = p_week_start
  for update;

  if not found then
    v_schedule := build_default_schedule(p_week_start);
    insert into schedules (
      user_id,
      programme_id,
      week_start,
      schedule,
      created_at,
      updated_at
    )
    values (
      v_user_id,
      p_programme_id,
      p_week_start,
      v_schedule,
      timezone('utc', now()),
      timezone('utc', now())
    )
    returning id, schedule into v_schedule_id, v_schedule;
  else
    v_schedule_id := v_schedule_row.id;
    v_schedule := coalesce(v_schedule_row.schedule::jsonb, build_default_schedule(p_week_start));
  end if;

  if p_programme_id is not null then
    select days into v_required_days from programmes where id = p_programme_id;
  elsif v_schedule_row.programme_id is not null then
    select days into v_required_days from programmes where id = v_schedule_row.programme_id;
  end if;

  v_scheduled_count := (
    select count(*)
    from jsonb_array_elements(v_schedule) elem
    where elem ->> 'status' = 'scheduled'
  );

  if p_force_status is not null then
    v_new_status := lower(p_force_status);
  else
    if (v_schedule -> p_day_index ->> 'status') = 'scheduled' then
      v_new_status := 'rest';
    else
      if v_required_days is not null and v_required_days > 0 and v_scheduled_count >= v_required_days then
        raise exception 'maximum scheduled sessions reached';
      end if;
      v_new_status := 'scheduled';
    end if;
  end if;

  v_payload := jsonb_set(
    jsonb_set(
      jsonb_set(
        v_schedule,
        ARRAY[p_day_index::text, 'status'],
        to_jsonb(v_new_status),
        true
      ),
      ARRAY[p_day_index::text, 'sessionId'],
      case when p_session_id is null then 'null'::jsonb else to_jsonb(p_session_id::text) end,
      true
    ),
    ARRAY[p_day_index::text, 'weekStart'],
    to_jsonb(to_char(p_week_start, 'YYYY-MM-DD')),
    true
  );

  update schedules
  set schedule = v_payload,
      programme_id = coalesce(p_programme_id, programme_id),
      updated_at = timezone('utc', now())
  where id = v_schedule_id;

  return jsonb_build_object(
    'id', v_schedule_id,
    'programmeId', coalesce(p_programme_id, v_schedule_row.programme_id),
    'weekStart', p_week_start,
    'schedule', v_payload
  );
end;
$$;

grant execute on function public.log_workout_transaction(uuid, uuid, text, integer, integer, jsonb, timestamptz) to authenticated;
grant execute on function public.get_volume(text) to authenticated;
grant execute on function public.get_strength_trend(integer) to authenticated;
grant execute on function public.toggle_schedule_day(date, integer, uuid, text, uuid) to authenticated;
