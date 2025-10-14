import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
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
  const { isAuthenticated } = useUser();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const programmesQuery = trpc.programmes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (programmesQuery.data) {
      setProgrammes(programmesQuery.data);
      setIsLoading(false);
    }
    if (programmesQuery.error) {
      console.error('Failed to load programmes:', programmesQuery.error);
      setIsLoading(false);
    }
  }, [programmesQuery.data, programmesQuery.error]);

  const createMutation = trpc.programmes.create.useMutation({
    onSuccess: (newProgramme) => {
      setProgrammes((prev) => [...prev, newProgramme]);
      programmesQuery.refetch();
    },
  });

  const deleteMutation = trpc.programmes.delete.useMutation({
    onSuccess: (_, variables) => {
      setProgrammes((prev) => prev.filter((p) => p.id !== variables.id));
      programmesQuery.refetch();
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setProgrammes([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const addProgramme = useCallback(
    async (programme: { name: string; days: number; weeks: number; exercises: ProgrammeExercise[] }) => {
      try {
        const newProgramme = await createMutation.mutateAsync(programme);
        return newProgramme;
      } catch (error) {
        console.error('Failed to create programme:', error);
        throw error;
      }
    },
    [createMutation]
  );

  const deleteProgramme = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete programme:', error);
        throw error;
      }
    },
    [deleteMutation]
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
      isLoading: isLoading || programmesQuery.isLoading,
      addProgramme,
      deleteProgramme,
      getProgramme,
      refetch: programmesQuery.refetch,
    }),
    [programmes, isLoading, programmesQuery.isLoading, addProgramme, deleteProgramme, getProgramme, programmesQuery.refetch]
  );
});
