import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

import { getLocalWeekStart } from '@/lib/date-utils';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc';

import { useProgrammes } from './ProgrammeContext';
import { useUser } from './UserContext';

export type DayStatus = 'scheduled' | 'completed' | 'rest' | 'empty';

export type ScheduleDay = {
  dayOfWeek: number;
  status: DayStatus;
  sessionId?: string | null;
  weekStart: string;
};

export type WeekSchedule = {
  id?: string;
  userId: string;
  programmeId: string | null;
  weekStart: string;
  schedule: ScheduleDay[];
};

// Using centralized date utility to ensure local timezone handling
const getWeekStart = getLocalWeekStart;

const getInitialSchedule = (weekStart: string): ScheduleDay[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    status: 'empty' as const,
    weekStart,
    // sessionId omitted entirely - not needed for empty days
  }));

const [ScheduleProviderRaw, useSchedule] = createContextHook(() => {
  const { isAuthenticated } = useUser();
  const { activeProgramme } = useProgrammes();

  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [schedule, setSchedule] = useState<ScheduleDay[]>(getInitialSchedule(currentWeekStart));

  const scheduleQuery = trpc.schedules.get.useQuery(
    { weekStart: currentWeekStart },
    {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes — aligned with global default
    }
  );

  useEffect(() => {
    if (scheduleQuery.data?.schedule) {
      setSchedule(scheduleQuery.data.schedule);
    } else if (!isAuthenticated) {
      setSchedule(getInitialSchedule(currentWeekStart));
    }
  }, [scheduleQuery.data, isAuthenticated, currentWeekStart]);

  // Auto-detect week rollover: Check on mount, app foreground, and periodically
  useEffect(() => {
    const checkWeekRollover = () => {
      const actualWeekStart = getWeekStart();
      if (actualWeekStart !== currentWeekStart) {
        logger.info('[ScheduleContext] Week rollover detected:', {
          old: currentWeekStart,
          new: actualWeekStart,
        });
        setCurrentWeekStart(actualWeekStart);
      }
    };

    // Check immediately on mount
    checkWeekRollover();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkWeekRollover();
      }
    });

    // Check periodically every 5 minutes while app is active
    const interval = setInterval(checkWeekRollover, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [currentWeekStart]);

  const updateMutation = trpc.schedules.update.useMutation({
    onSuccess: (response) => {
      logger.info('[ScheduleContext] updateSchedule succeeded');
      if (response?.success) {
        scheduleQuery.refetch();
      }
    },
    onError: (error) => {
      logger.error('[ScheduleContext] updateSchedule FAILED:', {
        message: error.message,
        code: (error as any).data?.code,
      });
      Alert.alert(
        'Schedule Update Failed',
        'Could not save your schedule. Please check your connection and try again.'
      );
    },
  });
  // Store mutation in ref to avoid unstable dependency
  const updateMutationRef = useRef(updateMutation);
  updateMutationRef.current = updateMutation;

  const assignMutation = trpc.schedules.assignSession.useMutation({
    onSuccess: (response) => {
      logger.info('[ScheduleContext] assignSession succeeded');
      if (response?.schedule) {
        setSchedule(response.schedule);
      }
    },
    onError: (error) => {
      logger.error('[ScheduleContext] assignSession FAILED:', {
        message: error.message,
        code: (error as any).data?.code,
      });
      Alert.alert(
        'Session Assignment Failed',
        'Could not assign the session. Please check your connection and try again.'
      );
    },
  });
  // Store mutation in ref to avoid unstable dependency
  const assignMutationRef = useRef(assignMutation);
  assignMutationRef.current = assignMutation;

  const toggleMutation = trpc.schedules.toggleDay.useMutation({
    onSuccess: (response) => {
      logger.info('[ScheduleContext] toggleDay succeeded');
      if (response?.schedule) {
        setSchedule(response.schedule);
      }
    },
    onError: (error) => {
      logger.error('[ScheduleContext] toggleDay FAILED:', {
        message: error.message,
        code: (error as any).data?.code,
      });
      // Revert optimistic update by refetching the server state
      scheduleQuery.refetch();
      Alert.alert(
        'Schedule Update Failed',
        'Could not update the day. Please check your connection and try again.'
      );
    },
  });
  // Store mutation in ref to avoid unstable dependency
  const toggleMutationRef = useRef(toggleMutation);
  toggleMutationRef.current = toggleMutation;

  // refetch is a stable reference from react-query, no dependency needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadSchedule = useCallback(() => scheduleQuery.refetch(), []);

  const saveSchedule = useCallback(
    async (newSchedule: ScheduleDay[]) => {
      logger.info('[ScheduleContext] saveSchedule called', {
        weekStart: currentWeekStart,
        programmeId: activeProgramme?.id ?? null,
        scheduledDays: newSchedule.filter(d => d.status === 'scheduled').length,
      });
      try {
        await updateMutationRef.current.mutateAsync({
          weekStart: currentWeekStart,
          programmeId: activeProgramme?.id ?? null,
          schedule: newSchedule,
        });
        setSchedule(newSchedule);
      } catch (error) {
        logger.error('[ScheduleContext] saveSchedule threw:', error);
        // Error alert is handled by the mutation's onError callback
        throw error;
      }
    },
    [activeProgramme?.id, currentWeekStart] // Only primitive values
  );

  const assignSession = useCallback(
    async (dayIndex: number, sessionId: string | null) => {
      if (!activeProgramme) {
        logger.warn('[ScheduleContext] assignSession called with no activeProgramme');
        return;
      }
      logger.info('[ScheduleContext] assignSession called', {
        dayIndex,
        sessionId,
        weekStart: currentWeekStart,
        programmeId: activeProgramme.id,
      });
      try {
        await assignMutationRef.current.mutateAsync({
          weekStart: currentWeekStart,
          programmeId: activeProgramme.id,
          dayOfWeek: dayIndex,
          sessionId,
        });
      } catch (error) {
        logger.error('[ScheduleContext] assignSession threw:', error);
        // Error alert is handled by the mutation's onError callback
        throw error;
      }
    },
    [activeProgramme, currentWeekStart] // activeProgramme is memoized in ProgrammeContext
  );

  const toggleDay = useCallback(
    async (dayIndex: number) => {
      if (!activeProgramme) {
        logger.warn('[ScheduleContext] toggleDay called with no activeProgramme');
        return;
      }
      logger.info('[ScheduleContext] toggleDay called', {
        dayIndex,
        weekStart: currentWeekStart,
        programmeId: activeProgramme.id,
        currentStatus: schedule[dayIndex]?.status,
      });

      // Optimistic update: immediately toggle the day in local state
      const previousSchedule = [...schedule];
      const currentStatus = schedule[dayIndex]?.status;
      const optimisticSchedule = schedule.map((day, i) => {
        if (i !== dayIndex) return day;
        const newStatus = (currentStatus === 'scheduled' ? 'rest' : 'scheduled') as DayStatus;
        const result: ScheduleDay = {
          dayOfWeek: day.dayOfWeek,
          status: newStatus,
          weekStart: day.weekStart,
        };
        // Only include sessionId if toggling to 'scheduled' and it exists
        if (newStatus === 'scheduled' && day.sessionId) {
          result.sessionId = day.sessionId;
        }
        return result;
      });
      setSchedule(optimisticSchedule);

      try {
        await toggleMutationRef.current.mutateAsync({
          weekStart: currentWeekStart,
          dayIndex,
          programmeId: activeProgramme.id,
        });
        // onSuccess callback will set the authoritative schedule from the server
      } catch (error) {
        logger.error('[ScheduleContext] toggleDay threw, reverting optimistic update:', error);
        // Revert optimistic update on failure
        setSchedule(previousSchedule);
        // Error alert is handled by the mutation's onError callback
      }
    },
    [activeProgramme, currentWeekStart, schedule]
  );

  const scheduledCount = useMemo(
    () => schedule.filter((d) => d.status === 'scheduled').length,
    [schedule]
  );

  const canScheduleMore = useMemo(() => {
    if (!activeProgramme) return false;
    return scheduledCount < activeProgramme.days;
  }, [scheduledCount, activeProgramme]);

  const isLoading =
    scheduleQuery.isLoading || updateMutation.isPending || assignMutation.isPending || toggleMutation.isPending;

  return useMemo(
    () => ({
      schedule,
      isLoading,
      scheduledCount,
      canScheduleMore,
      currentWeekStart,
      setCurrentWeekStart,
      toggleDay,
      assignSession,
      loadSchedule,
      saveSchedule,
    }),
    [
      schedule,
      isLoading,
      scheduledCount,
      canScheduleMore,
      currentWeekStart,
      toggleDay,
      assignSession,
      loadSchedule,
      saveSchedule,
    ]
  );
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext or ProgrammeContext updates but relevant values haven't changed
export const ScheduleProvider = React.memo(ScheduleProviderRaw);

export { useSchedule };

