export type ExerciseCategory = 'push' | 'pull' | 'legs';
export type ExerciseType = 'compound' | 'isolation';

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: string;
  type: ExerciseType;
};

export const EXERCISES: Exercise[] = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'push', muscleGroup: 'Chest', type: 'compound' },
  { id: 'barbell-squat', name: 'Barbell Squat', category: 'legs', muscleGroup: 'Legs', type: 'compound' },
  { id: 'deadlift', name: 'Deadlift', category: 'pull', muscleGroup: 'Back', type: 'compound' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'push', muscleGroup: 'Shoulders', type: 'compound' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'pull', muscleGroup: 'Back', type: 'compound' },
  { id: 'pull-ups', name: 'Pull-ups', category: 'pull', muscleGroup: 'Back', type: 'compound' },
  { id: 'dips', name: 'Dips', category: 'push', muscleGroup: 'Chest', type: 'compound' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'push', muscleGroup: 'Chest', type: 'compound' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'push', muscleGroup: 'Shoulders', type: 'compound' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'pull', muscleGroup: 'Back', type: 'compound' },
  { id: 'cable-fly', name: 'Cable Fly', category: 'push', muscleGroup: 'Chest', type: 'isolation' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'push', muscleGroup: 'Arms', type: 'isolation' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'legs', muscleGroup: 'Legs', type: 'compound' },
  { id: 'leg-press', name: 'Leg Press', category: 'legs', muscleGroup: 'Legs', type: 'compound' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'legs', muscleGroup: 'Legs', type: 'isolation' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'legs', muscleGroup: 'Legs', type: 'isolation' },
  { id: 'bicep-curl', name: 'Bicep Curl', category: 'pull', muscleGroup: 'Arms', type: 'isolation' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'pull', muscleGroup: 'Arms', type: 'isolation' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'push', muscleGroup: 'Shoulders', type: 'isolation' },
  { id: 'face-pull', name: 'Face Pull', category: 'pull', muscleGroup: 'Shoulders', type: 'isolation' },
];
