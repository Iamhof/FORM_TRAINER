import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { getLocalDateString } from '@/lib/date-utils';

const getDateRange = (
  period: 'week' | 'month' | 'total',
  now: Date = new Date()
): { start: string; end: string } => {
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;

  switch (period) {
    case 'week': {
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'total': {
      startDate = new Date(0);
      break;
    }
  }

  return {
    start: getLocalDateString(startDate), // Use local date to prevent timezone issues
    end: getLocalDateString(endDate),
  };
};

const getPreviousPeriodRange = (
  period: 'week' | 'month' | 'total',
  now: Date = new Date()
): { start: string; end: string } | null => {
  if (period === 'total') return null;

  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'week': {
      endDate = new Date(now);
      const day = endDate.getDay();
      const diff = endDate.getDate() - day + (day === 0 ? -6 : 1) - 1;
      endDate.setDate(diff);
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    start: getLocalDateString(startDate), // Use local date to prevent timezone issues
    end: getLocalDateString(endDate),
  };
};

export const getVolumeProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'total']),
    })
  )
  .query(async ({ ctx, input }) => {
    const { period } = input;
    const now = new Date();

    console.log('[getVolume] Fetching volume for period:', period, 'user:', ctx.user.id);

    const currentRange = getDateRange(period, now);

    let query = supabaseAdmin
      .from('analytics')
      .select('total_volume, date')
      .eq('user_id', ctx.user.id);

    if (period !== 'total') {
      query = query
        .gte('date', currentRange.start)
        .lte('date', currentRange.end);
    }

    const { data: currentAnalytics, error: currentError } = await query;

    if (currentError) {
      console.error('[getVolume] Error fetching current period analytics:', currentError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch volume data',
      });
    }

    const totalVolume = currentAnalytics?.reduce(
      (sum: number, record: any) => sum + (record.total_volume || 0),
      0
    ) || 0;

    const uniqueDates = new Set(currentAnalytics?.map((record: any) => record.date) || []);
    const workoutCount = uniqueDates.size;

    console.log('[getVolume] Current period:', {
      totalVolume,
      workoutCount,
      range: currentRange,
    });

    let previousPeriodVolume = 0;
    const previousRange = getPreviousPeriodRange(period, now);

    if (previousRange) {
      const { data: previousAnalytics, error: previousError } = await supabaseAdmin
        .from('analytics')
        .select('total_volume')
        .eq('user_id', ctx.user.id)
        .gte('date', previousRange.start)
        .lte('date', previousRange.end);

      if (!previousError && previousAnalytics) {
        previousPeriodVolume = previousAnalytics.reduce(
          (sum: number, record: any) => sum + (record.total_volume || 0),
          0
        );
      }

      console.log('[getVolume] Previous period:', {
        previousPeriodVolume,
        range: previousRange,
      });
    }

    const totalKg = totalVolume / 1000;
    const previousKg = previousPeriodVolume / 1000;

    const percentageChange = previousKg > 0
      ? ((totalKg - previousKg) / previousKg) * 100
      : totalKg > 0 ? 100 : 0;

    console.log('[getVolume] Result:', {
      totalVolumeKg: totalKg,
      workoutCount,
      previousPeriodVolumeKg: previousKg,
      percentageChange: Math.round(percentageChange * 10) / 10,
    });

    return {
      totalVolumeKg: Math.round(totalKg * 10) / 10,
      workoutCount,
      previousPeriodVolumeKg: Math.round(previousKg * 10) / 10,
      percentageChange: Math.round(percentageChange * 10) / 10,
    };
  });
