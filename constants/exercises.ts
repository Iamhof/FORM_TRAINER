export type Exercise = {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  type: string;
  created_at?: string;
};

// Deprecated: Use useExercises hook
export const EXERCISES: Exercise[] = [];
