import type { MuscleRegion } from './types';
import type { ExerciseCategory } from '@/types/exercises';

export const CATEGORY_TO_REGIONS: Record<ExerciseCategory, Partial<Record<MuscleRegion, number>>> = {
  Chest:      { chest: 1.0 },
  Back:       { upper_back: 0.7, lower_back: 0.3 },
  Shoulders:  { shoulders_front: 0.6, shoulders_rear: 0.4 },
  Arms:       { biceps: 0.5, triceps: 0.5 },
  Quads:      { quads: 1.0 },
  Hamstrings: { hamstrings: 1.0 },
  Glutes:     { glutes: 1.0 },
  Calves:     { calves_front: 0.5, calves_rear: 0.5 },
  Push:       { chest: 0.35, shoulders_front: 0.25, triceps: 0.25, abs: 0.15 },
  Pull:       { upper_back: 0.4, biceps: 0.3, lower_back: 0.15, shoulders_rear: 0.15 },
  Legs:       { quads: 0.35, glutes: 0.3, hamstrings: 0.25, calves_front: 0.05, calves_rear: 0.05 },
};

/**
 * Fallback mapping for DB exercises.muscle_group field (single string).
 * Used when an exercise isn't found in EXERCISE_LIBRARY.
 */
export const MUSCLE_GROUP_FALLBACK: Record<string, Partial<Record<MuscleRegion, number>>> = {
  Chest:      { chest: 1.0 },
  Back:       { upper_back: 0.7, lower_back: 0.3 },
  Shoulders:  { shoulders_front: 0.6, shoulders_rear: 0.4 },
  Arms:       { biceps: 0.5, triceps: 0.5 },
  Legs:       { quads: 0.35, glutes: 0.3, hamstrings: 0.25, calves_front: 0.05, calves_rear: 0.05 },
  Core:       { abs: 1.0 },
  Glutes:     { glutes: 1.0 },
  Hamstrings: { hamstrings: 1.0 },
  Quads:      { quads: 1.0 },
  Calves:     { calves_front: 0.5, calves_rear: 0.5 },
  Biceps:     { biceps: 1.0 },
  Triceps:    { triceps: 1.0 },
};
