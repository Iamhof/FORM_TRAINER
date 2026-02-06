import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Dimensions, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, BarChart3, Check, ChevronRight, Lock } from 'lucide-react-native';
import Card from '@/components/Card';
import Button from '@/components/Button';

import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { supabase } from '@/lib/supabase';
import { useExercises } from '@/hooks/useExercises';
import { logger } from '@/lib/logger';

export default function ProgrammeOverviewScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programmes, isLoading: programmesLoading, isSessionCompleted, isWeekUnlocked } = useProgrammes();
  const { data: allExercises = [] } = useExercises();
  
  const programmeId = params.id as string;
  const programme = programmes.find(p => p.id === programmeId);
  
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  const weekScrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const [hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek] = useState(false);
  const [scrollViewReady, setScrollViewReady] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (!programmeId) return;

    try {
      logger.debug('[ProgrammeOverview] Loading workouts for programme:', programmeId);
      setWorkoutsLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('programme_id', programmeId)
        .order('completed_at', { ascending: false });

      if (error) {
        logger.error('[ProgrammeOverview] Error loading workouts:', error);
        setWorkouts([]);
      } else {
        logger.debug('[ProgrammeOverview] Loaded workouts:', data?.length || 0);
        setWorkouts(data || []);
      }
    } catch (error) {
      logger.error('[ProgrammeOverview] Failed to load workouts:', error);
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
      logger.debug('[ProgrammeOverview] Screen focused, refreshing workouts');
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

    const sessionsByWeek: Array<{
      week: number;
      sessions: Array<{
        id: string;
        name: string;
        day: number;
        week: number;
        exercises: { name: string; sets: number; reps: string; rest: number }[];
        completed: boolean;
        dayBadge: string;
      }>;
    }> = [];

    for (let week = 1; week <= programme.weeks; week++) {
      const weekSessions = [];
      for (let day = 1; day <= programme.days; day++) {
        const dayExercises = exercisesByDay.get(day) || [];
        const isCompleted = isSessionCompleted(programmeId, day, week);
        
        weekSessions.push({
          id: `${programmeId}:${day}:${week}`,
          name: getDayName(day, programme.days),
          day,
          week,
          exercises: dayExercises.map(ex => {
            const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
            return {
              name: exerciseData?.name || 'Unknown Exercise',
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
            };
          }),
          completed: isCompleted,
          dayBadge: `Day ${day}`,
        });
      }
      sessionsByWeek.push({ week, sessions: weekSessions });
    }

    const totalSessions = programme.days * programme.weeks;
    const completedSessions = workoutsList.length;

    let calculatedCurrentWeek = 0;
    for (let weekIndex = 0; weekIndex < sessionsByWeek.length; weekIndex++) {
      const weekData = sessionsByWeek[weekIndex];
      const hasUncompletedSession = weekData.sessions.some(session => !session.completed);
      
      if (hasUncompletedSession) {
        calculatedCurrentWeek = weekIndex;
        logger.debug('[ProgrammeOverview] First uncompleted session found in week:', weekData.week);
        break;
      }
    }

    logger.debug('[ProgrammeOverview] Sessions:', {
      total: totalSessions,
      completed: completedSessions,
      progress: Math.round((completedSessions / totalSessions) * 100),
      calculatedCurrentWeek: calculatedCurrentWeek + 1,
    });

    return {
      ...programme,
      frequency: programme.days,
      sessionsByWeek,
      progress: {
        completedSessions,
        totalSessions,
      },
      calculatedCurrentWeek,
    };
  }, [programme, workouts, programmeId, isSessionCompleted, allExercises]);

  useEffect(() => {
    if (transformedProgramme && transformedProgramme.calculatedCurrentWeek !== undefined && !hasScrolledToCurrentWeek) {
      const calculatedWeek = transformedProgramme.calculatedCurrentWeek;
      logger.debug('[ProgrammeOverview] Auto-setting current week to:', calculatedWeek + 1);
      setCurrentWeek(calculatedWeek);
    }
  }, [transformedProgramme?.calculatedCurrentWeek, hasScrolledToCurrentWeek]);

  useEffect(() => {
    if (scrollViewReady && !hasScrolledToCurrentWeek && transformedProgramme?.calculatedCurrentWeek !== undefined) {
      const calculatedWeek = transformedProgramme.calculatedCurrentWeek;
      logger.debug('[ProgrammeOverview] Scrolling to current week:', calculatedWeek + 1);
      
      setTimeout(() => {
        weekScrollRef.current?.scrollTo({ 
          x: calculatedWeek * screenWidth, 
          animated: false 
        });
        setHasScrolledToCurrentWeek(true);
      }, 300);
    }
  }, [scrollViewReady, hasScrolledToCurrentWeek, transformedProgramme?.calculatedCurrentWeek, screenWidth]);

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

  const currentWeekData = transformedProgramme.sessionsByWeek[currentWeek];
  const completedInCurrentWeek = currentWeekData?.sessions.filter(s => s.completed).length || 0;

  const handleWeekDotPress = (weekIndex: number) => {
    setCurrentWeek(weekIndex);
    weekScrollRef.current?.scrollTo({ x: weekIndex * screenWidth, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newWeekIndex = Math.round(offsetX / screenWidth);
    if (newWeekIndex !== currentWeek && newWeekIndex >= 0 && newWeekIndex < transformedProgramme.sessionsByWeek.length) {
      setCurrentWeek(newWeekIndex);
    }
  };

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
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{transformedProgramme.name}</Text>
            <Text style={styles.subtitle}>{transformedProgramme.frequency} days per week</Text>
          </View>

          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>Week {currentWeek + 1} of {transformedProgramme.weeks}</Text>
                <Text style={styles.progressPercentage}>{overallProgress}%</Text>
              </View>
              <BarChart3 size={32} color={accent} strokeWidth={2} />
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${overallProgress}%`, backgroundColor: accent },
                ]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              {transformedProgramme.progress.completedSessions} of {transformedProgramme.progress.totalSessions} sessions • {completedInCurrentWeek} of {currentWeekData?.sessions.length || 0} this week
            </Text>
          </Card>

          <View style={styles.weekTimeline}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekDotsContainer}
            >
              {transformedProgramme.sessionsByWeek.map((weekData, index) => {
                const weekCompleted = weekData.sessions.every(s => s.completed);
                const weekPartial = weekData.sessions.some(s => s.completed) && !weekCompleted;
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleWeekDotPress(index)}
                    style={styles.weekDotWrapper}
                  >
                    <View
                      style={[
                        styles.weekDot,
                        index === currentWeek && styles.weekDotActive,
                        weekCompleted && { backgroundColor: accent },
                        weekPartial && { backgroundColor: `${accent}50` },
                      ]}
                    >
                      {weekCompleted && <Check size={12} color={COLORS.background} strokeWidth={3} />}
                    </View>
                    <Text style={[
                      styles.weekDotLabel,
                      index === currentWeek && { color: accent, fontWeight: '700' as const },
                    ]}>W{index + 1}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>



        <ScrollView
          ref={weekScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.weekScroller}
          onLayout={() => {
            logger.debug('[ProgrammeOverview] ScrollView layout complete');
            setScrollViewReady(true);
          }}
        >
          {transformedProgramme.sessionsByWeek.map((weekData, weekIndex) => (
            <ScrollView
              key={weekIndex}
              style={[styles.weekPage, { width: screenWidth }]}
              contentContainerStyle={styles.weekPageContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Week {weekData.week}</Text>
                {weekIndex > 0 && (
                  <Pressable
                    onPress={() => handleWeekDotPress(weekIndex - 1)}
                    style={styles.weekNav}
                  >
                    <ChevronLeft size={20} color={accent} strokeWidth={2.5} />
                  </Pressable>
                )}
                {weekIndex < transformedProgramme.sessionsByWeek.length - 1 && (
                  <Pressable
                    onPress={() => handleWeekDotPress(weekIndex + 1)}
                    style={[styles.weekNav, { marginLeft: 8 }]}
                  >
                    <ChevronRight size={20} color={accent} strokeWidth={2.5} />
                  </Pressable>
                )}
              </View>

              {(() => {
                const completedSessions = weekData.sessions.filter(s => s.completed);
                const incompleteSessions = weekData.sessions.filter(s => !s.completed);
                
                return (
                  <>
                    {incompleteSessions.map((session) => (
                      <Card key={session.id} style={styles.workoutCard}>
                        <View style={styles.workoutHeader}>
                          <View style={styles.workoutTitleRow}>
                            <Text style={styles.workoutName}>{session.name}</Text>
                          </View>
                          <View style={[
                            styles.dayBadge,
                            { backgroundColor: `${accent}20` }
                          ]}>
                            <Text style={[styles.dayBadgeText, { color: accent }]}>{session.dayBadge}</Text>
                          </View>
                        </View>
                        <Text style={styles.exerciseCount}>{session.exercises.length} exercises</Text>

                        <View style={styles.exerciseList}>
                          {session.exercises.map((exercise, exerciseIndex) => (
                            <View key={exerciseIndex} style={styles.exerciseRow}>
                              <Text style={styles.exerciseName}>{exercise.name}</Text>
                              <Text style={styles.exerciseSets}>{exercise.sets} × {exercise.reps}</Text>
                            </View>
                          ))}
                        </View>

                        {isWeekUnlocked(programmeId, session.week) ? (
                          <Button
                            title="▶ Start Session"
                            onPress={() => router.push(`/session/${session.id}` as any)}
                            variant="primary"
                            style={styles.startButton}
                          />
                        ) : (
                          <View style={styles.lockedButton}>
                            <Lock size={16} color={COLORS.textTertiary} strokeWidth={2.5} />
                            <Text style={styles.lockedButtonText}>
                              Complete Week {session.week - 1} first
                            </Text>
                          </View>
                        )}
                      </Card>
                    ))}

                    {completedSessions.length > 0 && (
                      <>
                        <Text style={styles.sectionHeading}>Completed</Text>
                        {completedSessions.map((session) => (
                          <Card key={session.id} style={StyleSheet.flatten([
                            styles.workoutCard,
                            styles.completedCard,
                          ])}>
                            <View style={styles.workoutHeader}>
                              <View style={styles.workoutTitleRow}>
                                <Text style={[
                                  styles.workoutName,
                                  styles.completedText,
                                ]}>{session.name}</Text>
                                <View style={[styles.checkmark, { backgroundColor: accent }]}>
                                  <Check size={16} color={COLORS.background} strokeWidth={3} />
                                </View>
                              </View>
                              <View style={[
                                styles.dayBadge,
                                { backgroundColor: `${accent}40` }
                              ]}>
                                <Text style={[styles.dayBadgeText, { color: accent }]}>{session.dayBadge}</Text>
                              </View>
                            </View>
                            <Text style={[
                              styles.exerciseCount,
                              styles.completedText,
                            ]}>{session.exercises.length} exercises</Text>

                            <View style={styles.exerciseList}>
                              {session.exercises.map((exercise, exerciseIndex) => (
                                <View key={exerciseIndex} style={styles.exerciseRow}>
                                  <Text style={[
                                    styles.exerciseName,
                                    styles.completedText,
                                  ]}>{exercise.name}</Text>
                                  <Text style={[
                                    styles.exerciseSets,
                                    styles.completedText,
                                  ]}>{exercise.sets} × {exercise.reps}</Text>
                                </View>
                              ))}
                            </View>

                            <View style={[styles.completedBadge, { backgroundColor: `${accent}20` }]}>
                              <Check size={18} color={accent} strokeWidth={2.5} />
                              <Text style={[styles.completedBadgeText, { color: accent }]}>Completed</Text>
                            </View>
                          </Card>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </ScrollView>
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
  headerSection: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  titleContainer: {
    marginBottom: SPACING.md,
  },
  weekScroller: {
    flex: 1,
  },
  weekPage: {
    flex: 1,
  },
  weekPageContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  weekTimeline: {
    marginTop: SPACING.md,
  },
  weekDotsContainer: {
    flexDirection: 'row' as const,
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  weekDotWrapper: {
    alignItems: 'center' as const,
    gap: 4,
  },
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  weekDotActive: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  weekDotLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  weekHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  weekTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    flex: 1,
  },
  weekNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressCard: {
    padding: SPACING.md,
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.xs,
  },
  progressTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  workoutCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  workoutHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: SPACING.xs,
  },
  workoutTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
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
  lockedButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.cardBorder,
    marginTop: SPACING.sm,
    opacity: 0.6,
  },
  lockedButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textTertiary,
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
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
