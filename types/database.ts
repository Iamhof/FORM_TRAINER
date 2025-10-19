export interface User {
  id: string;
  email: string;
  name: string;
  is_pt: boolean;
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
