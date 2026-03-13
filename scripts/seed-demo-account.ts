/**
 * seed-demo-account.ts
 *
 * Creates a demo account for Apple App Store reviewers with pre-populated data.
 * Credentials: demo@formworkout.app / DemoReview2026!
 *
 * Usage:
 *   EXPO_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo-account.ts
 *
 * This script is idempotent — re-running it will delete the old demo user and recreate.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'demo@formworkout.app';
const DEMO_PASSWORD = 'DemoReview2026!';

// Exercise IDs from the exercise library
const EXERCISES = {
  benchPress: 'barbell-bench-press',
  squat: 'barbell-squat',
  deadlift: 'deadlift',
  overheadPress: 'barbell-overhead-press',
  barbellRow: 'barbell-row',
  pullUps: 'pull-ups',
  dips: 'dips',
  legPress: 'leg-press',
  latPulldown: 'lat-pulldown',
  bicepCurl: 'bicep-curl',
  tricepPushdown: 'tricep-pushdown',
  lateralRaise: 'lateral-raise',
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateOnly(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0]!;
}

async function cleanExistingDemo() {
  // Find existing demo user by email
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = users?.users?.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    // delete_user_data RPC cascades all data
    await supabase.rpc('delete_user_data', { p_user_id: existing.id });
    await supabase.auth.admin.deleteUser(existing.id);
    console.info('Cleaned up existing demo account.');
  }
}

async function createDemoUser(): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create demo user: ${error.message}`);
  console.info(`Created demo user: ${data.user.id}`);
  return data.user.id;
}

async function seedProfile(userId: string) {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    name: 'Demo Reviewer',
    role: 'user',
    is_pt: false,
    accent_color: '#A855F7',
    gender: 'prefer_not_to_say',
    current_xp: 420,
    current_level: 4,
    leaderboard_enabled: true,
    leaderboard_display_name: 'DemoReviewer',
  });
  if (error) throw new Error(`Failed to seed profile: ${error.message}`);
  console.info('Seeded profile.');
}

async function seedProgramme(userId: string): Promise<string> {
  const exercises = [
    // Day 1 - Push
    { day: 1, exerciseId: EXERCISES.benchPress, sets: 4, reps: '8-10', rest: 120 },
    { day: 1, exerciseId: EXERCISES.overheadPress, sets: 3, reps: '8-10', rest: 90 },
    { day: 1, exerciseId: EXERCISES.dips, sets: 3, reps: '10-12', rest: 60 },
    { day: 1, exerciseId: EXERCISES.lateralRaise, sets: 3, reps: '12-15', rest: 60 },
    { day: 1, exerciseId: EXERCISES.tricepPushdown, sets: 3, reps: '12-15', rest: 60 },
    // Day 2 - Pull
    { day: 2, exerciseId: EXERCISES.deadlift, sets: 4, reps: '5-6', rest: 180 },
    { day: 2, exerciseId: EXERCISES.barbellRow, sets: 4, reps: '8-10', rest: 90 },
    { day: 2, exerciseId: EXERCISES.pullUps, sets: 3, reps: '6-10', rest: 90 },
    { day: 2, exerciseId: EXERCISES.latPulldown, sets: 3, reps: '10-12', rest: 60 },
    { day: 2, exerciseId: EXERCISES.bicepCurl, sets: 3, reps: '12-15', rest: 60 },
    // Day 3 - Legs
    { day: 3, exerciseId: EXERCISES.squat, sets: 4, reps: '6-8', rest: 180 },
    { day: 3, exerciseId: EXERCISES.legPress, sets: 4, reps: '10-12', rest: 120 },
  ];

  const { data, error } = await supabase
    .from('programmes')
    .insert({
      user_id: userId,
      name: 'Push Pull Legs',
      days: 3,
      weeks: 8,
      exercises,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to seed programme: ${error.message}`);
  console.info(`Seeded programme: ${data.id}`);
  return data.id;
}

type WorkoutDef = {
  daysBack: number;
  day: number;
  week: number;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number; completed: boolean }[];
  }[];
};

async function seedWorkouts(
  userId: string,
  programmeId: string,
  programmeName: string
): Promise<string[]> {
  const workoutDefs: WorkoutDef[] = [
    // Week 1
    {
      daysBack: 21,
      day: 1,
      week: 1,
      exercises: [
        {
          exerciseId: EXERCISES.benchPress,
          sets: [
            { weight: 60, reps: 10, completed: true },
            { weight: 65, reps: 9, completed: true },
            { weight: 65, reps: 8, completed: true },
            { weight: 60, reps: 10, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.overheadPress,
          sets: [
            { weight: 30, reps: 10, completed: true },
            { weight: 35, reps: 8, completed: true },
            { weight: 35, reps: 8, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.dips,
          sets: [
            { weight: 0, reps: 12, completed: true },
            { weight: 0, reps: 10, completed: true },
            { weight: 0, reps: 10, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 19,
      day: 2,
      week: 1,
      exercises: [
        {
          exerciseId: EXERCISES.deadlift,
          sets: [
            { weight: 80, reps: 6, completed: true },
            { weight: 90, reps: 5, completed: true },
            { weight: 90, reps: 5, completed: true },
            { weight: 80, reps: 6, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.barbellRow,
          sets: [
            { weight: 50, reps: 10, completed: true },
            { weight: 55, reps: 8, completed: true },
            { weight: 55, reps: 8, completed: true },
            { weight: 50, reps: 10, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.pullUps,
          sets: [
            { weight: 0, reps: 8, completed: true },
            { weight: 0, reps: 7, completed: true },
            { weight: 0, reps: 6, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 17,
      day: 3,
      week: 1,
      exercises: [
        {
          exerciseId: EXERCISES.squat,
          sets: [
            { weight: 70, reps: 8, completed: true },
            { weight: 80, reps: 6, completed: true },
            { weight: 80, reps: 6, completed: true },
            { weight: 70, reps: 8, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.legPress,
          sets: [
            { weight: 100, reps: 12, completed: true },
            { weight: 120, reps: 10, completed: true },
            { weight: 120, reps: 10, completed: true },
            { weight: 100, reps: 12, completed: true },
          ],
        },
      ],
    },
    // Week 2
    {
      daysBack: 14,
      day: 1,
      week: 2,
      exercises: [
        {
          exerciseId: EXERCISES.benchPress,
          sets: [
            { weight: 65, reps: 10, completed: true },
            { weight: 70, reps: 8, completed: true },
            { weight: 70, reps: 8, completed: true },
            { weight: 65, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.overheadPress,
          sets: [
            { weight: 35, reps: 10, completed: true },
            { weight: 37.5, reps: 8, completed: true },
            { weight: 37.5, reps: 7, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 12,
      day: 2,
      week: 2,
      exercises: [
        {
          exerciseId: EXERCISES.deadlift,
          sets: [
            { weight: 90, reps: 6, completed: true },
            { weight: 95, reps: 5, completed: true },
            { weight: 95, reps: 5, completed: true },
            { weight: 90, reps: 6, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.barbellRow,
          sets: [
            { weight: 55, reps: 10, completed: true },
            { weight: 57.5, reps: 9, completed: true },
            { weight: 57.5, reps: 8, completed: true },
            { weight: 55, reps: 10, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 10,
      day: 3,
      week: 2,
      exercises: [
        {
          exerciseId: EXERCISES.squat,
          sets: [
            { weight: 80, reps: 8, completed: true },
            { weight: 85, reps: 6, completed: true },
            { weight: 85, reps: 6, completed: true },
            { weight: 80, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.legPress,
          sets: [
            { weight: 120, reps: 12, completed: true },
            { weight: 130, reps: 10, completed: true },
            { weight: 130, reps: 10, completed: true },
            { weight: 120, reps: 11, completed: true },
          ],
        },
      ],
    },
    // Week 3 (most recent)
    {
      daysBack: 7,
      day: 1,
      week: 3,
      exercises: [
        {
          exerciseId: EXERCISES.benchPress,
          sets: [
            { weight: 70, reps: 10, completed: true },
            { weight: 72.5, reps: 8, completed: true },
            { weight: 72.5, reps: 8, completed: true },
            { weight: 70, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.overheadPress,
          sets: [
            { weight: 37.5, reps: 10, completed: true },
            { weight: 40, reps: 8, completed: true },
            { weight: 40, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.dips,
          sets: [
            { weight: 5, reps: 10, completed: true },
            { weight: 5, reps: 9, completed: true },
            { weight: 5, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 5,
      day: 2,
      week: 3,
      exercises: [
        {
          exerciseId: EXERCISES.deadlift,
          sets: [
            { weight: 95, reps: 6, completed: true },
            { weight: 100, reps: 5, completed: true },
            { weight: 100, reps: 5, completed: true },
            { weight: 95, reps: 6, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.barbellRow,
          sets: [
            { weight: 57.5, reps: 10, completed: true },
            { weight: 60, reps: 9, completed: true },
            { weight: 60, reps: 8, completed: true },
            { weight: 57.5, reps: 10, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.pullUps,
          sets: [
            { weight: 0, reps: 10, completed: true },
            { weight: 0, reps: 9, completed: true },
            { weight: 0, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      daysBack: 3,
      day: 3,
      week: 3,
      exercises: [
        {
          exerciseId: EXERCISES.squat,
          sets: [
            { weight: 85, reps: 8, completed: true },
            { weight: 90, reps: 6, completed: true },
            { weight: 90, reps: 6, completed: true },
            { weight: 85, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: EXERCISES.legPress,
          sets: [
            { weight: 130, reps: 12, completed: true },
            { weight: 140, reps: 10, completed: true },
            { weight: 140, reps: 10, completed: true },
            { weight: 130, reps: 11, completed: true },
          ],
        },
      ],
    },
  ];

  const workoutIds: string[] = [];

  for (const w of workoutDefs) {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        programme_id: programmeId,
        programme_name: programmeName,
        day: w.day,
        week: w.week,
        exercises: w.exercises,
        completed_at: daysAgo(w.daysBack),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to seed workout (day ${w.day} week ${w.week}): ${error.message}`);
    workoutIds.push(data.id);
  }

  console.info(`Seeded ${workoutIds.length} workouts.`);
  return workoutIds;
}

async function seedAnalytics(userId: string) {
  // Analytics entries for key exercises across the 3 weeks
  const entries = [
    // Bench press progression
    { exercise_id: EXERCISES.benchPress, date: dateOnly(21), max_weight: 65, total_volume: 2540, total_reps: 37 },
    { exercise_id: EXERCISES.benchPress, date: dateOnly(14), max_weight: 70, total_volume: 2695, total_reps: 35 },
    { exercise_id: EXERCISES.benchPress, date: dateOnly(7), max_weight: 72.5, total_volume: 2855, total_reps: 35 },
    // Squat progression
    { exercise_id: EXERCISES.squat, date: dateOnly(17), max_weight: 80, total_volume: 2240, total_reps: 28 },
    { exercise_id: EXERCISES.squat, date: dateOnly(10), max_weight: 85, total_volume: 2395, total_reps: 27 },
    { exercise_id: EXERCISES.squat, date: dateOnly(3), max_weight: 90, total_volume: 2520, total_reps: 27 },
    // Deadlift progression
    { exercise_id: EXERCISES.deadlift, date: dateOnly(19), max_weight: 90, total_volume: 1900, total_reps: 22 },
    { exercise_id: EXERCISES.deadlift, date: dateOnly(12), max_weight: 95, total_volume: 2040, total_reps: 22 },
    { exercise_id: EXERCISES.deadlift, date: dateOnly(5), max_weight: 100, total_volume: 2160, total_reps: 22 },
    // OHP progression
    { exercise_id: EXERCISES.overheadPress, date: dateOnly(21), max_weight: 35, total_volume: 830, total_reps: 26 },
    { exercise_id: EXERCISES.overheadPress, date: dateOnly(14), max_weight: 37.5, total_volume: 880, total_reps: 25 },
    { exercise_id: EXERCISES.overheadPress, date: dateOnly(7), max_weight: 40, total_volume: 950, total_reps: 25 },
    // Barbell row
    { exercise_id: EXERCISES.barbellRow, date: dateOnly(19), max_weight: 55, total_volume: 2100, total_reps: 36 },
    { exercise_id: EXERCISES.barbellRow, date: dateOnly(12), max_weight: 57.5, total_volume: 2240, total_reps: 37 },
    { exercise_id: EXERCISES.barbellRow, date: dateOnly(5), max_weight: 60, total_volume: 2360, total_reps: 37 },
  ];

  const { error } = await supabase
    .from('analytics')
    .insert(entries.map((e) => ({ ...e, user_id: userId })));

  if (error) throw new Error(`Failed to seed analytics: ${error.message}`);
  console.info(`Seeded ${entries.length} analytics entries.`);
}

async function seedPersonalRecords(userId: string, workoutIds: string[]) {
  // PRs set during the most recent workouts (week 3)
  const records = [
    { exercise_id: EXERCISES.benchPress, weight: 72.5, reps: 8, date: dateOnly(7), workout_id: workoutIds[6] },
    { exercise_id: EXERCISES.squat, weight: 90, reps: 6, date: dateOnly(3), workout_id: workoutIds[8] },
    { exercise_id: EXERCISES.deadlift, weight: 100, reps: 5, date: dateOnly(5), workout_id: workoutIds[7] },
    { exercise_id: EXERCISES.overheadPress, weight: 40, reps: 8, date: dateOnly(7), workout_id: workoutIds[6] },
    { exercise_id: EXERCISES.barbellRow, weight: 60, reps: 9, date: dateOnly(5), workout_id: workoutIds[7] },
    { exercise_id: EXERCISES.legPress, weight: 140, reps: 10, date: dateOnly(3), workout_id: workoutIds[8] },
  ];

  const { error } = await supabase
    .from('personal_records')
    .insert(records.map((r) => ({ ...r, user_id: userId })));

  if (error) throw new Error(`Failed to seed personal records: ${error.message}`);
  console.info(`Seeded ${records.length} personal records.`);
}

async function seedBodyMetrics(userId: string) {
  const entries = [
    { date: dateOnly(21), weight: 78.5, body_fat_percentage: 18.2 },
    { date: dateOnly(14), weight: 78.2, body_fat_percentage: 17.9 },
    { date: dateOnly(7), weight: 77.8, body_fat_percentage: 17.5 },
    { date: dateOnly(0), weight: 77.5, body_fat_percentage: 17.2 },
  ];

  const { error } = await supabase
    .from('body_metrics')
    .insert(entries.map((e) => ({ ...e, user_id: userId })));

  if (error) throw new Error(`Failed to seed body metrics: ${error.message}`);
  console.info(`Seeded ${entries.length} body metric entries.`);
}

async function seedLeaderboardStats(userId: string) {
  const { error } = await supabase.from('leaderboard_stats').upsert({
    user_id: userId,
    total_visits: 9,
    current_month_visits: 9,
    total_volume_kg: 22385,
    current_month_volume_kg: 22385,
    avg_strength_increase_percent: 8.5,
    current_month_strength_increase_percent: 8.5,
    current_streak_weeks: 3,
    longest_streak_weeks: 3,
    exercise_records: {
      [EXERCISES.benchPress]: { weight: 72.5, reps: 8, date: dateOnly(7) },
      [EXERCISES.squat]: { weight: 90, reps: 6, date: dateOnly(3) },
      [EXERCISES.deadlift]: { weight: 100, reps: 5, date: dateOnly(5) },
    },
  });
  if (error) throw new Error(`Failed to seed leaderboard stats: ${error.message}`);
  console.info('Seeded leaderboard stats.');
}

async function main() {
  console.info('--- FORM Demo Account Seed ---\n');

  await cleanExistingDemo();
  const userId = await createDemoUser();

  await seedProfile(userId);
  const programmeId = await seedProgramme(userId);
  const workoutIds = await seedWorkouts(userId, programmeId, 'Push Pull Legs');
  await seedAnalytics(userId);
  await seedPersonalRecords(userId, workoutIds);
  await seedBodyMetrics(userId);
  await seedLeaderboardStats(userId);

  console.info('\n--- Done! ---');
  console.info(`Email:    ${DEMO_EMAIL}`);
  console.info(`Password: ${DEMO_PASSWORD}`);
  console.info(`User ID:  ${userId}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
