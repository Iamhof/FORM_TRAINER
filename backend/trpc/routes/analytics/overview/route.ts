import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { aggregateAnalyticsData, generateEmptyMonthlyData } from '../utils.js';
import { AnalyticsData as DBAnalyticsData, Schedule, ScheduleDay } from '@/types/database';
import { logger } from '@/lib/logger';

const normaliseSchedule = (payload: unknown): Schedule['schedule'] => {
  if (Array.isArray(payload)) {
    return payload as Schedule['schedule'];
  }

  if (payload !== null && payload !== undefined && payload.constructor === String) {
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        return parsed as Schedule['schedule'];
      }
    } catch {
      return [];
    }
  }

  if (payload && payload !== null && payload.constructor === Object) {
    const candidate = payload as { length?: number };
    if (candidate.length !== undefined && Number.isFinite(candidate.length) && candidate.length >= 0) {
      return Array.from(candidate as ArrayLike<ScheduleDay>) as Schedule['schedule'];
    }
  }

  return [];
};

export const getAnalyticsOverviewProcedure = protectedProcedure
  .input(
    z.object({
      months: z.number().int().min(1).max(12).optional(),
      programmeDays: z.number().int().min(0).max(7).optional(),
    })
  )
  .query(async ({ input }) => {
    const months = input.months ?? 6;
    const programmeDays = input.programmeDays ?? 3;

    const { data, error } = await supabaseAdmin.rpc('get_strength_trend', {
      p_months: months,
    });

    if (error) {
      logger.error('[analytics.getOverview] RPC error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load analytics overview',
      });
    }

    if (!data) {
      return {
        analytics: {
          sessionsCompleted: generateEmptyMonthlyData(),
          sessionsMissed: generateEmptyMonthlyData(),
          strengthProgressionRate: generateEmptyMonthlyData(),
          totalVolume: generateEmptyMonthlyData(),
          exerciseProgress: [],
          restDays: {
            thisMonth: 0,
            lastMonth: 0,
            average: 0,
          },
          streak: 0,
        },
      };
    }

    const rawAnalytics = (data.analytics ?? []) as DBAnalyticsData[];
    const rawWorkouts = (data.workouts ?? []) as Array<{
      completed_at: string;
      programme_id: string | null;
    }>;
    const rawSchedules = (data.schedules ?? []) as Array<{
      id: string;
      programmeId: string | null;
      weekStart: string;
      schedule: unknown;
    }>;

    const schedules: Schedule[] = rawSchedules.map((item) => ({
      id: item.id,
      user_id: '',
      programme_id: item.programmeId,
      week_start: item.weekStart,
      schedule: normaliseSchedule(item.schedule),
      created_at: '',
      updated_at: '',
    }));

    const analytics = aggregateAnalyticsData(
      rawAnalytics,
      rawWorkouts,
      schedules,
      programmeDays
    );

    return { analytics };
  });
