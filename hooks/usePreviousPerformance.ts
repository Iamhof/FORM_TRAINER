import { useMemo } from 'react';

import { formatTimeAgo } from '@/lib/date-utils';
import { trpc } from '@/lib/trpc';
import { suggestWeight } from '@/lib/weight-suggestion';

export interface ExercisePreviousPerformance {
  lastSets: { weight: number; reps: number; completed: boolean }[] | null;
  completedAt: string | null;
  timeAgo: string;
  pr: { weight: number; reps: number; date: string } | null;
  suggestedWeights: (number | null)[];
}

interface UsePreviousPerformanceParams {
  exerciseIds: string[];
  programmeId: string;
  day: number;
  programmeCategory: string | null;
  exerciseTargetReps: Record<string, string>;
  isPremium: boolean;
  enabled: boolean;
}

const EMPTY_RECORD: Record<string, ExercisePreviousPerformance> = {};

export function usePreviousPerformance({
  exerciseIds,
  programmeId,
  day,
  programmeCategory,
  exerciseTargetReps,
  isPremium,
  enabled,
}: UsePreviousPerformanceParams) {
  const { data: rawData, isLoading } = trpc.workouts.previousPerformance.useQuery(
    { exerciseIds, programmeId, day },
    {
      enabled: isPremium && enabled && exerciseIds.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  );

  const data = useMemo<Record<string, ExercisePreviousPerformance>>(() => {
    if (!isPremium || !rawData) {
      return EMPTY_RECORD;
    }

    const { lastWorkout, personalRecords } = rawData;
    const result: Record<string, ExercisePreviousPerformance> = {};

    for (const exerciseId of exerciseIds) {
      const exerciseData = lastWorkout?.exercises[exerciseId];
      const lastSets = exerciseData?.sets ?? null;
      const completedAt = lastWorkout?.completedAt ?? null;
      const timeAgo = completedAt ? formatTimeAgo(completedAt) : '';
      const pr = personalRecords[exerciseId] ?? null;
      const targetReps = exerciseTargetReps[exerciseId] ?? '8-12';

      const suggestedWeights: (number | null)[] = [];
      const totalSets = lastSets?.length ?? 3;

      for (let i = 0; i < totalSets; i++) {
        const prevSetEntry = lastSets?.[i];
        const previousSet = prevSetEntry
          ? { weight: prevSetEntry.weight, reps: prevSetEntry.reps }
          : null;

        suggestedWeights.push(
          suggestWeight({
            previousSet,
            setIndex: i,
            totalSets,
            targetReps,
            programmeCategory,
            pr,
          }),
        );
      }

      result[exerciseId] = {
        lastSets,
        completedAt,
        timeAgo,
        pr,
        suggestedWeights,
      };
    }

    return result;
  }, [rawData, isPremium, exerciseIds, exerciseTargetReps, programmeCategory]);

  if (!isPremium) {
    return { data: EMPTY_RECORD, isLoading: false };
  }

  return { data, isLoading };
}
