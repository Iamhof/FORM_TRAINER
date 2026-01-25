import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Dumbbell, BookOpen, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/Card';
import GlowCard from '@/components/GlowCard';
import ScreenState from '@/components/ScreenState';
import { COLORS, SPACING, BOTTOM_NAV_HEIGHT } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';

type ProgrammeCardWithGlowProps = {
  accent: string;
  activeProgramme: any;
  router: any;
};

function ProgrammeCardWithGlow({ accent, activeProgramme, router }: ProgrammeCardWithGlowProps) {
  return (
    <View style={styles.cardContainer}>
      <Pressable onPress={() => router.push(`/programme/${activeProgramme.id}` as any)}>
        <GlowCard glowColor={accent}>
          <View style={styles.programmeCardEnhanced}>
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
        </GlowCard>
      </Pressable>
    </View>
  );
}

export default function DashboardScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { activeProgramme, programmes, workoutHistory } = useProgrammes();
  const insets = useSafeAreaInsets();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

  const recentWorkouts = useMemo(() => {
    return workoutHistory.slice(0, 5);
  }, [workoutHistory]);

  const handleStartWorkout = () => {
    if (activeProgramme) {
      // Navigate to programme sessions list
      router.push(`/programme/${activeProgramme.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your Training</Text>
            <Text style={styles.subtitle}>Build strength, track progress</Text>
          </View>
        </View>

        {/* Active Programme Section */}
        {activeProgramme ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Programme</Text>
            </View>
            <ProgrammeCardWithGlow accent={accent} activeProgramme={activeProgramme} router={router} />
            
            {/* Quick Start Workout Button */}
            <Pressable
              style={[styles.startButton, { backgroundColor: accent }]}
              onPress={handleStartWorkout}
            >
              <Dumbbell size={20} color={COLORS.textPrimary} strokeWidth={2.5} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Card style={styles.emptyProgrammeCard}>
              <ScreenState
                icon={<BookOpen size={22} color={accent} strokeWidth={2} />}
                title="No Active Programme"
                description="Create your first training programme to get started."
                actionLabel="Create programme"
                onActionPress={() => router.push('/create-programme')}
                accentColor={accent}
                testID="home-empty-programme"
              />
            </Card>
          </View>
        )}

        {/* All Programmes Section */}
        {programmes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Programmes</Text>
              <Pressable 
                style={styles.viewAllButton}
                onPress={() => router.push('/workouts')}
              >
                <Text style={[styles.viewAllText, { color: accent }]}>View All</Text>
                <ChevronRight size={16} color={accent} strokeWidth={2.5} />
              </Pressable>
            </View>
            
            {programmes.slice(0, 3).map((programme: any) => (
              <Pressable
                key={programme.id}
                onPress={() => router.push(`/programme/${programme.id}` as any)}
              >
                <Card style={styles.programmeCard}>
                  <View style={styles.programmeCardContent}>
                    <View>
                      <Text style={styles.programmeName}>{programme.name}</Text>
                      <Text style={styles.programmeDetails}>
                        {programme.days} days • {programme.weeks} weeks
                      </Text>
                    </View>
                    {programme.id === activeProgramme?.id && (
                      <View style={[styles.activeIndicator, { backgroundColor: accent }]} />
                    )}
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* Recent Workouts Section */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <Pressable 
                style={styles.viewAllButton}
                onPress={() => router.push('/workouts')}
              >
                <Text style={[styles.viewAllText, { color: accent }]}>View All</Text>
                <ChevronRight size={16} color={accent} strokeWidth={2.5} />
              </Pressable>
            </View>
            
            {recentWorkouts.map((workout: any, index: number) => {
              const workoutDate = new Date(workout.completed_at || workout.created_at);
              const formattedDate = workoutDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              
              return (
                <Card key={workout.id || index} style={styles.workoutCard}>
                  <View style={styles.workoutCardContent}>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.programme_name || 'Workout'}</Text>
                      <Text style={styles.workoutDate}>{formattedDate}</Text>
                    </View>
                    <View style={styles.workoutStats}>
                      <Text style={styles.workoutStat}>
                        {workout.exercises_count || 0} exercises
                      </Text>
                      {workout.total_volume && (
                        <Text style={styles.workoutStat}>
                          {Math.round(workout.total_volume)} kg
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!activeProgramme && programmes.length === 0 && (
          <View style={styles.emptyState}>
            <Card style={styles.emptyCard}>
              <ScreenState
                icon={<Plus size={32} color={accent} strokeWidth={2} />}
                title="Welcome!"
                description="Get started by creating your first training programme."
                actionLabel="Create Programme"
                onActionPress={() => router.push('/create-programme')}
                accentColor={accent}
                testID="home-welcome"
              />
            </Card>
          </View>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardContainer: {
    marginBottom: SPACING.md,
  },
  programmeCardEnhanced: {
    padding: SPACING.lg,
  },
  programmeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  programmeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  programmeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  totalDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalDaysLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalDaysValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  programmeCard: {
    marginBottom: SPACING.sm,
  },
  programmeCardContent: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programmeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  programmeDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workoutCard: {
    marginBottom: SPACING.sm,
  },
  workoutCardContent: {
    padding: SPACING.md,
  },
  workoutInfo: {
    marginBottom: SPACING.sm,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  workoutDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  workoutStat: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyCard: {
    padding: SPACING.xl,
  },
  emptyProgrammeCard: {
    padding: SPACING.xl,
  },
});
