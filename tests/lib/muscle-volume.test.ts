import { describe, expect, it } from 'vitest';

import { averageCategoryWeights } from '@/backend/trpc/routes/analytics/muscle-volume/route';
import { CATEGORY_TO_REGIONS, MUSCLE_GROUP_FALLBACK } from '@/constants/heatmap/category-weights';
import { MUSCLE_REGIONS } from '@/constants/heatmap/types';

import type { ExerciseCategory } from '@/types/exercises';

describe('CATEGORY_TO_REGIONS weights', () => {
  it('each category sums to approximately 1.0', () => {
    for (const [, weights] of Object.entries(CATEGORY_TO_REGIONS)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('all region keys are valid MuscleRegion values', () => {
    const regionSet = new Set<string>(MUSCLE_REGIONS);
    for (const weights of Object.values(CATEGORY_TO_REGIONS)) {
      for (const region of Object.keys(weights)) {
        expect(regionSet.has(region)).toBe(true);
      }
    }
  });
});

describe('MUSCLE_GROUP_FALLBACK', () => {
  it('all region keys are valid MuscleRegion values', () => {
    const regionSet = new Set<string>(MUSCLE_REGIONS);
    for (const weights of Object.values(MUSCLE_GROUP_FALLBACK)) {
      for (const region of Object.keys(weights)) {
        expect(regionSet.has(region)).toBe(true);
      }
    }
  });
});

describe('averageCategoryWeights', () => {
  it('returns empty for empty categories', () => {
    expect(averageCategoryWeights([])).toEqual({});
  });

  it('returns the category weights directly for a single category', () => {
    const result = averageCategoryWeights(['Chest']);
    expect(result).toEqual({ chest: 1.0 });
  });

  it('averages weights across two categories (Bench Press example)', () => {
    const result = averageCategoryWeights(['Push', 'Chest']);
    // Push: { chest: 0.35, shoulders_front: 0.25, triceps: 0.25, abs: 0.15 }
    // Chest: { chest: 1.0 }
    // Average: chest = (0.35 + 1.0) / 2 = 0.675
    expect(result.chest).toBeCloseTo(0.675, 3);
    expect(result.shoulders_front).toBeCloseTo(0.125, 3);
    expect(result.triceps).toBeCloseTo(0.125, 3);
    expect(result.abs).toBeCloseTo(0.075, 3);
  });

  it('averages weights across three categories', () => {
    const cats: ExerciseCategory[] = ['Legs', 'Quads', 'Glutes'];
    const result = averageCategoryWeights(cats);
    // Legs: { quads: 0.35, glutes: 0.3, hamstrings: 0.25, calves_front: 0.05, calves_rear: 0.05 }
    // Quads: { quads: 1.0 }
    // Glutes: { glutes: 1.0 }
    // Average quads: (0.35 + 1.0 + 0) / 3 = 0.45
    expect(result.quads).toBeCloseTo(0.45, 2);
    // Average glutes: (0.3 + 0 + 1.0) / 3 ≈ 0.4333
    expect(result.glutes).toBeCloseTo(0.4333, 2);
  });

  it('handles Pull + Back + Legs (Deadlift-like multi-category)', () => {
    const cats: ExerciseCategory[] = ['Pull', 'Back', 'Legs', 'Hamstrings', 'Glutes'];
    const result = averageCategoryWeights(cats);
    // All regions should be present and non-negative
    for (const val of Object.values(result)) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
    // Upper back should get contribution from Pull + Back
    expect(result.upper_back).toBeGreaterThan(0);
    // Hamstrings from Legs + Hamstrings
    expect(result.hamstrings).toBeGreaterThan(0);
    // Glutes from Legs + Glutes
    expect(result.glutes).toBeGreaterThan(0);
  });
});

describe('normalization edge cases', () => {
  it('zero volume produces zero intensity for all regions', () => {
    const regionVolume: Record<string, number> = {};
    for (const r of MUSCLE_REGIONS) regionVolume[r] = 0;
    const maxVolume = Math.max(...Object.values(regionVolume), 0);
    expect(maxVolume).toBe(0);

    for (const r of MUSCLE_REGIONS) {
      const intensity = maxVolume > 0 ? (regionVolume[r] ?? 0) / maxVolume : 0;
      expect(intensity).toBe(0);
    }
  });

  it('single nonzero region produces intensity=1 for that region, 0 for others', () => {
    const regionVolume: Record<string, number> = {};
    for (const r of MUSCLE_REGIONS) regionVolume[r] = 0;
    regionVolume['chest'] = 5000;

    const maxVolume = Math.max(...Object.values(regionVolume), 0);
    expect(maxVolume).toBe(5000);

    expect((regionVolume['chest'] ?? 0) / maxVolume).toBe(1);
    expect((regionVolume['quads'] ?? 0) / maxVolume).toBe(0);
  });

  it('even distribution results in all regions having intensity=1', () => {
    const regionVolume: Record<string, number> = {};
    for (const r of MUSCLE_REGIONS) regionVolume[r] = 3000;

    const maxVolume = Math.max(...Object.values(regionVolume), 0);
    for (const r of MUSCLE_REGIONS) {
      expect((regionVolume[r] ?? 0) / maxVolume).toBe(1);
    }
  });
});
