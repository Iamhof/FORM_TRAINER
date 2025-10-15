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

    console.log('[logWorkout] Logging workout:', {
      userId: ctx.userId,
      programmeId,
      programmeName,
      day,
      week,
      exerciseCount: exercises.length,
    });

    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: ctx.userId,
        programme_id: programmeId,
        programme_name: programmeName,
        day,
        week,
        exercises,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (error || !workout) {
      console.error('[logWorkout] Error logging workout:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to log workout',
      });
    }

    console.log('[logWorkout] Workout logged successfully:', workout.id);

    exercises.forEach((exercise) => {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map((set) => set.weight));
      const totalVolume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

      supabaseAdmin
        .from('analytics')
        .insert({
          user_id: ctx.userId,
          exercise_id: exercise.exerciseId,
          date: completedAt.split('T')[0],
          max_weight: maxWeight,
          total_volume: totalVolume,
          total_reps: totalReps,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[logWorkout] Error updating analytics for exercise:', exercise.exerciseId, error);
          } else {
            console.log('[logWorkout] Analytics updated for exercise:', exercise.exerciseId);
          }
        });
    });

    return workout;
  });
