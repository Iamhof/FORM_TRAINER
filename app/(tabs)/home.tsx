import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Target, TrendingUp, Check, Moon, Calendar as CalendarIcon, ChevronRight, Dumbbell, User, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { useUser } from '@/contexts/UserContext';
import { useSchedule } from '@/contexts/ScheduleContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type ProgrammeCardWithGlowProps = {
  accent: string;
  activeProgramme: any;
  router: any;
};

function ProgrammeCardWithGlow({ accent, activeProgramme, router }: ProgrammeCardWithGlowProps) {
  return (
    <Pressable onPress={() => router.push(`/programme/${activeProgramme.id}` as any)}>
      <View
        style={[
          styles.programmeCardEnhanced,
          Platform.OS !== 'web' && {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 12,
          },
          Platform.OS === 'web' && {
            boxShadow: `0 8px 32px ${accent}40`,
          },
        ]}
      >
        <View style={styles.programmeHeader}>
          <Text style={styles.programmeTitle}>{activeProgramme.name}</Text>
          <View style={[styles.activeBadge, { backgroundColor: `${accent}30` }]}>
            <Text style={[styles.activeBadgeText, { color: accent }]}>Active</Text>
          </View>
        </View>
        <Text style={styles.programmeSubtitle}>
          {activeProgramme.days} days per week • {activeProgramme.weeks} weeks
        </Text>

        <View style={styles.totalDaysRow}>
          <Text style={styles.totalDaysLabel}>Total Exercises</Text>
          <Text style={styles.totalDaysValue}>{activeProgramme.exercises?.length || 0}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { activeProgramme } = useProgrammes();
  const { user, stats, isFirstVisit } = useUser();
  const { schedule, scheduledCount, toggleDay, isLoading: scheduleLoading } = useSchedule();

  const safeSchedule = Array.isArray(schedule) && schedule.length === 7 ? schedule : Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    status: 'empty' as const,
    weekStart: new Date().toISOString().split('T')[0],
  }));

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topHeader}>
          <View style={styles.logoContainer}>
            <Dumbbell size={20} color={accent} strokeWidth={2.5} />
            <Text style={styles.logoText}>FORM</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconButton}>
              <User size={20} color={COLORS.textPrimary} strokeWidth={2} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Bell size={20} color={COLORS.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {isFirstVisit ? 'Welcome' : 'Welcome back'}, <Text style={[styles.greetingName, { color: accent }]}>{user?.name?.split(' ')[0] || 'User'}</Text>
              </Text>
              <Text style={styles.subtitle}>Ready to crush your goals today?</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>This Week</Text>
              {scheduledCount > 0 && (
                <Text style={styles.scheduledText}>{scheduledCount}/{activeProgramme?.days || 0} scheduled</Text>
              )}
            </View>
            <Pressable style={styles.viewCalendarButton}>
              <CalendarIcon size={16} color={accent} strokeWidth={2} />
              <Text style={[styles.viewCalendarText, { color: accent }]}>View Calendar</Text>
            </Pressable>
            
            {!activeProgramme ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  Create a programme to start scheduling your workouts
                </Text>
              </View>
            ) : (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  {(() => {
                    const actualScheduled = safeSchedule.filter((d) => d?.status === 'scheduled').length;
                    const completed = safeSchedule.filter((d) => d?.status === 'completed').length;
                    const total = actualScheduled + completed;
                    
                    if (total === 0) {
                      return <>
                        Tap days to schedule your <Text style={{ color: accent }}>{activeProgramme.days} weekly sessions</Text>
                      </>;
                    } else if (total < activeProgramme.days) {
                      return <>
                        <Text style={{ color: accent }}>{total}/{activeProgramme.days} sessions scheduled</Text> - Tap to schedule {activeProgramme.days - total} more
                      </>;
                    } else {
                      return <>
                        <Text style={{ color: accent }}>All {activeProgramme.days} sessions scheduled!</Text> Ready to start your week
                      </>;
                    }
                  })()}
                </Text>
              </View>
            )}

            <View style={styles.weekRow}>
              {DAY_LABELS.map((dayLabel, dayIndex) => {
                const item = safeSchedule[dayIndex];
                const isInteractive = activeProgramme !== null;

                return (
                  <Pressable
                    key={`day-${dayIndex}`}
                    style={styles.dayContainer}
                    onPress={() => {
                      console.log(`[Home] Day ${dayIndex} (${dayLabel}) clicked`);
                      console.log('[Home] Item data:', JSON.stringify(item));
                      console.log('[Home] Status:', item?.status || 'undefined');
                      console.log('[Home] isInteractive:', isInteractive);
                      console.log('[Home] scheduleLoading:', scheduleLoading);
                      if (isInteractive && !scheduleLoading && item) {
                        toggleDay(dayIndex);
                      } else {
                        console.log('[Home] Click blocked - interactive:', isInteractive, 'loading:', scheduleLoading, 'has item:', !!item);
                      }
                    }}
                    disabled={!isInteractive || scheduleLoading}
                  >
                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                    <View
                      style={[
                        styles.dayBox,
                        item?.status === 'completed' && { backgroundColor: accent },
                        item?.status === 'scheduled' && { backgroundColor: COLORS.warning },
                        (item?.status === 'rest' || item?.status === 'empty') && {
                          backgroundColor: 'transparent',
                          borderWidth: 1,
                          borderColor: COLORS.cardBorder,
                        },
                      ]}
                    >
                      {item?.status === 'completed' && (
                        <Check size={20} color={COLORS.background} strokeWidth={3} />
                      )}
                      {item?.status === 'scheduled' && (
                        <Check size={20} color={COLORS.background} strokeWidth={3} />
                      )}
                      {(item?.status === 'rest' || item?.status === 'empty') && (
                        <Moon size={16} color={COLORS.textTertiary} strokeWidth={2} />
                      )}
                    </View>
                    <Text style={styles.dayStatus}>
                      {item?.status === 'completed'
                        ? 'Done'
                        : item?.status === 'scheduled'
                        ? 'Workout'
                        : 'Rest'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: accent }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Scheduled</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.textTertiary }]} />
                <Text style={styles.legendText}>Rest Day</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Programme</Text>
              <Pressable style={styles.viewAllButton} onPress={() => router.push('/(tabs)/workouts')}>
                <Text style={[styles.viewAllText, { color: accent }]}>View All</Text>
                <ChevronRight size={16} color={accent} strokeWidth={2} />
              </Pressable>
            </View>
            
            {!activeProgramme ? (
              <Pressable onPress={() => router.push('/create-programme')}>
                <Card style={styles.programmeCard}>
                  <View style={styles.emptyProgramme}>
                    <Text style={styles.emptyProgrammeTitle}>No Active Programme</Text>
                    <Text style={styles.emptyProgrammeText}>
                      Create your first training programme to get started
                    </Text>
                    <View style={[styles.createButton, { backgroundColor: accent }]}>
                      <Text style={styles.createButtonText}>Create Programme</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ) : (
              <ProgrammeCardWithGlow accent={accent} activeProgramme={activeProgramme} router={router} />
            )}
          </View>

          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, styles.statCardLarge]}>
              <Text style={styles.statLabel}>Current Streak</Text>
              <View style={styles.statRow}>
                <Text style={styles.statValue}>{stats.currentStreak} days</Text>
                <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
                  <Flame size={28} color={accent} strokeWidth={2} fill={accent} />
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Workouts This Week</Text>
              <View style={styles.statRow}>
                <Text style={styles.statValue}>{stats.weekWorkouts}/{stats.weekTotal || activeProgramme?.days || 0}</Text>
                <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
                  <Target size={28} color={accent} strokeWidth={2} />
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Total Volume</Text>
              <View style={styles.statRow}>
                <Text style={styles.statValue}>{stats.totalVolume}k kg</Text>
                <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
                  <TrendingUp size={28} color={accent} strokeWidth={2} />
                </View>
              </View>
            </Card>
          </View>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  greetingName: {
    fontWeight: '800' as const,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    padding: SPACING.md,
  },
  statCardLarge: {
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  scheduledText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  viewCalendarText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  noticeBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  noticeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dayBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStatus: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  programmeCardEnhanced: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  programmeCard: {
    padding: SPACING.lg,
  },
  programmeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  programmeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  programmeSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  totalDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  totalDaysLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  totalDaysValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  emptyProgramme: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyProgrammeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyProgrammeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: SPACING.lg,
  },
  createButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.background,
  },
});
