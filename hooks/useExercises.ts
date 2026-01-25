import { trpc } from '@/lib/trpc';
import { EXERCISE_LIBRARY } from '@/constants/exercise-library';
import { Exercise } from '@/constants/exercises';
import { useMemo } from 'react';

// Convert library format to database format for fallback
const FALLBACK_EXERCISES: Exercise[] = EXERCISE_LIBRARY.map((ex) => ({
  id: ex.id,
  name: ex.name,
  category: ex.categories[0] || 'Push', // Use first category as primary
  muscle_group: ex.categories[1] || ex.categories[0] || 'Chest', // Use second category as muscle group
  type: ex.difficulty || 'Intermediate',
}));

export const useExercises = () => {
  const query = trpc.exercises.list.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1, // Only retry once since tunnel mode will consistently fail
  });

  // Use useMemo to return stable reference when using fallback
  const fallbackResult = useMemo(() => ({
    ...query,
    data: FALLBACK_EXERCISES,
    isError: false,
    error: null,
    isLoading: false,
  }), [query.isError, query.isLoading]); // Only recreate when error/loading state changes

  // Return fallback data immediately during loading or on error
  // This ensures exercises are always available from the local library,
  // eliminating the loading delay and preventing "Unknown Exercise" issues
  if (query.isLoading || query.isError) {
    return fallbackResult;
  }

  return query;
};

