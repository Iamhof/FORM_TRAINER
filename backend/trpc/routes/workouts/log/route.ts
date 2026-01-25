import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

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
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message ?? 'Failed to log workout',
      });
    }

    if (!data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Workout RPC returned no data',
      });
    }

    return data;
  });
