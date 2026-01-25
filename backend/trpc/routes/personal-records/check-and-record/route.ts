import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/backend/lib/auth';
import { logger } from '@/lib/logger';

export const checkAndRecordPRProcedure = protectedProcedure
  .input(
    z.object({
      exerciseId: z.string(),
      weight: z.number(),
      reps: z.number(),
      date: z.string(),
      workoutId: z.string().uuid().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: existingPR, error: fetchError } = await supabaseAdmin
      .from('personal_records')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('exercise_id', input.exerciseId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('[checkAndRecordPR] Error fetching existing PR:', fetchError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check personal record',
      });
    }

    const calculateOneRepMax = (weight: number, reps: number) => {
      if (reps === 1) return weight;
      return weight * (1 + reps / 30);
    };

    const newOneRepMax = calculateOneRepMax(input.weight, input.reps);
    const existingOneRepMax = existingPR
      ? calculateOneRepMax(existingPR.weight, existingPR.reps)
      : 0;

    const isNewPR = !existingPR || newOneRepMax > existingOneRepMax;

    if (isNewPR) {
      const { data: newPR, error: upsertError } = await supabaseAdmin
        .from('personal_records')
        .upsert(
          {
            user_id: ctx.userId,
            exercise_id: input.exerciseId,
            weight: input.weight,
            reps: input.reps,
            date: input.date,
            workout_id: input.workoutId || null,
          },
          {
            onConflict: 'user_id,exercise_id',
          }
        )
        .select()
        .single();

      if (upsertError) {
        logger.error('[checkAndRecordPR] Error recording PR:', upsertError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record personal record',
        });
      }

      logger.debug('[checkAndRecordPR] New PR recorded for exercise:', input.exerciseId);
      return {
        isNewPR: true,
        personalRecord: newPR,
        previousRecord: existingPR,
      };
    }

    logger.debug('[checkAndRecordPR] No new PR for exercise:', input.exerciseId);
    return {
      isNewPR: false,
      personalRecord: existingPR,
      previousRecord: null,
    };
  });
