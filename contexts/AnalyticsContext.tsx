import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUser } from '@/contexts/UserContext';
import { trpc, getRetryConfig } from '@/lib/trpc';
import { AnalyticsData, MonthlyDataPoint } from '@/types/analytics';

import { useProgrammes } from './ProgrammeContext';


type SyncPayload = {
  exerciseId: string;
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
};

const generateEmptyMonthlyData = (): MonthlyDataPoint[] =>
  Array.from({ length: 6 }, (_, idx) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - idx));
    return {
      month: month.toLocaleString('default', { month: 'short' }),
      value: 0,
    };
  });

const emptyAnalytics: AnalyticsData = {
  sessionsCompleted: generateEmptyMonthlyData(),
  sessionsMissed: generateEmptyMonthlyData(),
  strengthProgressionRate: generateEmptyMonthlyData(),
  totalVolume: generateEmptyMonthlyData(),
  exerciseProgress: [],
  restDays: { thisMonth: 0, lastMonth: 0, average: 0 },
  streak: 0,
};

const emptyVolume = {
  totalVolumeKg: 0,
  workoutCount: 0,
  previousPeriodVolumeKg: 0,
  percentageChange: 0,
};

const [AnalyticsProviderRaw, useAnalytics] = createContextHook(() => {
  const { isAuthenticated } = useUser();
  const { activeProgramme } = useProgrammes();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(emptyAnalytics);
  const [volumePeriod, setVolumePeriod] = useState<'week' | 'month' | 'total'>('week');
  // Defer queries until analytics data is actually needed (tab visit or post-workout sync)
  const [hasAccessed, setHasAccessed] = useState(false);

  const overviewQuery = trpc.analytics.overview.useQuery(
    {
      months: 6,
      programmeDays: activeProgramme?.days ?? 3,
    },
    {
      enabled: isAuthenticated && hasAccessed,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const volumeQuery = trpc.analytics.getVolume.useQuery(
    { period: volumePeriod },
    {
      enabled: isAuthenticated && hasAccessed,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  useEffect(() => {
    if (overviewQuery.data?.analytics) {
      setAnalyticsData(overviewQuery.data.analytics);
    } else if (!isAuthenticated) {
      setAnalyticsData(emptyAnalytics);
    }
  }, [overviewQuery.data, isAuthenticated]);

  const syncMutation = trpc.analytics.sync.useMutation({
    ...getRetryConfig('heavy'), // Analytics sync can be data-intensive on slow networks
    onSuccess: () => {
      overviewQuery.refetch();
      volumeQuery.refetch();
    },
  });
  // Store mutation in ref to avoid unstable dependency
  const syncMutationRef = useRef(syncMutation);
  syncMutationRef.current = syncMutation;

  const syncAnalytics = useCallback(
    async (records: SyncPayload[]) => {
      if (!records.length) return;
      await syncMutationRef.current.mutateAsync(records);
    },
    [] // No dependencies needed - ref is stable
  );

  // Enable analytics queries — call when user accesses analytics features
  const enableAnalyticsQueries = useCallback(() => {
    setHasAccessed(true);
  }, []);

  // refetch methods are stable references, so no dependencies needed
  // Also enables queries so post-workout syncs work even if analytics tab wasn't visited
  const refresh = useCallback(() => {
    setHasAccessed(true);
    overviewQuery.refetch();
    volumeQuery.refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tRPC query.refetch methods are stable references
  }, []);

  const calculateCompletionPercentage = useMemo(() => {
    const completed = analyticsData.sessionsCompleted[analyticsData.sessionsCompleted.length - 1];
    const missed = analyticsData.sessionsMissed[analyticsData.sessionsMissed.length - 1];
    const total = (completed?.value ?? 0) + (missed?.value ?? 0);
    if (total === 0) return 0;
    return Math.round(((completed?.value ?? 0) / total) * 100);
  }, [analyticsData]);

  const totalSessionsThisMonth = useMemo(
    () => analyticsData.sessionsCompleted[analyticsData.sessionsCompleted.length - 1]?.value ?? 0,
    [analyticsData]
  );

  const totalVolumeThisMonth = useMemo(
    () => analyticsData.totalVolume[analyticsData.totalVolume.length - 1]?.value ?? 0,
    [analyticsData]
  );

  // Extract stable values BEFORE useMemo to avoid unstable object property references
  const volumeData = volumeQuery.data ?? emptyVolume;
  const volumeLoading = volumeQuery.isFetching;
  const volumeError = volumeQuery.error ?? null;
  const isRefreshing = overviewQuery.isFetching || syncMutation.isPending;

  return useMemo(
    () => ({
      analyticsData,
      calculateCompletionPercentage,
      totalSessionsThisMonth,
      totalVolumeThisMonth,
      syncAnalytics,
      refetch: refresh,
      enableAnalyticsQueries,
      volumePeriod,
      setVolumePeriod,
      volumeData,
      volumeLoading,
      volumeError,
      refetchVolume: volumeQuery.refetch,
      isRefreshing,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volumeQuery.refetch is a stable tRPC reference
    [
      analyticsData,
      calculateCompletionPercentage,
      totalSessionsThisMonth,
      totalVolumeThisMonth,
      syncAnalytics,
      refresh,
      enableAnalyticsQueries,
      volumePeriod,
      volumeData,
      volumeLoading,
      volumeError,
      isRefreshing,
    ]
  );
});

// Wrap provider with React.memo to prevent unnecessary re-renders
// when UserContext or ProgrammeContext updates but relevant values haven't changed
export const AnalyticsProvider = React.memo(AnalyticsProviderRaw);

export { useAnalytics };

