export type MonthlyDataPoint = {
  month: string;
  value: number;
};

export type ExerciseProgress = {
  exerciseName: string;
  startWeight: number;
  currentWeight: number;
  percentageIncrease: number;
  history: {
    date: string;
    weight: number;
  }[];
};

export type AnalyticsData = {
  sessionsCompleted: MonthlyDataPoint[];
  sessionsMissed: MonthlyDataPoint[];
  completionRate: MonthlyDataPoint[];
  totalVolume: MonthlyDataPoint[];
  exerciseProgress: ExerciseProgress[];
  restDays: {
    thisMonth: number;
    lastMonth: number;
    average: number;
  };
};
