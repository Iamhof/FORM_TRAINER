export type MuscleRegion =
  | 'chest'
  | 'shoulders_front'
  | 'biceps'
  | 'abs'
  | 'quads'
  | 'calves_front'
  | 'upper_back'
  | 'lower_back'
  | 'shoulders_rear'
  | 'triceps'
  | 'glutes'
  | 'hamstrings'
  | 'calves_rear';

export type MuscleView = 'front' | 'back';

export type MusclePathData = {
  region: MuscleRegion;
  label: string;
  view: MuscleView;
  d: string;
};

export type MuscleVolumeData = {
  volume: number;
  sets: number;
  intensity: number;
};

export type HeatmapPeriod = 'week' | 'month' | 'three_months' | 'all';

export const MUSCLE_REGIONS: MuscleRegion[] = [
  'chest',
  'shoulders_front',
  'biceps',
  'abs',
  'quads',
  'calves_front',
  'upper_back',
  'lower_back',
  'shoulders_rear',
  'triceps',
  'glutes',
  'hamstrings',
  'calves_rear',
];

export const REGION_LABELS: Record<MuscleRegion, string> = {
  chest: 'Chest',
  shoulders_front: 'Front Delts',
  biceps: 'Biceps',
  abs: 'Core',
  quads: 'Quads',
  calves_front: 'Calves',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  shoulders_rear: 'Rear Delts',
  triceps: 'Triceps',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves_rear: 'Calves',
};
