import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { EXERCISE_LIBRARY } from '../../../../../constants/exercise-library.js';
import { CATEGORY_TO_REGIONS, MUSCLE_GROUP_FALLBACK } from '../../../../../constants/heatmap/category-weights.js';
import { MUSCLE_REGIONS } from '../../../../../constants/heatmap/types.js';
import { logger } from '../../../../../lib/logger.js';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { protectedProcedure } from '../../../create-context.js';

import type { MuscleRegion } from '../../../../../constants/heatmap/types.js';
import type { ExerciseCategory } from '../../../../../types/exercises.js';

const periodToDateFilter = (period: string): string | null => {
  const now = new Date();
  switch (period) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0] ?? null;
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0] ?? null;
    }
    case 'three_months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d.toISOString().split('T')[0] ?? null;
    }
    case 'all':
      return null;
    default:
      return null;
  }
};

/**
 * Average the region weight maps across multiple categories.
 * e.g. ['Push', 'Chest'] → averaged region weights
 */
export const averageCategoryWeights = (
  categories: ExerciseCategory[]
): Partial<Record<MuscleRegion, number>> => {
  if (categories.length === 0) return {};

  const summed: Partial<Record<MuscleRegion, number>> = {};
  for (const cat of categories) {
    const weights = CATEGORY_TO_REGIONS[cat];
    if (!weights) continue;
    for (const [region, weight] of Object.entries(weights)) {
      const r = region as MuscleRegion;
      summed[r] = (summed[r] ?? 0) + weight;
    }
  }

  const result: Partial<Record<MuscleRegion, number>> = {};
  for (const [region, total] of Object.entries(summed)) {
    result[region as MuscleRegion] = total / categories.length;
  }
  return result;
};

/**
 * Build a lookup: exercise_id → region weights.
 * Uses EXERCISE_LIBRARY first, falls back to DB muscle_group.
 */
const buildExerciseLookup = (
  dbExercises: { id: string; muscle_group: string }[]
): Map<string, Partial<Record<MuscleRegion, number>>> => {
  const lookup = new Map<string, Partial<Record<MuscleRegion, number>>>();

  // Index library exercises by id
  for (const ex of EXERCISE_LIBRARY) {
    lookup.set(ex.id, averageCategoryWeights(ex.categories));
  }

  // Add DB exercises not in library (custom exercises)
  for (const dbEx of dbExercises) {
    if (!lookup.has(dbEx.id)) {
      const fallback = MUSCLE_GROUP_FALLBACK[dbEx.muscle_group];
      if (fallback) {
        lookup.set(dbEx.id, fallback);
      }
    }
  }

  return lookup;
};

export const muscleVolumeProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['week', 'month', 'three_months', 'all']),
    })
  )
  .query(async ({ ctx, input }) => {
    const dateFilter = periodToDateFilter(input.period);

    // Query analytics grouped by exercise_id
    let query = supabaseAdmin
      .from('analytics')
      .select('exercise_id, total_volume, total_reps')
      .eq('user_id', ctx.userId);

    if (dateFilter) {
      query = query.gte('date', dateFilter);
    }

    const { data: analyticsRows, error: analyticsError } = await query;

    if (analyticsError) {
      logger.error('[muscleVolume] Analytics query error:', analyticsError);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch analytics data',
      });
    }

    if (!analyticsRows || analyticsRows.length === 0) {
      const empty: Record<string, { volume: number; sets: number; intensity: number }> = {};
      for (const region of MUSCLE_REGIONS) {
        empty[region] = { volume: 0, sets: 0, intensity: 0 };
      }
      return empty as Record<MuscleRegion, { volume: number; sets: number; intensity: number }>;
    }

    // Collect unique exercise IDs for DB fallback lookup
    const exerciseIds = [...new Set(analyticsRows.map((r) => r.exercise_id))];

    // Fetch DB exercises for fallback muscle_group mapping
    const { data: dbExercises } = await supabaseAdmin
      .from('exercises')
      .select('id, muscle_group')
      .in('id', exerciseIds);

    const exerciseLookup = buildExerciseLookup(dbExercises ?? []);

    // Aggregate volume and sets per exercise
    const exerciseAgg = new Map<string, { volume: number; sets: number }>();
    for (const row of analyticsRows) {
      const existing = exerciseAgg.get(row.exercise_id);
      if (existing) {
        existing.volume += Number(row.total_volume);
        existing.sets += Number(row.total_reps);
      } else {
        exerciseAgg.set(row.exercise_id, {
          volume: Number(row.total_volume),
          sets: Number(row.total_reps),
        });
      }
    }

    // Distribute volume to regions
    const regionVolume: Record<string, number> = {};
    const regionSets: Record<string, number> = {};
    for (const region of MUSCLE_REGIONS) {
      regionVolume[region] = 0;
      regionSets[region] = 0;
    }

    for (const [exerciseId, agg] of exerciseAgg) {
      const weights = exerciseLookup.get(exerciseId);
      if (!weights) continue;

      for (const [region, weight] of Object.entries(weights)) {
        regionVolume[region] = (regionVolume[region] ?? 0) + agg.volume * weight;
        regionSets[region] = (regionSets[region] ?? 0) + Math.round(agg.sets * weight);
      }
    }

    // Normalize intensity: max region = 1.0
    const maxVolume = Math.max(...Object.values(regionVolume), 0);

    const result: Record<string, { volume: number; sets: number; intensity: number }> = {};
    for (const region of MUSCLE_REGIONS) {
      result[region] = {
        volume: Math.round(regionVolume[region] ?? 0),
        sets: regionSets[region] ?? 0,
        intensity: maxVolume > 0
          ? Math.round(((regionVolume[region] ?? 0) / maxVolume) * 100) / 100
          : 0,
      };
    }

    return result as Record<MuscleRegion, { volume: number; sets: number; intensity: number }>;
  });
