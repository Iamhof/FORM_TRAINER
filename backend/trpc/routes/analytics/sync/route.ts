import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

export const syncAnalyticsProcedure = protectedProcedure
  .input(
    z.array(
      z.object({
        exerciseId: z.string(),
        date: z.string(),
        maxWeight: z.number(),
        totalVolume: z.number(),
        totalReps: z.number(),
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const analyticsData = input.map((item) => ({
      user_id: ctx.userId,
      exercise_id: item.exerciseId,
      date: item.date,
      max_weight: item.maxWeight,
      total_volume: item.totalVolume,
      total_reps: item.totalReps,
    }));

    const { error } = await supabaseAdmin.from('analytics').upsert(analyticsData, {
      onConflict: 'user_id,exercise_id,date',
    });

    if (error) {
      logger.error('Error syncing analytics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync analytics',
      });
    }

    return { success: true };
  });
