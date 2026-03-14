import { describe, expect, test } from 'vitest';

import { aggregateAnalyticsData } from '@/backend/trpc/routes/analytics/utils';
import { AnalyticsData as DBAnalyticsData, Schedule } from '@/types/database';

// Generate dates relative to now so tests don't break as time passes
function recentDate(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`;
}

function recentISO(monthsAgo: number): string {
  return `${recentDate(monthsAgo)}T08:00:00Z`;
}

function recentWeekStart(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(d.getDate() - d.getDay() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('aggregateAnalyticsData', () => {
  test('computes monthly metrics and streak from raw data', () => {
    const analytics: DBAnalyticsData[] = [
      {
        id: 'a1',
        user_id: 'u1',
        exercise_id: 'squat',
        date: recentDate(1),
        max_weight: 120,
        total_volume: 12000,
        total_reps: 30,
        created_at: recentISO(1),
      } as DBAnalyticsData,
      {
        id: 'a2',
        user_id: 'u1',
        exercise_id: 'squat',
        date: recentDate(0),
        max_weight: 125,
        total_volume: 12500,
        total_reps: 28,
        created_at: recentISO(0),
      } as DBAnalyticsData,
    ];

    const weekStart = recentWeekStart(0);
    const workouts = [
      { completed_at: recentISO(0), programme_id: 'p1' },
      { completed_at: recentISO(0), programme_id: 'p1' },
    ];

    const schedules: Schedule[] = [
      {
        id: 's1',
        user_id: 'u1',
        programme_id: 'p1',
        week_start: weekStart,
        schedule: [
          { dayOfWeek: 0, status: 'scheduled', weekStart },
          { dayOfWeek: 1, status: 'completed', weekStart },
          { dayOfWeek: 2, status: 'rest', weekStart },
          { dayOfWeek: 3, status: 'scheduled', weekStart },
          { dayOfWeek: 4, status: 'scheduled', weekStart },
          { dayOfWeek: 5, status: 'rest', weekStart },
          { dayOfWeek: 6, status: 'rest', weekStart },
        ],
        created_at: `${weekStart}T00:00:00Z`,
        updated_at: `${weekStart}T00:00:00Z`,
      },
    ];

    const result = aggregateAnalyticsData(analytics, workouts, schedules, 3);

    expect(result.sessionsCompleted).toHaveLength(6);
    // Current month (last element) should have volume from the analytics data
    expect(result.totalVolume[result.totalVolume.length - 1]!.value).toBeGreaterThan(0);
    expect(result.restDays.average).toBeGreaterThanOrEqual(0);
    expect(result.streak).toBeGreaterThanOrEqual(0);
  });
});
