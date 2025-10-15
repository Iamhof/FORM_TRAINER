import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, BarChart3, Check } from 'lucide-react-native';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { supabase } from '@/lib/supabase';
import { EXERCISES } from '@/constants/exercises';

export default function ProgrammeOverviewScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programmes, isLoading: programmesLoading, isSessionCompleted } = useProgrammes();
  
  const programmeId = params.id as string;
  const programme = programmes.find(p => p.id === programmeId);
  
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    if (!programmeId) return;

    try {
      console.log('[ProgrammeOverview] Loading workouts for programme:', programmeId);
      setWorkoutsLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('programme_id', programmeId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('[ProgrammeOverview] Error loading workouts:', error);
        setWorkouts([]);
      } else {
        console.log('[ProgrammeOverview] Loaded workouts:', data?.length || 0);
        setWorkouts(data || []);
      }
    } catch (error) {
      console.error('[ProgrammeOverview] Failed to load workouts:', error);
      setWorkouts([]);
    } finally {
      setWorkoutsLoading(false);
    }
  }, [programmeId]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useFocusEffect(
    useCallback(() => {
      console.log('[ProgrammeOverview] Screen focused, refreshing workouts');
      loadWorkouts();
    }, [loadWorkouts])
  );

  const transformedProgramme = useMemo(() => {
    if (!programme) return null;

    const exercisesByDay = new Map<number, typeof programme.exercises>();
    programme.exercises.forEach(ex => {
      const dayExercises = exercisesByDay.get(ex.day) || [];
      dayExercises.push(ex);
      exercisesByDay.set(ex.day, dayExercises);
    });

    const workoutsList = workouts || [];

    const sessions: {
      id: string;
      name: string;
      day: number;
      week: number;
      exercises: { name: string; sets: number; reps: string; rest: number }[];
      completed: boolean;
      dayBadge: string;
    }[] = [];

    for (let week = 1; week <= programme.weeks; week++) {
      for (let day = 1; day <= programme.days; day++) {
        const dayExercises = exercisesByDay.get(day) || [];
        const isCompleted = isSessionCompleted(programmeId, day, week);
        
        sessions.push({
          id: `${programmeId}-${day}-${week}`,
          name: getDayName(day, programme.days),
          day,
          week,
          exercises: dayExercises.map(ex => {
            const exerciseData = EXERCISES.find(e => e.id === ex.exerciseId);
            return {
              name: exerciseData?.name || 'Unknown Exercise',
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
            };
          }),
          completed: isCompleted,
          dayBadge: `Week ${week}`,
        });
      }
    }

    const totalSessions = programme.days * programme.weeks;
    const completedSessions = workoutsList.length;

    console.log('[ProgrammeOverview] Sessions:', {
      total: totalSessions,
      completed: completedSessions,
      progress: Math.round((completedSessions / totalSessions) * 100),
    });

    return {
      ...programme,
      frequency: programme.days,
      sessions,
      progress: {
        completedSessions,
        totalSessions,
      },
    };
  }, [programme, workouts, programmeId, isSessionCompleted]);

  function getDayName(day: number, totalDays: number): string {
    if (totalDays === 2) {
      return day === 1 ? 'Upper Body' : 'Lower Body';
    } else if (totalDays === 3) {
      const names = ['Push', 'Pull', 'Legs'];
      return names[day - 1] || `Day ${day}`;
    } else if (totalDays === 4) {
      const names = ['Upper Body A', 'Lower Body A', 'Upper Body B', 'Lower Body B'];
      return names[day - 1] || `Day ${day}`;
    } else {
      return `Day ${day}`;
    }
  }
  
  if (programmesLoading || workoutsLoading) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!transformedProgramme) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <Text style={styles.errorText}>Programme not found</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  const overallProgress = transformedProgramme.progress.totalSessions > 0
    ? Math.round((transformedProgramme.progress.completedSessions / transformedProgramme.progress.totalSessions) * 100)
    : 0;

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitle: 'Programme Overview',
          headerTitleStyle: { fontSize: 16, fontWeight: '600' as const },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={COLORS.textPrimary} strokeWidth={2} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{transformedProgramme.name}</Text>
          <Text style={styles.subtitle}>{transformedProgramme.frequency} days per week</Text>

          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Overall Progress</Text>
              <BarChart3 size={24} color={accent} strokeWidth={2} />
            </View>
            <Text style={styles.progressPercentage}>{overallProgress}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${overallProgress}%`, backgroundColor: accent },
                ]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              {transformedProgramme.progress.completedSessions} of {transformedProgramme.progress.totalSessions} sessions completed
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>Training Split</Text>

          {transformedProgramme.sessions.map((session) => (
            <Card key={session.id} style={[
              styles.workoutCard,
              session.completed && styles.completedCard,
            ]}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleRow}>
                  <Text style={[
                    styles.workoutName,
                    session.completed && styles.completedText,
                  ]}>{session.name}</Text>
                  {session.completed && (
                    <View style={[styles.checkmark, { backgroundColor: accent }]}>
                      <Check size={16} color={COLORS.background} strokeWidth={3} />
                    </View>
                  )}
                </View>
                <View style={[
                  styles.dayBadge,
                  { backgroundColor: session.completed ? `${accent}40` : `${accent}20` }
                ]}>
                  <Text style={[styles.dayBadgeText, { color: accent }]}>{session.dayBadge}</Text>
                </View>
              </View>
              <Text style={[
                styles.exerciseCount,
                session.completed && styles.completedText,
              ]}>{session.exercises.length} exercises</Text>

              <View style={styles.exerciseList}>
                {session.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseRow}>
                    <Text style={[
                      styles.exerciseName,
                      session.completed && styles.completedText,
                    ]}>{exercise.name}</Text>
                    <Text style={[
                      styles.exerciseSets,
                      session.completed && styles.completedText,
                    ]}>{exercise.sets} × {exercise.reps}</Text>
                  </View>
                ))}
              </View>

              {session.completed ? (
                <View style={[styles.completedBadge, { backgroundColor: `${accent}20` }]}>
                  <Check size={18} color={accent} strokeWidth={2.5} />
                  <Text style={[styles.completedBadgeText, { color: accent }]}>Completed</Text>
                </View>
              ) : (
                <Button
                  title="▶ Start Session"
                  onPress={() => router.push(`/session/${session.id}` as any)}
                  variant="primary"
                  style={styles.startButton}
                />
              )}
            </Card>
          ))}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -8,
  },
  backText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  progressCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  workoutCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  exerciseCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  exerciseList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  exerciseSets: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  startButton: {
    marginTop: SPACING.sm,
  },
  completedCard: {
    opacity: 0.7,
  },
  completedText: {
    opacity: 0.6,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: SPACING.xs,
  },
  completedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  completedBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
