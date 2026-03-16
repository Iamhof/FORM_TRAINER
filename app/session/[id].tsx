import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/Card';
import RestTimerModal from '@/components/RestTimerModal';
import WorkoutCompleteModal, { WorkoutSummary } from '@/components/WorkoutCompleteModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useExercises } from '@/hooks/useExercises';
import { logger } from '@/lib/logger';
import { requireParam } from '@/lib/router-utils';
import { trpc } from '@/lib/trpc';

type SetData = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseData = {
  exerciseId: string;
  name: string;
  targetSets: number;
  rest: number;
  sets: SetData[];
};

export default function SessionScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = requireParam(params.id, 'session ID');
  const { programmes, refetch, isWeekUnlocked } = useProgrammes();
  const { data: allExercises = [], isLoading: exercisesLoading } = useExercises();
  const { user } = useUser();
  const { refetch: refetchAnalytics } = useAnalytics();
  const { loadSchedule } = useSchedule();
  const logWorkoutMutation = trpc.workouts.log.useMutation();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState<{
    programmeId: string;
    programmeName: string;
    day: number;
    week: number;
  } | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const sessionStartTime = useRef(Date.now());
  const hasSubmittedRef = useRef(false);
  const pagerRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;



  // Track if we've already initialized to prevent re-running on every allExercises change
  const hasInitialized = useRef(false);
  
  // Reset initialization flag when session ID changes to allow re-initialization for new sessions
  useEffect(() => {
    hasInitialized.current = false;
  }, [sessionId]);
  
  useEffect(() => {
    // Skip if already initialized for this session ID
    if (hasInitialized.current) {
      return;
    }

    // Wait for exercises to be available (not loading and has data)
    if (exercisesLoading || allExercises.length === 0) {
      logger.debug('[SessionScreen] Waiting for exercises to load...');
      return; // Don't initialize yet - wait for exercise data
    }

    // Session ID format: {programmeId}:{day}:{week}
    // Using colon delimiter to avoid conflicts with UUID programme IDs that contain dashes
    const parts = sessionId.split(':');
    if (parts.length !== 3) {
      logger.error('[SessionScreen] Invalid session ID format (expected format: programmeId:day:week):', sessionId);
      setIsLoading(false);
      return;
    }

    // Safe: Already validated parts.length === 3
    const programmeId = parts[0]!;
    const day = parseInt(parts[1]!, 10);
    const week = parseInt(parts[2]!, 10);

    // Validate that day and week are valid numbers
    if (isNaN(day) || isNaN(week) || day < 1 || week < 1) {
      logger.error('[SessionScreen] Invalid day or week in session ID:', { sessionId, day, week });
      setIsLoading(false);
      return;
    }

    logger.debug('[SessionScreen] Parsed session:', { programmeId, day, week });

    if (!isWeekUnlocked(programmeId, week)) {
      logger.warn('[SessionScreen] Week locked, redirecting back:', { programmeId, week });
      Alert.alert('Week Locked', `Complete all sessions in Week ${week - 1} first.`);
      router.back();
      return;
    }

    const programme = programmes.find(p => p.id === programmeId);
    if (!programme) {
      logger.error('[SessionScreen] Programme not found:', programmeId);
      setIsLoading(false);
      return;
    }

    const dayExercises = programme.exercises.filter(ex => ex.day === day);
    logger.debug('[SessionScreen] Found exercises for day', day, ':', dayExercises.length);
    logger.debug('[SessionScreen] Available exercises in library:', allExercises.length);

    const mappedExercises: ExerciseData[] = dayExercises.map(ex => {
      const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
      return {
        exerciseId: ex.exerciseId,
        name: exerciseData?.name || 'Unknown Exercise',
        targetSets: ex.sets,
        rest: ex.rest || 90,
        sets: Array.from({ length: ex.sets }, () => ({
          weight: '',
          reps: '',
          completed: false,
        })),
      };
    });

    setExercises(mappedExercises);
    setSessionData({
      programmeId,
      programmeName: programme.name,
      day,
      week,
    });
    setIsLoading(false);
    hasInitialized.current = true; // Mark as initialized
  }, [sessionId, programmes, allExercises, exercisesLoading, isWeekUnlocked, router]);

  const currentExercise = exercises[currentExerciseIndex];
  const globalProgress = useMemo(() => {
    const totalSetsAll = exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
    const completedSetsAll = exercises.reduce((sum, ex) =>
      sum + ex.sets.filter(s => s.completed).length, 0
    );
    return totalSetsAll > 0 ? (completedSetsAll / totalSetsAll) * 100 : 0;
  }, [exercises]);

  // Memoize headerLeft to prevent infinite re-renders from Stack.Screen options
  const headerLeft = useMemo(() => {
    return function HeaderLeftButton() {
      return (
        <Pressable onPress={() => router.back()} style={styles.closeButton} disabled={isSaving}>
          <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          <Text style={styles.closeText}>End Workout</Text>
        </Pressable>
      );
    };
  }, [router, isSaving]);

  // Memoize navigation options to prevent infinite loop
  const screenOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: COLORS.background },
    headerTintColor: COLORS.textPrimary,
    headerTitle: () => (
      <Pressable onPress={() => setShowExerciseList(true)} style={styles.headerTitleButton}>
        <Text style={{ fontSize: 14, fontWeight: '500' as const, color: COLORS.textSecondary }}>
          Exercise {currentExerciseIndex + 1} of {exercises.length} {'\u25BC'}
        </Text>
      </Pressable>
    ),
    headerLeft,
  }), [currentExerciseIndex, exercises.length, headerLeft]);

  const currentExerciseSetsCompleted = useMemo(() => {
    if (!currentExercise) return false;
    return currentExercise.sets.every(set => set.completed);
  }, [currentExercise]);

  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const handleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const currentSet = exercises[exerciseIndex]?.sets[setIndex];
    if (!currentSet || currentSet.completed || !currentSet.weight || !currentSet.reps) return;

    setExercises(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => {
          if (j !== setIndex) return s;
          return { ...s, completed: true };
        }),
      };
    }));

    const exercise = exercises[exerciseIndex];
    if (!exercise) return;
    const isLastSetOfExercise = setIndex === exercise.sets.length - 1;
    const allSetsWillBeCompleted = exercise.sets.every(
      (s, j) => j === setIndex ? true : s.completed
    );

    logger.debug('[SessionScreen] Set completed:', {
      setIndex,
      isLastSetOfExercise,
      allSetsCompleted: allSetsWillBeCompleted,
      exerciseIndex,
      currentExerciseIndex
    });

    if (!isLastSetOfExercise || !allSetsWillBeCompleted) {
      setShowRestTimer(true);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      logger.debug('[SessionScreen] Moving to next exercise:', nextIndex);
      setCurrentExerciseIndex(nextIndex);
      pagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    }
  };

  const jumpToExercise = (index: number) => {
    if (index >= 0 && index < exercises.length) {
      setCurrentExerciseIndex(index);
      pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  const handlePagerScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);
    if (newIndex !== currentExerciseIndex && newIndex >= 0 && newIndex < exercises.length) {
      setCurrentExerciseIndex(newIndex);
    }
  };

  const handleWeightChange = (exerciseIndex: number, setIndex: number, value: string) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => {
          if (j !== setIndex) return s;
          return { ...s, weight: value };
        }),
      };
    }));
  };

  const handleRepsChange = (exerciseIndex: number, setIndex: number, value: string) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => {
          if (j !== setIndex) return s;
          return { ...s, reps: value };
        }),
      };
    }));
  };

  const handleCompleteWorkout = async () => {
    if (hasSubmittedRef.current) return;

    if (!sessionData || !user) {
      logger.error('[SessionScreen] No session data or user available');
      Alert.alert(
        'Error',
        'Session data is missing. Please try starting the workout again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    // VALIDATION: Check that at least one set has valid data before saving
    const hasValidData = exercises.some(exercise =>
      exercise.sets.some(set =>
        set.completed && 
        parseFloat(set.weight) > 0 && 
        parseInt(set.reps, 10) > 0
      )
    );

    if (!hasValidData) {
      logger.warn('[SessionScreen] Attempted to complete workout without valid data');
      Alert.alert(
        'No Data Entered',
        'Please complete at least one set with weight and reps before finishing the workout.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      hasSubmittedRef.current = true;
      setIsSaving(true);
      logger.debug('[SessionScreen] Completing workout...', sessionData);

      const workoutExercises = exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets.map(set => ({
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps, 10) || 0,
          completed: set.completed,
        })),
      }));

      const sessionEndTime = Date.now();
      const totalTimeMinutes = Math.round((sessionEndTime - sessionStartTime.current) / 60000);
      const totalExercises = exercises.length;
      const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
      const totalVolumeKg = exercises.reduce((volume, ex) => 
        volume + ex.sets.reduce((setVolume, set) => 
          setVolume + (parseFloat(set.weight) || 0) * (parseInt(set.reps, 10) || 0), 0
        ), 0
      );
      const estimatedCalories = Math.round(totalVolumeKg * 0.025);

      const summaryData: WorkoutSummary = {
        title: sessionData.programmeName || 'Workout Complete!',
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        totalTime: `${totalTimeMinutes}m`,
        totalVolume: Math.round(totalVolumeKg),
        exercises: totalExercises,
        calories: estimatedCalories,
        sets: totalSetsCount,
      };

      logger.debug('[SessionScreen] Saving workout to Supabase:', {
        programmeId: sessionData.programmeId,
        day: sessionData.day,
        week: sessionData.week,
        exerciseCount: workoutExercises.length,
      });

      const completedAt = new Date().toISOString();

      const result = await logWorkoutMutation.mutateAsync({
        programmeId: sessionData.programmeId,
        programmeName: sessionData.programmeName,
        day: sessionData.day,
        week: sessionData.week,
        exercises: workoutExercises,
        completedAt,
      });

      logger.debug('[SessionScreen] Workout logged via tRPC:', result);
      
      logger.debug('[SessionScreen] Refreshing programme context, analytics, and schedule...');
      
      await Promise.all([
        refetch(),
        refetchAnalytics(),
        loadSchedule(),
      ]);
      
      logger.debug('[SessionScreen] Contexts refreshed, showing celebration modal');
      
      setWorkoutSummary(summaryData);
      setShowCompleteModal(true);
    } catch (error) {
      hasSubmittedRef.current = false;
      logger.error('[SessionScreen] Error completing workout:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      Alert.alert(
        'Error Saving Workout',
        `Failed to save workout: ${errorMessage}\n\nYour progress was not saved. Please try again.`,
        [
          { text: 'Try Again', onPress: () => handleCompleteWorkout() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!currentExercise || !sessionData) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <Text style={styles.errorText}>Session not found</Text>
          <Pressable
            style={[styles.backButton, { backgroundColor: accent }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Progress</Text>
          <Text style={[styles.progressPercentage, { color: accent }]}>{Math.round(globalProgress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${globalProgress}%`, backgroundColor: accent }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handlePagerScroll}
            scrollEventThrottle={16}
            style={styles.pager}
          >
            {exercises.map((exercise, exerciseIndex) => (
              <ScrollView
                key={exerciseIndex}
                style={[styles.exercisePage, { width: screenWidth }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                <Text style={styles.exerciseSubtitle}>
                  {exercise.sets.filter(s => s.completed).length} of {exercise.targetSets} sets completed
                </Text>

                {exercise.sets.map((set, setIndex) => (
                  <Card
                    key={setIndex}
                    style={StyleSheet.flatten([
                      styles.setCard,
                      set.completed && { borderColor: accent, borderWidth: 2 },
                    ])}
                  >
                    <View style={styles.setHeader}>
                      <Text style={styles.setNumber}>{setIndex + 1}</Text>
                      {set.completed ? (
                        <View style={[styles.completedBadge, { backgroundColor: accent }]}>
                          <Check size={16} color={COLORS.background} strokeWidth={3} />
                        </View>
                      ) : (
                        <Text style={styles.waitingText}>
                          {setIndex === 0 || exercise.sets[setIndex - 1]?.completed
                            ? ''
                            : 'Waiting...'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Weight (kg)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            set.completed && styles.inputDisabled,
                          ]}
                          value={set.weight}
                          onChangeText={(value) => handleWeightChange(exerciseIndex, setIndex, value)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={COLORS.textTertiary}
                          editable={!set.completed}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reps</Text>
                        <TextInput
                          style={[
                            styles.input,
                            set.completed && styles.inputDisabled,
                          ]}
                          value={set.reps}
                          onChangeText={(value) => handleRepsChange(exerciseIndex, setIndex, value)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={COLORS.textTertiary}
                          editable={!set.completed}
                        />
                      </View>

                      {!set.completed && (
                        <Pressable
                          style={[
                            styles.checkButton,
                            { backgroundColor: accent },
                            (!set.weight || !set.reps) && styles.checkButtonDisabled,
                          ]}
                          onPress={() => handleSetComplete(exerciseIndex, setIndex)}
                          disabled={!set.weight || !set.reps}
                        >
                          <Check size={20} color={COLORS.background} strokeWidth={3} />
                        </Pressable>
                      )}
                    </View>
                  </Card>
                ))}
              </ScrollView>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>

        {currentExerciseSetsCompleted && (
          <View style={styles.stickyFooter}>
            {!isLastExercise ? (
              <Pressable
                style={[styles.nextButton, { borderColor: accent }]}
                onPress={() => {
                  logger.debug('[SessionScreen] Next Exercise pressed:', {
                    currentIndex: currentExerciseIndex,
                    nextIndex: currentExerciseIndex + 1,
                    totalExercises: exercises.length
                  });
                  handleNextExercise();
                }}
              >
                <Text style={[styles.nextButtonText, { color: accent }]}>Next Exercise</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.completeButton, { backgroundColor: accent }, isSaving && styles.completeButtonDisabled]}
                onPress={() => {
                  logger.debug('[SessionScreen] Complete Workout pressed');
                  handleCompleteWorkout();
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <>
                    <Check size={24} color={COLORS.background} strokeWidth={3} />
                    <Text style={styles.completeButtonText}>Complete Workout</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>

      <RestTimerModal
        visible={showRestTimer}
        duration={currentExercise?.rest || 90}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />

      {workoutSummary && (
        <WorkoutCompleteModal
          visible={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            router.back();
          }}
          summary={workoutSummary}
          accentColor={accent}
        />
      )}

      <Modal
        visible={showExerciseList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseList(false)}
      >
        <Pressable
          style={styles.exerciseListOverlay}
          onPress={() => setShowExerciseList(false)}
        >
          <View style={styles.exerciseListModal} onStartShouldSetResponder={() => true}>
            <View style={styles.exerciseListHeader}>
              <View style={styles.exerciseListHandle} />
              <Text style={styles.exerciseListTitle}>Exercises</Text>
            </View>
            <ScrollView
              style={styles.exerciseListScroll}
              contentContainerStyle={styles.exerciseListScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((exercise, index) => {
                const completedCount = exercise.sets.filter(s => s.completed).length;
                const totalCount = exercise.targetSets;
                const allDone = completedCount === totalCount;
                const isCurrent = index === currentExerciseIndex;

                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.exerciseListItem,
                      isCurrent && { borderColor: accent, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      jumpToExercise(index);
                      setShowExerciseList(false);
                    }}
                  >
                    <View style={styles.exerciseListItemContent}>
                      <View style={styles.exerciseListItemLeft}>
                        <Text
                          style={[
                            styles.exerciseListItemName,
                            allDone && { color: COLORS.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {exercise.name}
                        </Text>
                        <Text style={styles.exerciseListItemSets}>
                          {completedCount} / {totalCount} sets
                        </Text>
                      </View>
                      {allDone ? (
                        <View style={[styles.exerciseListCheck, { backgroundColor: accent }]}>
                          <Check size={16} color={COLORS.background} strokeWidth={3} />
                        </View>
                      ) : completedCount > 0 ? (
                        <View style={[styles.exerciseListPartial, { borderColor: accent }]}>
                          <Text style={[styles.exerciseListPartialText, { color: accent }]}>
                            {completedCount}/{totalCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -8,
  },
  closeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500' as const,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressFill: {
    height: '100%',
  },
  headerTitleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  exercisePage: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  setCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  setNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500' as const,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.3,
  },
  stickyFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  nextButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  completeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginBottom: SPACING.xl,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
  exerciseListOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end' as const,
  },
  exerciseListModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: SPACING.lg,
  },
  exerciseListHeader: {
    alignItems: 'center' as const,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  exerciseListHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: SPACING.md,
  },
  exerciseListTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  exerciseListScroll: {
    flex: 1,
  },
  exerciseListScrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl + 40,
  },
  exerciseListItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  exerciseListItemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  exerciseListItemLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  exerciseListItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  exerciseListItemSets: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  exerciseListCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  exerciseListPartial: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
  },
  exerciseListPartialText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
