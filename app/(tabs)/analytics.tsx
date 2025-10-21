import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Calendar, Target, Activity, Moon, BarChart3, Plus, Scale, Award } from 'lucide-react-native';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useBodyMetrics } from '@/contexts/BodyMetricsContext';
import BodyMetricsModal from '@/components/BodyMetricsModal';

type MetricTab = 'sessions' | 'volume' | 'completion';

export default function AnalyticsScreen() {
  const { accent } = useTheme();
  const { analyticsData, calculateCompletionPercentage, totalSessionsThisMonth, totalVolumeThisMonth } = useAnalytics();
  const { latestMetrics, personalRecords } = useBodyMetrics();
  const [selectedMetric, setSelectedMetric] = useState<MetricTab>('sessions');
  const [showBodyMetricsModal, setShowBodyMetricsModal] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

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
      return `${value.toLocaleString()} kg`;
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

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.statValue}>{totalVolumeThisMonth.toLocaleString()}</Text>
              <Text style={styles.statSubtext}>kg this month</Text>
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
                style={[styles.tab, selectedMetric === 'sessions' && { backgroundColor: accent }]}
                onPress={() => setSelectedMetric('sessions')}
              >
                <Text style={[styles.tabText, selectedMetric === 'sessions' && { color: COLORS.textPrimary, fontWeight: '600' as const }]}>
                  Sessions
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, selectedMetric === 'volume' && { backgroundColor: accent }]}
                onPress={() => setSelectedMetric('volume')}
              >
                <Text style={[styles.tabText, selectedMetric === 'volume' && { color: COLORS.textPrimary, fontWeight: '600' as const }]}>
                  Volume
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, selectedMetric === 'completion' && { backgroundColor: accent }]}
                onPress={() => setSelectedMetric('completion')}
              >
                <Text style={[styles.tabText, selectedMetric === 'completion' && { color: COLORS.textPrimary, fontWeight: '600' as const }]}>
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Body Metrics</Text>
              <Pressable
                style={[styles.addButton, { backgroundColor: accent }]}
                onPress={() => setShowBodyMetricsModal(true)}
              >
                <Plus size={18} color={COLORS.textPrimary} strokeWidth={2.5} />
              </Pressable>
            </View>

            {latestMetrics ? (
              <View style={styles.metricsGrid}>
                {latestMetrics.weight && (
                  <Card style={styles.metricCard}>
                    <View style={[styles.metricIconBox, { backgroundColor: `${COLORS.accents.blue}20` }]}>
                      <Scale size={20} color={COLORS.accents.blue} strokeWidth={2} />
                    </View>
                    <Text style={styles.metricValue}>{latestMetrics.weight} kg</Text>
                    <Text style={styles.metricLabel}>Weight</Text>
                  </Card>
                )}
                {latestMetrics.muscle_mass && (
                  <Card style={styles.metricCard}>
                    <View style={[styles.metricIconBox, { backgroundColor: `${accent}20` }]}>
                      <Activity size={20} color={accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.metricValue}>{latestMetrics.muscle_mass} kg</Text>
                    <Text style={styles.metricLabel}>Muscle Mass</Text>
                  </Card>
                )}
                {latestMetrics.body_fat_percentage && (
                  <Card style={styles.metricCard}>
                    <View style={[styles.metricIconBox, { backgroundColor: `${COLORS.accents.orange}20` }]}>
                      <Target size={20} color={COLORS.accents.orange} strokeWidth={2} />
                    </View>
                    <Text style={styles.metricValue}>{latestMetrics.body_fat_percentage}%</Text>
                    <Text style={styles.metricLabel}>Body Fat</Text>
                  </Card>
                )}
              </View>
            ) : (
              <Card style={styles.emptyMetricsCard}>
                <Text style={styles.emptyMetricsText}>No body metrics logged yet</Text>
                <Pressable
                  style={[styles.logMetricsButton, { backgroundColor: accent }]}
                  onPress={() => setShowBodyMetricsModal(true)}
                >
                  <Plus size={16} color={COLORS.textPrimary} strokeWidth={2.5} />
                  <Text style={styles.logMetricsButtonText}>Log Metrics</Text>
                </Pressable>
              </Card>
            )}
          </View>

          {personalRecords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Records</Text>
              {personalRecords.slice(0, 5).map((pr, index) => (
                <Card key={index} style={styles.prCard}>
                  <View style={styles.prHeader}>
                    <View style={styles.prTitleRow}>
                      <Award size={18} color={accent} strokeWidth={2} />
                      <Text style={styles.prExercise}>{pr.exercise_id}</Text>
                    </View>
                    <Text style={styles.prWeight}>{pr.weight} kg</Text>
                  </View>
                  <View style={styles.prDetails}>
                    <Text style={styles.prReps}>{pr.reps} reps</Text>
                    <Text style={styles.prDate}>{new Date(pr.date).toLocaleDateString()}</Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BodyMetricsModal
        visible={showBodyMetricsModal}
        onClose={() => setShowBodyMetricsModal(false)}
      />
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    padding: SPACING.md,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyMetricsCard: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyMetricsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  logMetricsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
  },
  logMetricsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  prCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  prTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  prWeight: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  prDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prReps: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  prDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
