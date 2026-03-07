import { z } from 'zod';

/**
 * SQL Injection Protection: Type-safe column mappings for leaderboard queries
 *
 * This immutable mapping prevents SQL injection by ensuring only valid,
 * predefined column names are used in database queries.
 *
 * Replaces the previous switch statement approach with a const object that:
 * - Is immutable (as const)
 * - Type-checked at compile time (satisfies Record<>)
 * - Cannot be modified at runtime
 */

export const leaderboardTypeSchema = z.enum([
  'total_volume',
  'monthly_volume',
  'total_sessions',
  'monthly_sessions'
]);

export type LeaderboardType = z.infer<typeof leaderboardTypeSchema>;

export const LEADERBOARD_COLUMN_MAPPINGS = {
  total_volume: {
    orderColumn: 'total_volume_kg',
    privacyColumn: 'show_in_total_volume',
  },
  monthly_volume: {
    orderColumn: 'monthly_volume_kg',
    privacyColumn: 'show_in_monthly_volume',
  },
  total_sessions: {
    orderColumn: 'total_sessions',
    privacyColumn: 'show_in_total_sessions',
  },
  monthly_sessions: {
    orderColumn: 'monthly_sessions',
    privacyColumn: 'show_in_monthly_sessions',
  },
} as const satisfies Record<LeaderboardType, { orderColumn: string; privacyColumn: string }>;
