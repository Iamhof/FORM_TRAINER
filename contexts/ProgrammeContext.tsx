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

  const loadProgrammes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProgrammes([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[ProgrammeContext] Loading programmes for user:', user.id);
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProgrammeContext] Error loading programmes:', error);
        throw error;
      }

      console.log('[ProgrammeContext] Loaded programmes:', data?.length || 0);
      setProgrammes(data || []);
    } catch (error) {
      console.error('[ProgrammeContext] Failed to load programmes:', error);
      setProgrammes([]);
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
        throw new Error('Not authenticated');
      }

      try {
        console.log('[ProgrammeContext] Creating programme:', programme.name);
        
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
          console.error('[ProgrammeContext] Error creating programme:', error);
          throw error;
        }

        console.log('[ProgrammeContext] Programme created successfully');
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

  return useMemo(
    () => ({
      programmes,
      isLoading,
      addProgramme,
      deleteProgramme,
      getProgramme,
      refetch: loadProgrammes,
    }),
    [programmes, isLoading, addProgramme, deleteProgramme, getProgramme, loadProgrammes]
  );
});
