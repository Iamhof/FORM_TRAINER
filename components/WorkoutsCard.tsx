import React from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';

type WorkoutsPeriod = 'week' | 'month' | 'total';

type WorkoutsCardProps = {
  workoutsPeriod: WorkoutsPeriod;
  onPeriodChange: (period: WorkoutsPeriod) => void;
  workoutsData?: {
    workoutCount: number;
    totalVolumeKg: number;
    previousPeriodVolumeKg: number;
    percentageChange: number;
  };
  isLoading: boolean;
  accentColor: string;
};

export default function WorkoutsCard({
  workoutsPeriod,
  onPeriodChange,
  workoutsData,
  isLoading,
  accentColor,
}: WorkoutsCardProps) {
  const getComparisonText = (): string => {
    if (workoutsPeriod === 'total') return '';
    return workoutsPeriod === 'week' ? 'vs last week' : 'vs last month';
  };

  const getTrendIcon = () => {
    if (!workoutsData || workoutsPeriod === 'total') return null;
    
    const change = workoutsData.percentageChange;
    
    if (change > 0) {
      return <TrendingUp size={14} color={COLORS.success} strokeWidth={2.5} />;
    } else if (change < 0) {
      return <TrendingDown size={14} color={COLORS.error} strokeWidth={2.5} />;
    } else {
      return <Minus size={14} color={COLORS.textSecondary} strokeWidth={2.5} />;
    }
  };

  const getTrendColor = (): string => {
    if (!workoutsData || workoutsPeriod === 'total') return COLORS.textSecondary;
    
    const change = workoutsData.percentageChange;
    
    if (change > 0) return COLORS.success;
    if (change < 0) return COLORS.error;
    return COLORS.textSecondary;
  };

  console.log('[WorkoutsCard] Rendering with period:', workoutsPeriod);
  
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <View style={styles.segmentedControl} testID="workouts-tabs">
          <Pressable
            style={styles.segment}
            onPress={() => onPeriodChange('week')}
          >
            <Text
              style={[
                styles.segmentText,
                workoutsPeriod === 'week' && [
                  styles.segmentTextActive,
                  { color: accentColor },
                ],
              ]}
            >
              Week
            </Text>
          </Pressable>
          <Pressable
            style={styles.segment}
            onPress={() => onPeriodChange('month')}
          >
            <Text
              style={[
                styles.segmentText,
                workoutsPeriod === 'month' && [
                  styles.segmentTextActive,
                  { color: accentColor },
                ],
              ]}
            >
              Month
            </Text>
          </Pressable>
          <Pressable
            style={styles.segment}
            onPress={() => onPeriodChange('total')}
          >
            <Text
              style={[
                styles.segmentText,
                workoutsPeriod === 'total' && [
                  styles.segmentTextActive,
                  { color: accentColor },
                ],
              ]}
            >
              Total
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : (
          <>
            <View style={styles.mainValue}>
              <Text style={styles.workoutsValue}>
                {workoutsData?.workoutCount || 0}
                <Text style={styles.workoutsUnit}> sessions</Text>
              </Text>

            </View>

            {workoutsData && workoutsPeriod !== 'total' && (
              <View style={styles.comparison}>
                <View style={styles.trendContainer}>
                  {getTrendIcon()}
                  <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                    {workoutsData.percentageChange > 0 && '+'}
                    {workoutsData.percentageChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.comparisonText}>{getComparisonText()}</Text>
              </View>
            )}

            {workoutsPeriod === 'total' && (
              <View style={styles.totalInfo}>
                <Text style={styles.totalInfoText}>
                  {workoutsData?.totalVolumeKg.toLocaleString() || 0} kg total volume
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    fontWeight: '700' as const,
  },
  content: {
    minHeight: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  mainValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  workoutsValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  workoutsUnit: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },

  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  comparisonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  totalInfo: {
    marginTop: SPACING.xs,
  },
  totalInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
});
