import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsData, MonthlyDataPoint } from '@/types/analytics';
import { supabase } from '@/lib/supabase';
import { useUser } from './UserContext';
import { AnalyticsData as DBAnalyticsData, Schedule } from '@/types/database';
import { useProgrammes } from './ProgrammeContext';

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

function aggregateAnalyticsData(
  rawAnalytics: DBAnalyticsData[],
  workouts: { completed_at: string; programme_id: string }[],
  schedules: Schedule[],
  activeProgrammeDays: number
): AnalyticsData {
  const monthlyData: {
    [key: string]: {
      sessions: number;
      volume: number;
      exercises: Set<string>;
    };
  } = {};

  const exerciseData: {
    [key: string]: {
      name: string;
      data: { date: string; weight: number }[];
    };
  } = {};

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  for (let i = 5; i >= 0; i--) {
    const targetMonth = (currentMonth - i + 12) % 12;
    const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const key = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    monthlyData[key] = { sessions: 0, volume: 0, exercises: new Set() };
  }

  const scheduledSessionsByMonth: { [key: string]: number } = {};
  const restDaysByMonth: { [key: string]: number } = {};
  const completedSessionsByMonth: { [key: string]: Set<string> } = {};

  schedules.forEach((schedule) => {
    const weekDate = new Date(schedule.week_start);
    const monthKey = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}`;

    if (!scheduledSessionsByMonth[monthKey]) {
      scheduledSessionsByMonth[monthKey] = 0;
      restDaysByMonth[monthKey] = 0;
      completedSessionsByMonth[monthKey] = new Set();
    }

    schedule.schedule.forEach((day) => {
      if (day.status === 'scheduled') {
        scheduledSessionsByMonth[monthKey] += 1;
      } else if (day.status === 'rest') {
        restDaysByMonth[monthKey] += 1;
      } else if (day.status === 'completed') {
        scheduledSessionsByMonth[monthKey] += 1;
        completedSessionsByMonth[monthKey].add(`${schedule.week_start}-${day.dayOfWeek}`);
      }
    });
  });

  rawAnalytics.forEach((record) => {
    const recordDate = new Date(record.date);
    const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].volume += record.total_volume / 1000;
      monthlyData[monthKey].exercises.add(record.exercise_id);
    }

    if (!exerciseData[record.exercise_id]) {
      exerciseData[record.exercise_id] = {
        name: record.exercise_id,
        data: [],
      };
    }
    exerciseData[record.exercise_id].data.push({
      date: record.date,
      weight: record.max_weight,
    });
  });

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.completed_at);
    const monthKey = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].sessions += 1;
    }
  });

  const sessionsCompleted: MonthlyDataPoint[] = [];
  const sessionsMissed: MonthlyDataPoint[] = [];
  const totalVolume: MonthlyDataPoint[] = [];
  const completionRate: MonthlyDataPoint[] = [];

  Object.keys(monthlyData)
    .sort()
    .forEach((key) => {
      const [, month] = key.split('-').map(Number);
      const monthName = MONTHS[month - 1];
      const data = monthlyData[key];

      sessionsCompleted.push({ month: monthName, value: data.sessions });
      totalVolume.push({ month: monthName, value: Math.round(data.volume) });
      
      const scheduledForMonth = scheduledSessionsByMonth[key] || 0;
      const completedForMonth = completedSessionsByMonth[key]?.size || 0;
      const missed = Math.max(0, scheduledForMonth - completedForMonth);
      
      sessionsMissed.push({ month: monthName, value: missed });
      
      const rate = scheduledForMonth > 0 ? Math.round((completedForMonth / scheduledForMonth) * 100) : 0;
      completionRate.push({ month: monthName, value: rate });
    });

  const currentMonthKey = Object.keys(monthlyData).sort().pop();
  const lastMonthKeys = Object.keys(monthlyData).sort();
  const lastMonthKey = lastMonthKeys.length >= 2 ? lastMonthKeys[lastMonthKeys.length - 2] : null;

  const restDaysThisMonth = currentMonthKey ? (restDaysByMonth[currentMonthKey] || 0) : 0;
  const restDaysLastMonth = lastMonthKey ? (restDaysByMonth[lastMonthKey] || 0) : 0;
  const allRestDays = Object.values(restDaysByMonth);
  const averageRestDays = allRestDays.length > 0 
    ? Math.round(allRestDays.reduce((sum, val) => sum + val, 0) / allRestDays.length)
    : 0;

  const exerciseProgress = Object.entries(exerciseData)
    .map(([exerciseId, data]) => {
      if (data.data.length < 2) return null;

      const sorted = data.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const startWeight = sorted[0].weight;
      const currentWeight = sorted[sorted.length - 1].weight;
      const percentageIncrease = startWeight > 0 ? Math.round(((currentWeight - startWeight) / startWeight) * 100) : 0;

      return {
        exerciseName: exerciseId,
        startWeight,
        currentWeight,
        percentageIncrease,
        history: sorted.map(item => ({ date: item.date, weight: item.weight })),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    sessionsCompleted,
    sessionsMissed,
    completionRate,
    totalVolume,
    exerciseProgress,
    restDays: {
      thisMonth: restDaysThisMonth,
      lastMonth: restDaysLastMonth,
      average: averageRestDays,
    },
  };
}

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const { activeProgramme } = useProgrammes();
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
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      const [analyticsResult, workoutsResult, schedulesResult] = await Promise.all([
        supabase
          .from('analytics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .order('date', { ascending: true }),
        supabase
          .from('workouts')
          .select('completed_at, programme_id')
          .eq('user_id', user.id)
          .gte('completed_at', startDate)
          .order('completed_at', { ascending: true }),
        supabase
          .from('schedules')
          .select('*')
          .eq('user_id', user.id)
          .gte('week_start', startDate)
          .order('week_start', { ascending: true }),
      ]);

      if (analyticsResult.error) {
        console.error('[AnalyticsContext] Error loading analytics:', analyticsResult.error);
        return;
      }

      if (workoutsResult.error) {
        console.error('[AnalyticsContext] Error loading workouts:', workoutsResult.error);
        return;
      }

      if (schedulesResult.error) {
        console.error('[AnalyticsContext] Error loading schedules:', schedulesResult.error);
        return;
      }

      const rawAnalytics = analyticsResult.data as DBAnalyticsData[] || [];
      const workouts = workoutsResult.data || [];
      const schedules = schedulesResult.data as Schedule[] || [];

      console.log('[AnalyticsContext] Loaded:', rawAnalytics.length, 'analytics records,', workouts.length, 'workouts,', schedules.length, 'schedules');

      const activeProgrammeDays = activeProgramme?.days || 3;
      const aggregatedData = aggregateAnalyticsData(rawAnalytics, workouts, schedules, activeProgrammeDays);
      setAnalyticsData(aggregatedData);
    } catch (error) {
      console.error('[AnalyticsContext] Failed to load analytics:', error);
    }
  }, [isAuthenticated, user, activeProgramme]);

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
