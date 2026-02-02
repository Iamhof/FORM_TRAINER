import { AnalyticsData, MonthlyDataPoint } from '../../../../types/analytics.js';
import { AnalyticsData as DBAnalyticsData, Schedule } from '../../../../types/database.js';
import { getLocalDateString } from '../../../../lib/date-utils.js';

type WorkoutSummary = {
  completed_at: string;
  programme_id: string | null;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const generateEmptyMonthlyData = (): MonthlyDataPoint[] => {
  const currentMonth = new Date().getMonth();
  const points: MonthlyDataPoint[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    const monthIndex = (currentMonth - i + 12) % 12;
    points.push({
      month: MONTHS[monthIndex],
      value: 0,
    });
  }

  return points;
};

const getWeekStart = (date: Date): string => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = clone.getDate() - day + (day === 0 ? -6 : 1);
  clone.setDate(diff);
  clone.setHours(0, 0, 0, 0);
  return getLocalDateString(clone); // Use local date to prevent timezone issues
};

const calculateStreak = (
  workouts: WorkoutSummary[],
  schedules: Schedule[]
): number => {
  if (schedules.length === 0 || workouts.length === 0) return 0;

  const weekData: Map<string, { scheduled: number; completed: number }> = new Map();

  schedules.forEach((schedule) => {
    const weekStart = schedule.week_start;
    const scheduledCount = schedule.schedule.filter(
      (day) => day.status === 'scheduled' || day.status === 'completed'
    ).length;

    const entry = weekData.get(weekStart);
    if (entry) {
      entry.scheduled = Math.max(entry.scheduled, scheduledCount);
    } else {
      weekData.set(weekStart, { scheduled: scheduledCount, completed: 0 });
    }
  });

  workouts.forEach((workout) => {
    const weekStart = getWeekStart(new Date(workout.completed_at));
    const entry = weekData.get(weekStart);
    if (entry) {
      entry.completed += 1;
    } else {
      weekData.set(weekStart, { scheduled: 0, completed: 1 });
    }
  });

  const sortedWeeks = Array.from(weekData.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  let streak = 0;

  for (const [, weekMetrics] of sortedWeeks) {
    if (weekMetrics.scheduled > 0 && weekMetrics.completed >= weekMetrics.scheduled) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export const aggregateAnalyticsData = (
  rawAnalytics: DBAnalyticsData[],
  workouts: WorkoutSummary[],
  schedules: Schedule[],
  _activeProgrammeDays: number
): AnalyticsData => {
  const monthlyData: Record<
    string,
    { sessionsCompleted: number; volume: number; exercises: Set<string> }
  > = {};

  const exerciseData: Record<
    string,
    {
      name: string;
      data: { date: string; weight: number }[];
    }
  > = {};

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  for (let i = 5; i >= 0; i -= 1) {
    const targetMonth = (currentMonth - i + 12) % 12;
    const yearAdjustment = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const key = `${yearAdjustment}-${String(targetMonth + 1).padStart(2, '0')}`;
    monthlyData[key] = { sessionsCompleted: 0, volume: 0, exercises: new Set() };
  }

  const scheduledSessionsByMonth: Record<string, number> = {};
  const restDaysByMonth: Record<string, number> = {};

  schedules.forEach((schedule) => {
    const weekDate = new Date(schedule.week_start);
    const monthKey = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}`;

    if (!scheduledSessionsByMonth[monthKey]) {
      scheduledSessionsByMonth[monthKey] = 0;
      restDaysByMonth[monthKey] = 0;
    }

    schedule.schedule.forEach((day) => {
      if (day.status === 'scheduled' || day.status === 'completed') {
        scheduledSessionsByMonth[monthKey] += 1;
      } else if (day.status === 'rest') {
        restDaysByMonth[monthKey] += 1;
      }
    });
  });

  rawAnalytics.forEach((record) => {
    const recordDate = new Date(record.date);
    const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;

    const monthEntry = monthlyData[monthKey];
    if (monthEntry) {
      monthEntry.volume += record.total_volume / 1000;
      monthEntry.exercises.add(record.exercise_id);
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
    const monthEntry = monthlyData[monthKey];
    if (monthEntry) {
      monthEntry.sessionsCompleted += 1;
    }
  });

  const sessionsCompleted: MonthlyDataPoint[] = [];
  const sessionsMissed: MonthlyDataPoint[] = [];
  const totalVolume: MonthlyDataPoint[] = [];
  const strengthProgressionRate: MonthlyDataPoint[] = [];

  const sortedMonthKeys = Object.keys(monthlyData).sort();

  sortedMonthKeys.forEach((key, index) => {
    const [, month] = key.split('-').map(Number);
    const monthName = MONTHS[month - 1];
    const data = monthlyData[key];

    const completedForMonth = data.sessionsCompleted;
    const scheduledForMonth = scheduledSessionsByMonth[key] || 0;
    const missed = Math.max(0, scheduledForMonth - completedForMonth);

    sessionsCompleted.push({ month: monthName, value: completedForMonth });
    totalVolume.push({ month: monthName, value: Math.round(data.volume) });
    sessionsMissed.push({ month: monthName, value: missed });

    let progressRate = 0;
    if (index > 0) {
      const previousMonthKey = sortedMonthKeys[index - 1];
      const exerciseProgressions: number[] = [];

      Object.values(exerciseData).forEach((exerciseInfo) => {
        const currentMonthWeights = exerciseInfo.data
          .filter((d) => d.date.startsWith(key))
          .map((d) => d.weight);
        const previousMonthWeights = exerciseInfo.data
          .filter((d) => d.date.startsWith(previousMonthKey))
          .map((d) => d.weight);

        if (currentMonthWeights.length > 0 && previousMonthWeights.length > 0) {
          const avgCurrent =
            currentMonthWeights.reduce((sum, w) => sum + w, 0) / currentMonthWeights.length;
          const avgPrevious =
            previousMonthWeights.reduce((sum, w) => sum + w, 0) / previousMonthWeights.length;

          if (avgPrevious > 0) {
            const percentageChange = ((avgCurrent - avgPrevious) / avgPrevious) * 100;
            exerciseProgressions.push(percentageChange);
          }
        }
      });

      if (exerciseProgressions.length > 0) {
        progressRate = Math.round(
          exerciseProgressions.reduce((sum, val) => sum + val, 0) / exerciseProgressions.length
        );
      }
    }

    strengthProgressionRate.push({ month: monthName, value: progressRate });
  });

  const monthKeysSorted = Object.keys(monthlyData).sort();
  const currentMonthKey = monthKeysSorted[monthKeysSorted.length - 1];
  const lastMonthKey = monthKeysSorted.length >= 2 ? monthKeysSorted[monthKeysSorted.length - 2] : null;

  const restDaysThisMonth = currentMonthKey ? restDaysByMonth[currentMonthKey] || 0 : 0;
  const restDaysLastMonth = lastMonthKey ? restDaysByMonth[lastMonthKey] || 0 : 0;
  const allRestDays = Object.values(restDaysByMonth);
  const averageRestDays =
    allRestDays.length > 0
      ? Math.round(allRestDays.reduce((sum, val) => sum + val, 0) / allRestDays.length)
      : 0;

  const exerciseProgress = Object.entries(exerciseData)
    .map(([exerciseId, data]) => {
      if (data.data.length < 2) return null;

      const sorted = data.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const startWeight = sorted[0].weight;
      const currentWeight = sorted[sorted.length - 1].weight;
      const percentageIncrease =
        startWeight > 0 ? Math.round(((currentWeight - startWeight) / startWeight) * 100) : 0;

      return {
        exerciseName: exerciseId,
        startWeight,
        currentWeight,
        percentageIncrease,
        history: sorted.map((item) => ({ date: item.date, weight: item.weight })),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null) as any;

  const streak = calculateStreak(workouts, schedules);

  return {
    sessionsCompleted,
    sessionsMissed,
    strengthProgressionRate,
    totalVolume,
    exerciseProgress,
    restDays: {
      thisMonth: restDaysThisMonth,
      lastMonth: restDaysLastMonth,
      average: averageRestDays,
    },
    streak,
  };
};
