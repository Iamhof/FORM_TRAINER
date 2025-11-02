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

  const getPeriodLabel = (): string => {
    switch (volumePeriod) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'total':
        return 'All Time';
      default:
        return 'This Week';
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Volume</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segment,
              volumePeriod === 'week' && [
                styles.segmentActive,
                { backgroundColor: accentColor },
              ],
            ]}
            onPress={() => onPeriodChange('week')}
          >
            <Text
              style={[
                styles.segmentText,
                volumePeriod === 'week' && styles.segmentTextActive,
              ]}
            >
              Week
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              volumePeriod === 'month' && [
                styles.segmentActive,
                { backgroundColor: accentColor },
              ],
            ]}
            onPress={() => onPeriodChange('month')}
          >
            <Text
              style={[
                styles.segmentText,
                volumePeriod === 'month' && styles.segmentTextActive,
              ]}
            >
              Month
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              volumePeriod === 'total' && [
                styles.segmentActive,
                { backgroundColor: accentColor },
              ],
            ]}
            onPress={() => onPeriodChange('total')}
          >
            <Text
              style={[
                styles.segmentText,
                volumePeriod === 'total' && styles.segmentTextActive,
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
              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>{getPeriodLabel()}</Text>
              </View>
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

            {volumePeriod === 'total' && (
              <View style={styles.totalInfo}>
                <Text style={styles.totalInfoText}>
                  {volumeData?.workoutCount || 0} workouts completed
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
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBorder,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
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
  periodBadge: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
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
