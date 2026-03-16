import { useState } from 'react';

import { MUSCLE_REGIONS } from '@/constants/heatmap/types';
import { trpc } from '@/lib/trpc';

import type { HeatmapPeriod, MuscleRegion, MuscleVolumeData } from '@/constants/heatmap/types';

const EMPTY_DATA: Record<MuscleRegion, MuscleVolumeData> = Object.fromEntries(
  MUSCLE_REGIONS.map((r) => [r, { volume: 0, sets: 0, intensity: 0 }]),
) as Record<MuscleRegion, MuscleVolumeData>;

export function useHeatmapData() {
  const [period, setPeriod] = useState<HeatmapPeriod>('month');

  const { data, isLoading } = trpc.analytics.muscleVolume.useQuery(
    { period },
    { staleTime: 5 * 60 * 1000 },
  );

  const muscleData: Record<MuscleRegion, MuscleVolumeData> = data ?? EMPTY_DATA;

  return { muscleData, period, setPeriod, isLoading };
}
