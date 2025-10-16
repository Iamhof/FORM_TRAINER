import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from './UserContext';

export type ProgrammeExercise = {
  day: number;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
};

export type Programme = {
  id: string;
  name: string;
  days: number;
  weeks: number;
  exercises: ProgrammeExercise[];
  createdAt: string;
};

export const [ProgrammeProvider, useProgrammes] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState<Map<string, number>>(new Map());
  const [completedSessionKeys, setCompletedSessionKeys] = useState<Set<string>>(new Set());

  const loadProgrammes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProgrammes([]);
      setCompletedSessions(new Map());
      setIsLoading(false);
      return;
    }

    try {
      console.log('[ProgrammeContext] Loading programmes for user:', user.id);
      setIsLoading(true);
      
      const { data: programmesData, error: programmesError } = await supabase
        .from('programmes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (programmesError) {
        console.error('[ProgrammeContext] Error loading programmes:');
        console.error('[ProgrammeContext] Code:', programmesError.code);
        console.error('[ProgrammeContext] Message:', programmesError.message);
        throw programmesError;
      }

      console.log('[ProgrammeContext] Loaded programmes:', programmesData?.length || 0);
      setProgrammes(programmesData || []);

      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('programme_id, day, week')
        .eq('user_id', user.id);

      if (workoutsError) {
        console.error('[ProgrammeContext] Error loading workouts:', workoutsError);
      } else {
        const sessionsMap = new Map<string, number>();
        const sessionKeysSet = new Set<string>();
        
        workoutsData?.forEach(workout => {
          const count = sessionsMap.get(workout.programme_id) || 0;
          sessionsMap.set(workout.programme_id, count + 1);
          
          const sessionKey = `${workout.programme_id}-${workout.day}-${workout.week}`;
          sessionKeysSet.add(sessionKey);
        });
        
        console.log('[ProgrammeContext] Completed sessions by programme:', Array.from(sessionsMap.entries()));
        console.log('[ProgrammeContext] Completed session keys:', Array.from(sessionKeysSet));
        setCompletedSessions(sessionsMap);
        setCompletedSessionKeys(sessionKeysSet);
      }
    } catch (error) {
      console.error('[ProgrammeContext] Failed to load programmes:', error);
      setProgrammes([]);
      setCompletedSessions(new Map());
      setCompletedSessionKeys(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadProgrammes();
  }, [loadProgrammes]);

  const addProgramme = useCallback(
    async (programme: { name: string; days: number; weeks: number; exercises: ProgrammeExercise[] }) => {
      if (!user) {
        console.error('[ProgrammeContext] Cannot create programme - user not authenticated');
        throw new Error('Not authenticated');
      }

      try {
        console.log('[ProgrammeContext] Creating programme:', {
          name: programme.name,
          days: programme.days,
          weeks: programme.weeks,
          exerciseCount: programme.exercises.length,
          userId: user.id
        });
        
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[ProgrammeContext] Current session:', sessionData.session ? 'Active' : 'None');
        
        if (!sessionData.session) {
          throw new Error('No active session. Please sign in again.');
        }
        
        const { data, error } = await supabase
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

        if (error) {
          console.error('[ProgrammeContext] Supabase error creating programme:');
          console.error('[ProgrammeContext] Error code:', error.code);
          console.error('[ProgrammeContext] Error message:', error.message);
          console.error('[ProgrammeContext] Error details:', error.details);
          console.error('[ProgrammeContext] Error hint:', error.hint);
          throw new Error(`Failed to save programme: ${error.message}`);
        }

        console.log('[ProgrammeContext] Programme created successfully:', data.id);
        setProgrammes((prev) => [data, ...prev]);
        return data;
      } catch (error) {
        console.error('[ProgrammeContext] Failed to create programme:', error);
        throw error;
      }
    },
    [user]
  );

  const deleteProgramme = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      try {
        console.log('[ProgrammeContext] Deleting programme:', id);
        
        const { error } = await supabase
          .from('programmes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('[ProgrammeContext] Error deleting programme:', error);
          throw error;
        }

        console.log('[ProgrammeContext] Programme deleted successfully');
        setProgrammes((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error('[ProgrammeContext] Failed to delete programme:', error);
        throw error;
      }
    },
    [user]
  );

  const getProgramme = useCallback(
    (id: string) => {
      return programmes.find((p) => p.id === id) || null;
    },
    [programmes]
  );

  const activeProgramme = useMemo(() => {
    return programmes.length > 0 ? programmes[0] : null;
  }, [programmes]);

  const getProgrammeProgress = useCallback((programmeId: string) => {
    const programme = programmes.find(p => p.id === programmeId);
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
    const sessionKey = `${programmeId}-${day}-${week}`;
    return completedSessionKeys.has(sessionKey);
  }, [completedSessionKeys]);

  return useMemo(
    () => ({
      programmes,
      isLoading,
      addProgramme,
      deleteProgramme,
      getProgramme,
      activeProgramme,
      completedSessions,
      completedSessionKeys,
      getProgrammeProgress,
      isSessionCompleted,
      refetch: loadProgrammes,
    }),
    [programmes, isLoading, addProgramme, deleteProgramme, getProgramme, activeProgramme, completedSessions, completedSessionKeys, getProgrammeProgress, isSessionCompleted, loadProgrammes]
  );
});
