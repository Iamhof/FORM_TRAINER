import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useMemo, useRef } from 'react';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

import { useUser } from './UserContext';

/**
 * Determines whether a tRPC error should trigger the Supabase direct fallback.
 * In production, errors are transformed by errorService.getUserMessage() into
 * user-friendly messages (e.g. "Connection error..."). We must match those
 * transformed messages as well as raw technical messages from development mode.
 */
const isFallbackableError = (message: string): boolean => {
  const patterns = [
    'HTML instead of JSON',
    'API route',
    'Network',
    'network',
    'Connection error',
    'timeout',
    'timed out',
    'Failed to fetch',
    'unexpected error',
  ];
  return patterns.some(p => message.includes(p));
};

export type ProgrammeExercise = {
  day: number;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
};

export type Programme = {
  id: string;
  user_id: string;
  name: string;
  days: number;
  weeks: number;
  category?: string | null;
  exercises: ProgrammeExercise[];
  created_at: string;
};

const [ProgrammeProviderRaw, useProgrammes] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const utils = trpc.useUtils();

  // Queries with Supabase fallback for tunnel mode
  const programmesQuery = trpc.programmes.list.useQuery(
    undefined,
    { 
      enabled: !!isAuthenticated && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1, // Only retry once since tunnel mode will consistently fail
    }
  );

  const workoutHistoryQuery = trpc.workouts.history.useQuery(
    {},
    { 
      enabled: !!isAuthenticated && !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes - aligned with global default
      retry: 1,
    }
  );

  // Supabase fallback state for when TRPC fails (tunnel mode)
  const [fallbackProgrammes, setFallbackProgrammes] = React.useState<Programme[]>([]);
  const [fallbackHistory, setFallbackHistory] = React.useState<any[]>([]);
  const [usingFallback, setUsingFallback] = React.useState(false);

  // Load data directly from Supabase when TRPC fails
  React.useEffect(() => {
    const loadFallbackData = async () => {
      if (!user || !isAuthenticated) return;
      
      // Check if TRPC queries failed with HTML error (tunnel mode)
      const programmesError = programmesQuery.error?.message || '';
      const historyError = workoutHistoryQuery.error?.message || '';
      
      if (isFallbackableError(programmesError) || isFallbackableError(historyError)) {
        logger.warn('[ProgrammeContext] TRPC queries failed, loading from Supabase directly');
        setUsingFallback(true);
        
        try {
          // Load programmes directly from Supabase
          const { data: progs } = await supabase
            .from('programmes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (progs) {
            setFallbackProgrammes(progs as Programme[]);
          }

          // Load workout history directly from Supabase
          const { data: history } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });
          
          if (history) {
            setFallbackHistory(history);
          }
        } catch (err) {
          logger.error('[ProgrammeContext] Supabase fallback query failed:', err);
        }
      }
    };

    loadFallbackData();
  }, [user, isAuthenticated, programmesQuery.error, workoutHistoryQuery.error]);

  // Use fallback data when TRPC fails — wrapped in useMemo for stable references
  const programmes = useMemo(
    () => usingFallback ? fallbackProgrammes : (programmesQuery.data || []),
    [usingFallback, fallbackProgrammes, programmesQuery.data]
  );
  const workoutHistory = useMemo(
    () => usingFallback ? fallbackHistory : (workoutHistoryQuery.data || []),
    [usingFallback, fallbackHistory, workoutHistoryQuery.data]
  );
  const isLoadingProgrammes = programmesQuery.isLoading;
  const isLoadingHistory = workoutHistoryQuery.isLoading;

  // Mutations
  const createProgrammeMutation = trpc.programmes.create.useMutation({
    onMutate: async (newProgramme) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await utils.programmes.list.cancel();

      // Snapshot for rollback
      const previousProgrammes = utils.programmes.list.getData();

      // Optimistically add to cache with a temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      utils.programmes.list.setData(undefined, (old) => {
        const optimistic: Programme = {
          id: tempId,
          user_id: user?.id ?? '',
          name: newProgramme.name,
          days: newProgramme.days,
          weeks: newProgramme.weeks,
          category: newProgramme.category ?? null,
          exercises: newProgramme.exercises,
          created_at: new Date().toISOString(),
        };
        return [optimistic, ...(old ?? [])];
      });

      return { previousProgrammes };
    },
    onError: (_error, _newProgramme, context) => {
      // Rollback on failure
      if (context?.previousProgrammes !== undefined) {
        utils.programmes.list.setData(undefined, context.previousProgrammes);
      }
    },
    onSettled: () => {
      // Always refetch to replace temp ID with real server data
      utils.programmes.list.invalidate();
    },
  });

  const deleteProgrammeMutation = trpc.programmes.delete.useMutation({
    onSuccess: () => {
      utils.programmes.list.invalidate();
      utils.workouts.history.invalidate();
    },
  });

  // Store mutations and utils in refs to avoid unstable dependencies
  const createMutationRef = useRef(createProgrammeMutation);
  createMutationRef.current = createProgrammeMutation;

  const deleteMutationRef = useRef(deleteProgrammeMutation);
  deleteMutationRef.current = deleteProgrammeMutation;

  const utilsRef = useRef(utils);
  utilsRef.current = utils;

  // Derived State
  const { completedSessions, completedSessionKeys } = useMemo(() => {
    const sessionsMap = new Map<string, number>();
    const sessionKeysSet = new Set<string>();

    workoutHistory.forEach((workout: any) => {
      if (!workout.programme_id) return;
      
      const count = sessionsMap.get(workout.programme_id) || 0;
      sessionsMap.set(workout.programme_id, count + 1);

      // Assuming workout has day and week. The history route returns select('*') from workouts.
      if (workout.day !== undefined && workout.week !== undefined) {
        const sessionKey = `${workout.programme_id}:${workout.day}:${workout.week}`;
        sessionKeysSet.add(sessionKey);
      }
    });

    return { completedSessions: sessionsMap, completedSessionKeys: sessionKeysSet };
  }, [workoutHistory]);

  const addProgramme = useCallback(
    async (programme: { name: string; days: number; weeks: number; category?: string; exercises: ProgrammeExercise[] }) => {
      if (!user) throw new Error('Not authenticated');
      try {
        const result = await createMutationRef.current.mutateAsync({
            name: programme.name,
            days: programme.days,
            weeks: programme.weeks,
            category: programme.category,
            exercises: programme.exercises,
        });
        return result;
      } catch (error) {
        // Check if this is a tunnel/API route error (HTML response)
        const errorMessage = error instanceof Error ? error.message : '';
        if (isFallbackableError(errorMessage)) {
          logger.warn('[ProgrammeContext] TRPC create failed, falling back to direct Supabase. Error:', errorMessage);
          
          // Fallback: Create programme directly via Supabase
          const { data: newProgramme, error: supabaseError } = await supabase
            .from('programmes')
            .insert({
              user_id: user.id,
              name: programme.name,
              days: programme.days,
              weeks: programme.weeks,
              category: programme.category || null,
              exercises: programme.exercises,
            })
            .select()
            .single();

          if (supabaseError || !newProgramme) {
            logger.error('[ProgrammeContext] Supabase fallback also failed:', supabaseError);
            throw new Error(supabaseError?.message || 'Failed to create programme');
          }

          // Update fallback state with new programme
          if (usingFallback) {
            setFallbackProgrammes(prev => [newProgramme as Programme, ...prev]);
          } else {
            // Invalidate cache to refetch programmes list
            utilsRef.current.programmes.list.invalidate();
          }
          logger.debug('[ProgrammeContext] Programme created via Supabase fallback:', newProgramme.id);
          return newProgramme;
        }
        
        logger.error('[ProgrammeContext] Failed to create programme:', error);
        throw error;
      }
    },
    [user, usingFallback] // Only stable values - refs are stable
  );

  const deleteProgramme = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      try {
        await deleteMutationRef.current.mutateAsync({ id });
      } catch (error) {
        // Check if this is a tunnel/API route error
        const errorMessage = error instanceof Error ? error.message : '';
        if (isFallbackableError(errorMessage)) {
          logger.warn('[ProgrammeContext] TRPC delete failed, falling back to direct Supabase. Error:', errorMessage);
          
          const { error: supabaseError } = await supabase
            .from('programmes')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (supabaseError) {
            logger.error('[ProgrammeContext] Supabase delete fallback failed:', supabaseError);
            throw new Error(supabaseError.message || 'Failed to delete programme');
          }

          // Update fallback state
          if (usingFallback) {
            setFallbackProgrammes(prev => prev.filter(p => p.id !== id));
          } else {
            utilsRef.current.programmes.list.invalidate();
          }
          logger.debug('[ProgrammeContext] Programme deleted via Supabase fallback');
          return;
        }
        
        logger.error('[ProgrammeContext] Failed to delete programme:', error);
        throw error;
      }
    },
    [user, usingFallback] // Only stable values - refs are stable
  );

  const getProgramme = useCallback(
    (id: string) => {
      // Cast to Programme type since the data from tRPC (Supabase) should match
      return (programmes as Programme[]).find((p) => p.id === id) || null;
    },
    [programmes]
  );

  // Memoize activeProgramme based on stable values instead of array reference
  // This prevents unnecessary re-renders when programmes array reference changes
  // but actual programme data remains the same
  const firstProgrammeData = programmes.length > 0 ? programmes[0] : null;
  
  const activeProgramme = useMemo(() => {
    return firstProgrammeData as Programme | null;
  }, [firstProgrammeData]);

  const getProgrammeProgress = useCallback((programmeId: string) => {
    const programme = (programmes as Programme[]).find(p => p.id === programmeId);
    if (!programme) return { completed: 0, total: 0, percentage: 0 };

    const totalSessions = programme.days * programme.weeks;
    const completedCount = completedSessions.get(programmeId) || 0;
    const percentage = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

    return {
      completed: completedCount,
      total: totalSessions,
      percentage,
    };
  }, [programmes, completedSessions]);

  const isSessionCompleted = useCallback((programmeId: string, day: number, week: number) => {
    const sessionKey = `${programmeId}:${day}:${week}`;
    return completedSessionKeys.has(sessionKey);
  }, [completedSessionKeys]);

  const isProgrammeCompleted = useCallback((programmeId: string) => {
    const progress = getProgrammeProgress(programmeId);
    return progress.percentage === 100;
  }, [getProgrammeProgress]);

  const isWeekUnlocked = useCallback((programmeId: string, weekNumber: number) => {
    if (weekNumber === 1) return true;

    const programme = (programmes as Programme[]).find(p => p.id === programmeId);
    if (!programme) return false;

    for (let day = 1; day <= programme.days; day++) {
      if (!isSessionCompleted(programmeId, day, weekNumber - 1)) {
        return false;
      }
    }
    return true;
  }, [programmes, isSessionCompleted]);

  const getNextSession = useCallback((programmeId: string) => {
    const programme = (programmes as Programme[]).find(p => p.id === programmeId);
    if (!programme) return null;

    for (let week = 1; week <= programme.weeks; week++) {
      if (!isWeekUnlocked(programmeId, week)) break;

      for (let day = 1; day <= programme.days; day++) {
        if (!isSessionCompleted(programmeId, day, week)) {
          return {
            week,
            day,
            sessionId: `${programmeId}:${day}:${week}`,
          };
        }
      }
    }
    return null;
  }, [programmes, isWeekUnlocked, isSessionCompleted]);

  const getCurrentWeekAndDay = useCallback((programmeId: string) => {
    const programme = (programmes as Programme[]).find(p => p.id === programmeId);
    if (!programme) return { currentWeek: 1, currentDay: 1, totalWeeks: 0 };

    const nextSession = getNextSession(programmeId);
    if (!nextSession) {
      return {
        currentWeek: programme.weeks,
        currentDay: programme.days,
        totalWeeks: programme.weeks,
      };
    }

    return {
      currentWeek: nextSession.week,
      currentDay: nextSession.day,
      totalWeeks: programme.weeks,
    };
  }, [programmes, getNextSession]);

  // Create stable refetch function using ref
  const refetch = useCallback(async () => {
    await Promise.all([
      utilsRef.current.programmes.list.invalidate(),
      utilsRef.current.workouts.history.invalidate()
    ]);
  }, []); // No dependencies - ref is stable

  return useMemo(
    () => ({
      programmes: programmes as Programme[],
      isLoading: isLoadingProgrammes || isLoadingHistory,
      addProgramme,
      deleteProgramme,
      getProgramme,
      activeProgramme,
      completedSessions,
      completedSessionKeys,
      getProgrammeProgress,
      isSessionCompleted,
      isProgrammeCompleted,
      isWeekUnlocked,
      getNextSession,
      getCurrentWeekAndDay,
      refetch,
    }),
    [
      programmes,
      isLoadingProgrammes,
      isLoadingHistory,
      addProgramme,
      deleteProgramme,
      getProgramme,
      activeProgramme,
      completedSessions,
      completedSessionKeys,
      getProgrammeProgress,
      isSessionCompleted,
      isProgrammeCompleted,
      isWeekUnlocked,
      getNextSession,
      getCurrentWeekAndDay,
      refetch,
    ]
  );
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext updates but user/isAuthenticated haven't changed
export const ProgrammeProvider = React.memo(ProgrammeProviderRaw);

export { useProgrammes };
