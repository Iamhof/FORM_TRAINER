import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/backend/lib/auth';
import { logger } from '@/lib/logger';

export const logBodyMetricsProcedure = protectedProcedure
  .input(
    z.object({
      date: z.string(),
      weight: z.number().optional(),
      muscleMass: z.number().optional(),
      bodyFatPercentage: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: bodyMetric, error } = await supabaseAdmin
      .from('body_metrics')
      .upsert(
        {
          user_id: ctx.userId,
          date: input.date,
          weight: input.weight,
          muscle_mass: input.muscleMass,
          body_fat_percentage: input.bodyFatPercentage,
          notes: input.notes,
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('[logBodyMetrics] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to log body metrics',
      });
    }

    logger.debug('[logBodyMetrics] Successfully logged body metrics for user:', ctx.userId);
    return bodyMetric;
  });
