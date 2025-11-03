import React from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';

type VolumePeriod = 'week' | 'month' | 'total';

type VolumeCardProps = {
  volumePeriod: VolumePeriod;
  onPeriodChange: (period: VolumePeriod) => void;
  volumeData?: {
    totalVolumeKg: number;
    workoutCount: number;
    previousPeriodVolumeKg: number;
    percentageChange: number;
  };
  isLoading: boolean;
  accentColor: string;
};

export default function VolumeCard({
  volumePeriod,
  onPeriodChange,
  volumeData,
  isLoading,
  accentColor,
}: VolumeCardProps) {
  const formatVolume = (volume: number): string => {
    return volume.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getComparisonText = (): string => {
    if (volumePeriod === 'total') return '';
    return volumePeriod === 'week' ? 'vs last week' : 'vs last month';
  };

  const getTrendIcon = () => {
    if (!volumeData || volumePeriod === 'total') return null;
    
    const change = volumeData.percentageChange;
    
    if (change > 0) {
      return <TrendingUp size={16} color={COLORS.success} strokeWidth={2.5} />;
    } else if (change < 0) {
      return <TrendingDown size={16} color={COLORS.error} strokeWidth={2.5} />;
    } else {
      return <Minus size={16} color={COLORS.textSecondary} strokeWidth={2.5} />;
    }
  };

  const getTrendColor = (): string => {
    if (!volumeData || volumePeriod === 'total') return COLORS.textSecondary;
    
    const change = volumeData.percentageChange;
    
    if (change > 0) return COLORS.success;
    if (change < 0) return COLORS.error;
    return COLORS.textSecondary;
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volume</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            style={styles.segment}
            onPress={() => onPeriodChange('week')}
          >
            <Text
              style={[
                styles.segmentText,
                volumePeriod === 'week' && [
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
                volumePeriod === 'month' && [
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
                volumePeriod === 'total' && [
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
              <Text style={styles.volumeValue}>
                {formatVolume(volumeData?.totalVolumeKg || 0)}
                <Text style={styles.volumeUnit}> kg</Text>
              </Text>

            </View>

            {volumeData && volumePeriod !== 'total' && (
              <View style={styles.comparison}>
                <View style={styles.trendContainer}>
                  {getTrendIcon()}
                  <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                    {volumeData.percentageChange > 0 && '+'}
                    {volumeData.percentageChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.comparisonText}>{getComparisonText()}</Text>
              </View>
            )}

            {volumePeriod === 'total' && volumeData && volumeData.workoutCount > 0 && (
              <View style={styles.totalInfo}>
                <Text style={styles.totalInfoText}>
                  {volumeData.workoutCount} workouts completed
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
    minHeight: 100,
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
  volumeValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  volumeUnit: {
    fontSize: 24,
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
    fontSize: 16,
    fontWeight: '700' as const,
  },
  comparisonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalInfo: {
    marginTop: SPACING.xs,
  },
  totalInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
});
