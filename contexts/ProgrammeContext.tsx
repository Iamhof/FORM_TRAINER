import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useMemo, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from './UserContext';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

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
      staleTime: 1000 * 60 * 1, // 1 minute
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
      
      if (programmesError.includes('HTML instead of JSON') || historyError.includes('HTML instead of JSON')) {
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

  // Use fallback data when TRPC fails
  const programmes = usingFallback ? fallbackProgrammes : (programmesQuery.data || []);
  const workoutHistory = usingFallback ? fallbackHistory : (workoutHistoryQuery.data || []);
  const isLoadingProgrammes = programmesQuery.isLoading;
  const isLoadingHistory = workoutHistoryQuery.isLoading;

  // Mutations
  const createProgrammeMutation = trpc.programmes.create.useMutation({
    onSuccess: () => {
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
    async (programme: { name: string; days: number; weeks: number; exercises: ProgrammeExercise[] }) => {
      if (!user) throw new Error('Not authenticated');
      try {
        const result = await createMutationRef.current.mutateAsync({
            name: programme.name,
            days: programme.days,
            weeks: programme.weeks,
            exercises: programme.exercises,
        });
        return result;
      } catch (error) {
        // Check if this is a tunnel/API route error (HTML response)
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('HTML instead of JSON') || errorMessage.includes('API route')) {
          logger.warn('[ProgrammeContext] TRPC failed (tunnel mode?), falling back to direct Supabase');
          
          // Fallback: Create programme directly via Supabase
          const { data: newProgramme, error: supabaseError } = await supabase
            .from('programmes')
            .insert({
              user_id: user.id,
              name: programme.name,
              days: programme.days,
              weeks: programme.weeks,
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
        if (errorMessage.includes('HTML instead of JSON') || errorMessage.includes('API route')) {
          logger.warn('[ProgrammeContext] TRPC delete failed (tunnel mode?), falling back to direct Supabase');
          
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
  const firstProgrammeId = programmes.length > 0 ? programmes[0].id : null;
  const firstProgrammeData = programmes.length > 0 ? programmes[0] : null;
  
  const activeProgramme = useMemo(() => {
    return firstProgrammeData as Programme | null;
  }, [
    firstProgrammeId,
    // Only recalculate if core properties change
    firstProgrammeData?.name,
    firstProgrammeData?.days,
    firstProgrammeData?.weeks,
    // Use stringified exercises to detect changes without causing reference issues
    firstProgrammeData ? JSON.stringify(firstProgrammeData.exercises) : null
  ]);

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
      refetch,
    ]
  );
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext updates but user/isAuthenticated haven't changed
export const ProgrammeProvider = React.memo(ProgrammeProviderRaw);

export { useProgrammes };
