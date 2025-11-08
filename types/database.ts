export interface User {
  id: string;
  email: string;
  name: string;
  is_pt: boolean;
  accent_color?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  leaderboard_enabled?: boolean;
  leaderboard_display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Programme {
  id: string;
  user_id: string;
  name: string;
  days: number;
  weeks: number;
  exercises: ProgrammeExercise[];
  created_at: string;
  updated_at: string;
}

export interface ProgrammeExercise {
  day: number;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
}

export interface Workout {
  id: string;
  user_id: string;
  programme_id: string;
  programme_name: string;
  day: number;
  week: number;
  exercises: WorkoutExercise[];
  completed_at: string;
  created_at: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface AnalyticsData {
  id: string;
  user_id: string;
  exercise_id: string;
  date: string;
  max_weight: number;
  total_volume: number;
  total_reps: number;
  created_at: string;
}

export interface PTClientRelationship {
  id: string;
  pt_id: string;
  client_id: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PTInvitation {
  id: string;
  pt_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface SharedProgramme {
  id: string;
  programme_id: string;
  pt_id: string;
  client_id: string;
  shared_at: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  programme_id: string | null;
  week_start: string;
  schedule: ScheduleDay[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleDay {
  dayOfWeek: number;
  status: 'scheduled' | 'completed' | 'rest' | 'empty';
  weekStart: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  muscle_mass: number | null;
  body_fat_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  date: string;
  workout_id: string | null;
  created_at: string;
}

export interface LeaderboardStats {
  id: string;
  user_id: string;
  total_visits: number;
  current_month_visits: number;
  total_volume_kg: number;
  current_month_volume_kg: number;
  avg_strength_increase_percent: number;
  current_month_strength_increase_percent: number;
  current_streak_weeks: number;
  longest_streak_weeks: number;
  exercise_records: Record<string, ExerciseRecord>;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseRecord {
  weight: number;
  reps: number;
  date: string;
}

export interface UserVisit {
  id: string;
  user_id: string;
  visit_date: string;
  created_at: string;
}

export interface WeeklyCompletion {
  id: string;
  user_id: string;
  programme_id: string | null;
  week_start_date: string;
  week_number: number;
  total_sessions: number;
  completed_sessions: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export type LeaderboardCategory = 
  | 'total_visits'
  | 'month_visits'
  | 'total_volume'
  | 'month_volume'
  | 'month_strength_increase'
  | 'streak'
  | 'squat'
  | 'deadlift'
  | 'bench_press';

export type Gender = 'all' | 'male' | 'female';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  value: number;
  is_current_user: boolean;
}

export interface LeaderboardData {
  category: LeaderboardCategory;
  gender: Gender;
  entries: LeaderboardEntry[];
  current_user_entry: LeaderboardEntry | null;
  total_participants: number;
  last_updated: string;
}
