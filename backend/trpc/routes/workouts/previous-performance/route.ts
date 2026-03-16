import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { narrowError } from '../../../../../lib/error-utils.js';
import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export const previousPerformanceProcedure = protectedProcedure
  .input(
    z.object({
      exerciseIds: z.array(z.string()).min(1).max(50),
      programmeId: z.string(),
      day: z.number().int().min(1).max(7),
    })
  )
  .query(async ({ ctx, input }) => {
    logger.info('[Workout] Previous performance request', {
      userId: ctx.userId,
      programmeId: input.programmeId,
      day: input.day,
      exerciseCount: input.exerciseIds.length,
    });

    try {
      const [workoutResult, prResult] = await Promise.all([
        supabaseAdmin
          .from('workouts')
          .select('*')
          .eq('user_id', ctx.userId)
          .eq('programme_id', input.programmeId)
          .eq('day', input.day)
          .order('completed_at', { ascending: false })
          .limit(1),
        supabaseAdmin
          .from('personal_records')
          .select('*')
          .eq('user_id', ctx.userId)
          .in('exercise_id', input.exerciseIds),
      ]);

      if (workoutResult.error) {
        logger.error('[Workout] Database error fetching previous workout', {
          userId: ctx.userId,
          error: workoutResult.error.message,
          code: workoutResult.error.code,
          details: workoutResult.error.details,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database error: ${workoutResult.error.message}`,
        });
      }

      if (prResult.error) {
        logger.error('[Workout] Database error fetching personal records', {
          userId: ctx.userId,
          error: prResult.error.message,
          code: prResult.error.code,
          details: prResult.error.details,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database error: ${prResult.error.message}`,
        });
      }

      const exerciseIdSet = new Set(input.exerciseIds);

      let lastWorkout: {
        completedAt: string;
        exercises: Record<string, { sets: WorkoutSet[] }>;
      } | null = null;

      const workout = workoutResult.data?.[0];
      if (workout) {
        const exercises = (workout.exercises as unknown as WorkoutExercise[]) ?? [];
        const exerciseMap: Record<string, { sets: WorkoutSet[] }> = {};

        for (const exercise of exercises) {
          if (exerciseIdSet.has(exercise.exerciseId)) {
            exerciseMap[exercise.exerciseId] = { sets: exercise.sets };
          }
        }

        lastWorkout = {
          completedAt: workout.completed_at as string,
          exercises: exerciseMap,
        };
      }

      const personalRecords: Record<string, { weight: number; reps: number; date: string }> = {};
      for (const pr of prResult.data ?? []) {
        personalRecords[pr.exercise_id as string] = {
          weight: pr.weight as number,
          reps: pr.reps as number,
          date: pr.date as string,
        };
      }

      logger.info('[Workout] Previous performance fetched', {
        userId: ctx.userId,
        hasLastWorkout: lastWorkout !== null,
        prCount: Object.keys(personalRecords).length,
      });

      return {
        lastWorkout,
        personalRecords,
      };
    } catch (err: unknown) {
      if (err instanceof TRPCError) {
        throw err;
      }

      const typedError = narrowError(err);
      logger.error('[Workout] Unexpected error fetching previous performance', {
        userId: ctx.userId,
        message: typedError.message,
        code: typedError.code,
        details: typedError.details,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Unexpected error: ${typedError.message}`,
      });
    }
  });
