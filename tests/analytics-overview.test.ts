import { describe, expect, test } from 'vitest';
import { aggregateAnalyticsData } from '@/backend/trpc/routes/analytics/utils';
import { AnalyticsData as DBAnalyticsData, Schedule } from '@/types/database';

describe('aggregateAnalyticsData', () => {
  test('computes monthly metrics and streak from raw data', () => {
    const analytics: DBAnalyticsData[] = [
      {
        id: 'a1',
        user_id: 'u1',
        exercise_id: 'squat',
        date: '2025-10-01',
        max_weight: 120,
        total_volume: 12000,
        total_reps: 30,
        created_at: '2025-10-01T00:00:00Z',
      } as DBAnalyticsData,
      {
        id: 'a2',
        user_id: 'u1',
        exercise_id: 'squat',
        date: '2025-11-01',
        max_weight: 125,
        total_volume: 12500,
        total_reps: 28,
        created_at: '2025-11-01T00:00:00Z',
      } as DBAnalyticsData,
    ];

    const workouts = [
      { completed_at: '2025-11-01T08:00:00Z', programme_id: 'p1' },
      { completed_at: '2025-11-03T08:00:00Z', programme_id: 'p1' },
    ];

    const schedules: Schedule[] = [
      {
        id: 's1',
        user_id: 'u1',
        programme_id: 'p1',
        week_start: '2025-10-27',
        schedule: [
          { dayOfWeek: 0, status: 'scheduled', weekStart: '2025-10-27' },
          { dayOfWeek: 1, status: 'completed', weekStart: '2025-10-27' },
          { dayOfWeek: 2, status: 'rest', weekStart: '2025-10-27' },
          { dayOfWeek: 3, status: 'scheduled', weekStart: '2025-10-27' },
          { dayOfWeek: 4, status: 'scheduled', weekStart: '2025-10-27' },
          { dayOfWeek: 5, status: 'rest', weekStart: '2025-10-27' },
          { dayOfWeek: 6, status: 'rest', weekStart: '2025-10-27' },
        ],
        created_at: '2025-10-27T00:00:00Z',
        updated_at: '2025-10-27T00:00:00Z',
      },
    ];

    const result = aggregateAnalyticsData(analytics, workouts, schedules, 3);

    expect(result.sessionsCompleted).toHaveLength(6);
    expect(result.totalVolume[result.totalVolume.length - 1].value).toBeGreaterThan(0);
    expect(result.restDays.average).toBeGreaterThanOrEqual(0);
    expect(result.streak).toBeGreaterThanOrEqual(0);
  });
});
