import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsData, MonthlyDataPoint } from '@/types/analytics';
import { supabase } from '@/lib/supabase';
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
  const { user, isAuthenticated } = useUser();
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

  const loadAnalytics = useCallback(async () => {
    if (!isAuthenticated || !user) {
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
      return;
    }

    try {
      console.log('[AnalyticsContext] Loading analytics for user:', user.id);
      
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('[AnalyticsContext] Error loading analytics:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('[AnalyticsContext] Analytics data loaded:', data.length, 'records');
      }
    } catch (error) {
      console.error('[AnalyticsContext] Failed to load analytics:', error);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const syncAnalytics = useCallback(
    async (data: {
      exerciseId: string;
      date: string;
      maxWeight: number;
      totalVolume: number;
      totalReps: number;
    }[]) => {
      if (!user) {
        console.error('[AnalyticsContext] Cannot sync analytics: not authenticated');
        return;
      }

      try {
        console.log('[AnalyticsContext] Syncing analytics:', data.length, 'records');
        
        const records = data.map((item) => ({
          user_id: user.id,
          exercise_id: item.exerciseId,
          date: item.date,
          max_weight: item.maxWeight,
          total_volume: item.totalVolume,
          total_reps: item.totalReps,
        }));

        const { error } = await supabase
          .from('analytics')
          .upsert(records, {
            onConflict: 'user_id,exercise_id,date',
          });

        if (error) {
          console.error('[AnalyticsContext] Error syncing analytics:', error);
          throw error;
        }

        console.log('[AnalyticsContext] Analytics synced successfully');
        await loadAnalytics();
      } catch (error) {
        console.error('[AnalyticsContext] Failed to sync analytics:', error);
      }
    },
    [user, loadAnalytics]
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
    refetch: loadAnalytics,
  }), [analyticsData, calculateCompletionPercentage, totalSessionsThisMonth, totalVolumeThisMonth, syncAnalytics, loadAnalytics]);
});
