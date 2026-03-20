import { useRouter } from 'expo-router';
import { BookOpen, Plus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '@/components/Card';
import ActiveProgrammeCard from '@/components/dashboard/ActiveProgrammeCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import DashboardWeekStrip from '@/components/dashboard/DashboardWeekStrip';
import ExerciseLibraryCard from '@/components/dashboard/ExerciseLibraryCard';
import { MuscleHeatmapCard } from '@/components/dashboard/MuscleHeatmapCard';
import NewWeekBanner from '@/components/dashboard/NewWeekBanner';
import { ScreenState } from '@/components/ScreenState';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { getWeekDates } from '@/lib/date-utils';

export default function DashboardScreen() {
  const { accent } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const {
    activeProgramme,
    programmes,
    isLoading: isProgrammesLoading,
    getProgrammeProgress,
    getNextSession,
    getCurrentWeekAndDay,
  } = useProgrammes();
  const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();
  const { schedule, scheduledCount, canScheduleMore, currentWeekStart, toggleDay } = useSchedule();
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

  const handleCreateProgramme = () => {
    if (programmes.length >= 1 && !isSubscriptionLoading && !isPremium) {
      router.push('/paywall' as any);
      return;
    }
    router.push('/create-programme');
  };

  // Derived data for the active programme card
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  const progress = useMemo(
    () => (activeProgramme ? getProgrammeProgress(activeProgramme.id) : null),
    [activeProgramme, getProgrammeProgress]
  );

  const nextSession = useMemo(
    () => (activeProgramme ? getNextSession(activeProgramme.id) : null),
    [activeProgramme, getNextSession]
  );

  const currentWeekAndDay = useMemo(
    () => (activeProgramme ? getCurrentWeekAndDay(activeProgramme.id) : null),
    [activeProgramme, getCurrentWeekAndDay]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Branded Header */}
        <DashboardHeader
          accent={accent}
          level={user?.currentLevel ?? 1}
          onProfilePress={() => router.push('/profile')}
        />

        {isProgrammesLoading ? (
          <DashboardSkeleton />
        ) : activeProgramme ? (
          <>
            {/* Week Setup Banner (when sessions remain to schedule) */}
            {canScheduleMore && (
              <NewWeekBanner
                scheduledCount={scheduledCount}
                targetCount={activeProgramme.days}
                onPress={() => router.push(`/programme/${activeProgramme.id}` as any)}
                accent={accent}
              />
            )}

            {/* Weekly Tracker Strip */}
            <DashboardWeekStrip
              schedule={schedule}
              accent={accent}
              weekDates={weekDates}
              scheduledCount={scheduledCount}
              targetCount={activeProgramme.days}
              onToggleDay={toggleDay}
              canScheduleMore={canScheduleMore}
            />

            {/* Active Programme Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CURRENT PLAN</Text>
              </View>
              {progress && currentWeekAndDay && (
                <ActiveProgrammeCard
                  programme={activeProgramme}
                  accent={accent}
                  progress={progress}
                  currentWeekAndDay={currentWeekAndDay}
                  nextSession={nextSession}
                  onPress={() => router.push(`/programme/${activeProgramme.id}` as any)}
                  onNextSession={(sessionId) => router.push(`/session/${sessionId}` as any)}
                />
              )}
            </View>

            {/* Muscle Activity Heatmap */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>MUSCLE ACTIVITY</Text>
              </View>
              <MuscleHeatmapCard
                accent={accent}
                isPremium={isPremium}
                onUpgrade={() => router.push('/paywall' as any)}
                onSeeMore={() => router.push('/(tabs)/progress' as any)}
              />
            </View>

            {/* Exercise Library */}
            <View style={styles.section}>
              <ExerciseLibraryCard
                accent={accent}
                onPress={() => router.push('/(tabs)/exercises' as any)}
              />
            </View>
          </>
        ) : (
          <>
            {/* Empty State */}
            {programmes.length === 0 ? (
              <View style={styles.emptyState}>
                <Card style={styles.emptyCard}>
                  <ScreenState
                    icon={<Plus size={32} color={accent} strokeWidth={2} />}
                    title="Welcome!"
                    description="Get started by creating your first training programme."
                    actionLabel="Create Programme"
                    onActionPress={handleCreateProgramme}
                    accentColor={accent}
                    testID="home-welcome"
                  />
                </Card>
              </View>
            ) : (
              <View style={styles.section}>
                <Card style={styles.emptyProgrammeCard}>
                  <ScreenState
                    icon={<BookOpen size={22} color={accent} strokeWidth={2} />}
                    title="No Active Programme"
                    description="Create your first training programme to get started."
                    actionLabel="Create programme"
                    onActionPress={handleCreateProgramme}
                    accentColor={accent}
                    testID="home-empty-programme"
                  />
                </Card>
              </View>
            )}

            {/* Muscle Activity Heatmap */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>MUSCLE ACTIVITY</Text>
              </View>
              <MuscleHeatmapCard
                accent={accent}
                isPremium={isPremium}
                onUpgrade={() => router.push('/paywall' as any)}
                onSeeMore={() => router.push('/(tabs)/progress' as any)}
              />
            </View>

            {/* Exercise Library (always visible) */}
            <View style={styles.section}>
              <ExerciseLibraryCard
                accent={accent}
                onPress={() => router.push('/(tabs)/exercises' as any)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyCard: {
    padding: SPACING.xl,
  },
  emptyProgrammeCard: {
    padding: SPACING.xl,
  },
});
