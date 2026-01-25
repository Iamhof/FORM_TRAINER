export type ExerciseCategory = 
  | 'Push' 
  | 'Pull' 
  | 'Legs' 
  | 'Arms' 
  | 'Chest' 
  | 'Back' 
  | 'Shoulders' 
  | 'Quads' 
  | 'Hamstrings' 
  | 'Glutes' 
  | 'Calves';

export type ExerciseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  name: string;
  categories: ExerciseCategory[];
  thumbnail: string;
  videoUrl: string;
  description: string;
  instructions: string[];
  tips?: string[];
  difficulty?: ExerciseDifficulty;
  equipment?: string[];
}
