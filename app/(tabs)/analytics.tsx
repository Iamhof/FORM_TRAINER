import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Calendar, Target, Activity, Moon, BarChart3 } from 'lucide-react-native';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';

type MetricTab = 'sessions' | 'volume' | 'completion';

export default function AnalyticsScreen() {
  const { accent } = useTheme();
  const { analyticsData, calculateCompletionPercentage, totalSessionsThisMonth, totalVolumeThisMonth } = useAnalytics();
  const [selectedMetric, setSelectedMetric] = useState<MetricTab>('sessions');

  const getChartData = () => {
    switch (selectedMetric) {
      case 'sessions':
        return analyticsData.sessionsCompleted;
      case 'volume':
        return analyticsData.totalVolume;
      case 'completion':
        return analyticsData.completionRate;
      default:
        return analyticsData.sessionsCompleted;
    }
  };

  const getChartTitle = () => {
    switch (selectedMetric) {
      case 'sessions':
        return 'Sessions Completed';
      case 'volume':
        return 'Total Volume (kg)';
      case 'completion':
        return 'Completion Rate (%)';
      default:
        return 'Sessions Completed';
    }
  };

  const formatValue = (value: number) => {
    if (selectedMetric === 'volume') {
      return `${value}k`;
    }
    if (selectedMetric === 'completion') {
      return `${value}%`;
    }
    return value.toString();
  };

  const calculateTrend = (data: typeof analyticsData.sessionsCompleted) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const sessionsTrend = calculateTrend(analyticsData.sessionsCompleted);
  const volumeTrend = calculateTrend(analyticsData.totalVolume);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Track your progress and performance</Text>
          </View>
          <View style={[styles.iconContainer, { backgroundColor: `${accent}20` }]}>
            <BarChart3 size={24} color={accent} strokeWidth={2} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: `${accent}20` }]}>
                  <Target size={20} color={accent} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <Text style={styles.statValue}>{totalSessionsThisMonth}</Text>
              <Text style={styles.statSubtext}>sessions completed</Text>
              {sessionsTrend !== 0 && (
                <View style={styles.trendRow}>
                  {sessionsTrend > 0 ? (
                    <TrendingUp size={14} color={COLORS.success} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={14} color={COLORS.error} strokeWidth={2} />
                  )}
                  <Text style={[styles.trendText, { color: sessionsTrend > 0 ? COLORS.success : COLORS.error }]}>
                    {Math.abs(sessionsTrend)}% vs last month
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: `${COLORS.accents.purple}20` }]}>
                  <Activity size={20} color={COLORS.accents.purple} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
              <Text style={styles.statValue}>{totalVolumeThisMonth}k</Text>
              <Text style={styles.statSubtext}>kg moved this month</Text>
              {volumeTrend !== 0 && (
                <View style={styles.trendRow}>
                  {volumeTrend > 0 ? (
                    <TrendingUp size={14} color={COLORS.success} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={14} color={COLORS.error} strokeWidth={2} />
                  )}
                  <Text style={[styles.trendText, { color: volumeTrend > 0 ? COLORS.success : COLORS.error }]}>
                    {Math.abs(volumeTrend)}% vs last month
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: `${COLORS.accents.blue}20` }]}>
                  <Calendar size={20} color={COLORS.accents.blue} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
              <Text style={styles.statValue}>{calculateCompletionPercentage}%</Text>
              <Text style={styles.statSubtext}>sessions completed</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: `${COLORS.accents.teal}20` }]}>
                  <Moon size={20} color={COLORS.accents.teal} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Rest Days</Text>
              </View>
              <Text style={styles.statValue}>{analyticsData.restDays.thisMonth}</Text>
              <Text style={styles.statSubtext}>this month</Text>
            </Card>
          </View>

          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{getChartTitle()}</Text>
              <Text style={styles.chartSubtitle}>Last 6 months</Text>
            </View>

            <View style={styles.tabsContainer}>
              <Pressable
                style={[styles.tab, selectedMetric === 'sessions' && { backgroundColor: `${accent}20` }]}
                onPress={() => setSelectedMetric('sessions')}
              >
                <Text style={[styles.tabText, selectedMetric === 'sessions' && { color: accent, fontWeight: '600' as const }]}>
                  Sessions
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, selectedMetric === 'volume' && { backgroundColor: `${accent}20` }]}
                onPress={() => setSelectedMetric('volume')}
              >
                <Text style={[styles.tabText, selectedMetric === 'volume' && { color: accent, fontWeight: '600' as const }]}>
                  Volume
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, selectedMetric === 'completion' && { backgroundColor: `${accent}20` }]}
                onPress={() => setSelectedMetric('completion')}
              >
                <Text style={[styles.tabText, selectedMetric === 'completion' && { color: accent, fontWeight: '600' as const }]}>
                  Rate
                </Text>
              </Pressable>
            </View>

            <LineChart data={getChartData()} color={accent} height={200} formatValue={formatValue} />
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions Overview</Text>
            <Card style={styles.overviewCard}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: accent }]} />
                  <Text style={styles.overviewLabel}>Completed</Text>
                </View>
                <Text style={styles.overviewValue}>
                  {analyticsData.sessionsCompleted[analyticsData.sessionsCompleted.length - 1]?.value || 0}
                </Text>
              </View>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.overviewLabel}>Missed</Text>
                </View>
                <Text style={styles.overviewValue}>
                  {analyticsData.sessionsMissed[analyticsData.sessionsMissed.length - 1]?.value || 0}
                </Text>
              </View>
              <View style={[styles.overviewRow, styles.overviewRowLast]}>
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: COLORS.accents.teal }]} />
                  <Text style={styles.overviewLabel}>Rest Days</Text>
                </View>
                <Text style={styles.overviewValue}>{analyticsData.restDays.thisMonth}</Text>
              </View>
            </Card>
          </View>

          {analyticsData.exerciseProgress.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exercise Progress</Text>
              {analyticsData.exerciseProgress.map((exercise, index) => (
                <Card key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <View
                      style={[
                        styles.percentageBadge,
                        {
                          backgroundColor:
                            exercise.percentageIncrease > 0 ? `${COLORS.success}20` : `${COLORS.textSecondary}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.percentageText,
                          { color: exercise.percentageIncrease > 0 ? COLORS.success : COLORS.textSecondary },
                        ]}
                      >
                        {exercise.percentageIncrease > 0 ? '+' : ''}
                        {exercise.percentageIncrease}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exerciseStats}>
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatLabel}>Start</Text>
                      <Text style={styles.exerciseStatValue}>{exercise.startWeight} kg</Text>
                    </View>
                    <View style={styles.exerciseStatDivider} />
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatLabel}>Current</Text>
                      <Text style={[styles.exerciseStatValue, { color: accent }]}>{exercise.currentWeight} kg</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {analyticsData.exerciseProgress.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Exercise Data Yet</Text>
              <Text style={styles.emptyText}>
                Complete workouts to start tracking your exercise progress and see your strength gains over time.
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: SPACING.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  chartCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  overviewCard: {
    padding: SPACING.lg,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  overviewRowLast: {
    borderBottomWidth: 0,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  overviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500' as const,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  exerciseCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  percentageBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseStat: {
    flex: 1,
  },
  exerciseStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  exerciseStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  exerciseStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.md,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
