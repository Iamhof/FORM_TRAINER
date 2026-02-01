import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '@/lib/logger';

export const getVolumeProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'total']),
    })
  )
  .query(async ({ input }) => {
    const { data, error } = await supabaseAdmin.rpc('get_volume', {
      p_period: input.period,
    });

    if (error) {
      logger.error('[getVolume] RPC error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch volume data',
      });
    }

    if (!data) {
      return {
        totalVolumeKg: 0,
        workoutCount: 0,
        previousPeriodVolumeKg: 0,
        percentageChange: 0,
      };
    }

    return {
      totalVolumeKg: Number(data.totalVolumeKg ?? 0),
      workoutCount: Number(data.workoutCount ?? 0),
      previousPeriodVolumeKg: Number(data.previousPeriodVolumeKg ?? 0),
      percentageChange: Number(data.percentageChange ?? 0),
    };
  });
