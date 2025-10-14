import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsData, MonthlyDataPoint } from '@/types/analytics';
import { trpc } from '@/lib/trpc';
import { useUser } from './UserContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateEmptyMonthlyData(): MonthlyDataPoint[] {
  const currentMonth = new Date().getMonth();
  const last6Months = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    last6Months.push({
      month: MONTHS[monthIndex],
      value: 0,
    });
  }
  
  return last6Months;
}

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const { isAuthenticated } = useUser();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sessionsCompleted: generateEmptyMonthlyData(),
    sessionsMissed: generateEmptyMonthlyData(),
    completionRate: generateEmptyMonthlyData(),
    totalVolume: generateEmptyMonthlyData(),
    exerciseProgress: [],
    restDays: {
      thisMonth: 0,
      lastMonth: 0,
      average: 0,
    },
  });

  const analyticsQuery = trpc.analytics.get.useQuery(
    {},
    {
      enabled: isAuthenticated,
    }
  );

  const syncMutation = trpc.analytics.sync.useMutation();

  useEffect(() => {
    if (analyticsQuery.data && analyticsQuery.data.length > 0) {
      console.log('Analytics data loaded:', analyticsQuery.data);
    }
  }, [analyticsQuery.data]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAnalyticsData({
        sessionsCompleted: generateEmptyMonthlyData(),
        sessionsMissed: generateEmptyMonthlyData(),
        completionRate: generateEmptyMonthlyData(),
        totalVolume: generateEmptyMonthlyData(),
        exerciseProgress: [],
        restDays: {
          thisMonth: 0,
          lastMonth: 0,
          average: 0,
        },
      });
    }
  }, [isAuthenticated]);

  const syncAnalytics = useCallback(
    async (data: {
      exerciseId: string;
      date: string;
      maxWeight: number;
      totalVolume: number;
      totalReps: number;
    }[]) => {
      try {
        await syncMutation.mutateAsync(data);
        analyticsQuery.refetch();
      } catch (error) {
        console.error('Failed to sync analytics:', error);
      }
    },
    [syncMutation, analyticsQuery]
  );

  const calculateCompletionPercentage = useMemo(() => {
    const currentMonth = analyticsData.sessionsCompleted[analyticsData.sessionsCompleted.length - 1];
    const missedMonth = analyticsData.sessionsMissed[analyticsData.sessionsMissed.length - 1];
    
    const total = currentMonth.value + missedMonth.value;
    if (total === 0) return 0;
    
    return Math.round((currentMonth.value / total) * 100);
  }, [analyticsData]);

  const totalSessionsThisMonth = useMemo(() => {
    return analyticsData.sessionsCompleted[analyticsData.sessionsCompleted.length - 1]?.value || 0;
  }, [analyticsData]);

  const totalVolumeThisMonth = useMemo(() => {
    return analyticsData.totalVolume[analyticsData.totalVolume.length - 1]?.value || 0;
  }, [analyticsData]);

  return useMemo(() => ({
    analyticsData,
    calculateCompletionPercentage,
    totalSessionsThisMonth,
    totalVolumeThisMonth,
    syncAnalytics,
    refetch: analyticsQuery.refetch,
  }), [analyticsData, calculateCompletionPercentage, totalSessionsThisMonth, totalVolumeThisMonth, syncAnalytics, analyticsQuery.refetch]);
});
