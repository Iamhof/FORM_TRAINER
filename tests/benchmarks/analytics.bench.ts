import { bench, describe } from 'vitest';

import { aggregateAnalyticsData } from '../../backend/trpc/routes/analytics/utils.js';

// Manual type definitions matching database schema (types/database.ts)
type DBAnalyticsData = {
  id: string;
  user_id: string;
  exercise_id: string;
  date: string;
  max_weight: number;
  total_volume: number;
  total_reps: number;
  created_at: string;
};

type ScheduleDay = {
  dayOfWeek: number;
  status: 'scheduled' | 'completed' | 'rest' | 'empty';
  sessionId?: string | null;
  weekStart: string;
};

type Schedule = {
  id: string;
  user_id: string;
  programme_id: string | null;
  week_start: string;
  schedule: ScheduleDay[];
  created_at: string;
  updated_at: string;
};

// Mock data generator
function generateMockAnalytics(days: number, exercisesPerDay: number): DBAnalyticsData[] {
  const data: DBAnalyticsData[] = [];
  const startDate = new Date('2025-07-01');
  const exerciseIds = Array.from({ length: 100 }, (_, i) => `exercise-${i}`);

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);
    const dateStr = date.toISOString().split('T')[0] ?? '';

    for (let ex = 0; ex < exercisesPerDay; ex++) {
      const exerciseId = exerciseIds[ex % exerciseIds.length] ?? 'exercise-0';

      data.push({
        id: `analytics-${day}-${ex}`,
        user_id: 'test-user-id',
        exercise_id: exerciseId,
        date: dateStr,
        max_weight: Math.floor(Math.random() * 200) + 50,
        total_volume: Math.floor(Math.random() * 5000) + 1000,
        total_reps: Math.floor(Math.random() * 20) + 10,
        created_at: date.toISOString(),
      });
    }
  }

  return data;
}

function generateMockWorkouts(days: number) {
  const workouts = [];
  const startDate = new Date('2025-07-01');

  for (let day = 0; day < days; day++) {
    if (Math.random() > 0.3) { // ~70% workout completion rate
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);

      workouts.push({
        completed_at: date.toISOString(),
        programme_id: 'test-programme-id',
      });
    }
  }

  return workouts;
}

function generateMockSchedules(weeks: number): Schedule[] {
  const schedules: Schedule[] = [];
  const startDate = new Date('2025-07-01');

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + week * 7);
    const weekStartStr = weekStart.toISOString().split('T')[0] ?? '';

    schedules.push({
      id: `schedule-${week}`,
      user_id: 'test-user-id',
      programme_id: 'test-programme-id',
      week_start: weekStartStr,
      schedule: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        status: i % 3 === 0 ? 'rest' : (Math.random() > 0.3 ? 'completed' : 'scheduled') as 'rest' | 'completed' | 'scheduled',
        sessionId: i % 3 === 0 ? null : `session-${week}-${i}`,
        weekStart: weekStartStr,
      })),
      created_at: weekStart.toISOString(),
      updated_at: weekStart.toISOString(),
    });
  }

  return schedules;
}

describe('analytics aggregation performance', () => {
  // Test case 1: Small dataset (baseline)
  const smallAnalytics = generateMockAnalytics(30, 10); // 1 month, 10 exercises/day = 300 data points
  const smallWorkouts = generateMockWorkouts(30);
  const smallSchedules = generateMockSchedules(4);

  bench('small dataset (300 data points)', () => {
    aggregateAnalyticsData(smallAnalytics, smallWorkouts, smallSchedules, 5);
  }, { iterations: 100 });

  // Test case 2: Medium dataset (realistic)
  const mediumAnalytics = generateMockAnalytics(90, 50); // 3 months, 50 exercises/day = 4,500 data points
  const mediumWorkouts = generateMockWorkouts(90);
  const mediumSchedules = generateMockSchedules(13);

  bench('medium dataset (4,500 data points)', () => {
    aggregateAnalyticsData(mediumAnalytics, mediumWorkouts, mediumSchedules, 5);
  }, { iterations: 50 });

  // Test case 3: Large dataset (power user - THIS IS THE CRITICAL ONE)
  const largeAnalytics = generateMockAnalytics(180, 100); // 6 months, 100 exercises/day = 18,000 data points
  const largeWorkouts = generateMockWorkouts(180);
  const largeSchedules = generateMockSchedules(26);

  bench('large dataset (18,000 data points) - CRITICAL', () => {
    aggregateAnalyticsData(largeAnalytics, largeWorkouts, largeSchedules, 5);
  }, { iterations: 10, warmupIterations: 2 });

  // Test case 4: Extreme dataset (stress test)
  const extremeAnalytics = generateMockAnalytics(365, 150); // 1 year, 150 exercises/day = 54,750 data points
  const extremeWorkouts = generateMockWorkouts(365);
  const extremeSchedules = generateMockSchedules(52);

  bench('extreme dataset (54,750 data points) - STRESS TEST', () => {
    aggregateAnalyticsData(extremeAnalytics, extremeWorkouts, extremeSchedules, 5);
  }, { iterations: 5, warmupIterations: 1 });
});
