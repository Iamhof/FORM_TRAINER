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

    const prChecks = exercises.map(async (exercise) => {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map((set) => set.weight));
      const totalVolume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

      await supabaseAdmin
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

      const bestSet = completedSets.reduce((best, current) => {
        const currentOneRepMax = current.reps === 1 ? current.weight : current.weight * (1 + current.reps / 30);
        const bestOneRepMax = best.reps === 1 ? best.weight : best.weight * (1 + best.reps / 30);
        return currentOneRepMax > bestOneRepMax ? current : best;
      }, completedSets[0]);

      const { data: existingPR, error: prFetchError } = await supabaseAdmin
        .from('personal_records')
        .select('*')
        .eq('user_id', ctx.userId)
        .eq('exercise_id', exercise.exerciseId)
        .single();

      if (prFetchError && prFetchError.code !== 'PGRST116') {
        console.error('[logWorkout] Error checking PR for exercise:', exercise.exerciseId, prFetchError);
        return;
      }

      const calculateOneRepMax = (weight: number, reps: number) => {
        if (reps === 1) return weight;
        return weight * (1 + reps / 30);
      };

      const newOneRepMax = calculateOneRepMax(bestSet.weight, bestSet.reps);
      const existingOneRepMax = existingPR
        ? calculateOneRepMax(existingPR.weight, existingPR.reps)
        : 0;

      if (!existingPR || newOneRepMax > existingOneRepMax) {
        await supabaseAdmin
          .from('personal_records')
          .upsert(
            {
              user_id: ctx.userId,
              exercise_id: exercise.exerciseId,
              weight: bestSet.weight,
              reps: bestSet.reps,
              date: completedAt.split('T')[0],
              workout_id: workout.id,
            },
            {
              onConflict: 'user_id,exercise_id',
            }
          )
          .then(({ error }) => {
            if (error) {
              console.error('[logWorkout] Error recording PR for exercise:', exercise.exerciseId, error);
            } else {
              console.log('[logWorkout] New PR recorded for exercise:', exercise.exerciseId, `${bestSet.weight}kg x ${bestSet.reps}`);
            }
          });
      }
    });

    await Promise.all(prChecks);

    return workout;
  });
