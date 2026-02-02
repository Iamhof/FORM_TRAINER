import { z } from 'zod';
import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { logger } from '../../../../../lib/logger.js';

const workoutSetSchema = z.object({
  weight: z.number(),
  reps: z.number(),
  completed: z.boolean(),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(workoutSetSchema),
});

export const logWorkoutProcedure = protectedProcedure
  .input(
    z.object({
      programmeId: z.string(),
      programmeName: z.string(),
      day: z.number(),
      week: z.number(),
      exercises: z.array(workoutExerciseSchema),
      completedAt: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { programmeId, programmeName, day, week, exercises, completedAt } = input;

    logger.info('[Workout] Log request received', {
      userId: ctx.userId,
      programmeId,
      programmeName,
      day,
      week,
      exerciseCount: exercises.length,
    });

    try {
      // Pass user ID explicitly to RPC to avoid relying on session context
      const { data, error } = await supabaseAdmin.rpc('log_workout_transaction', {
        p_user_id: ctx.userId,
        p_programme_id: programmeId,
        p_programme_name: programmeName,
        p_day: day,
        p_week: week,
        p_exercises: exercises,
        p_completed_at: completedAt,
      });

      if (error) {
        logger.error('[Workout] RPC error logging workout', {
          userId: ctx.userId,
          programmeId,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `RPC error: ${error.message}`,
        });
      }

      if (!data) {
        logger.error('[Workout] RPC returned no data', {
          userId: ctx.userId,
          programmeId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Workout RPC returned no data',
        });
      }

      logger.info('[Workout] Logged successfully', {
        userId: ctx.userId,
        programmeId,
        workoutId: data.workout_id,
      });

      return data;
    } catch (err) {
      if (err instanceof TRPCError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[Workout] Unexpected error', {
        userId: ctx.userId,
        programmeId,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Unexpected error: ${errorMessage}`,
      });
    }
  });
