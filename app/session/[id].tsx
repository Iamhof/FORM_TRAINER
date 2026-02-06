import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Card from '@/components/Card';
import RestTimerModal from '@/components/RestTimerModal';
import WorkoutCompleteModal, { WorkoutSummary } from '@/components/WorkoutCompleteModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { useExercises } from '@/hooks/useExercises';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { logger } from '@/lib/logger';
import { getLocalDateString, getLocalWeekStart } from '@/lib/date-utils';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { programmes, refetch, isWeekUnlocked } = useProgrammes();
  const { data: allExercises = [], isLoading: exercisesLoading } = useExercises();
  const { user } = useUser();
  const { refetch: refetchAnalytics } = useAnalytics();
  const { loadSchedule } = useSchedule();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
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



  // Track if we've already initialized to prevent re-running on every allExercises change
  const hasInitialized = useRef(false);
  
  // Reset initialization flag when session ID changes to allow re-initialization for new sessions
  useEffect(() => {
    hasInitialized.current = false;
  }, [id]);
  
  useEffect(() => {
    // Skip if already initialized for this session ID
    if (hasInitialized.current) {
      return;
    }
    
    if (!id) {
      logger.error('[SessionScreen] No session ID provided');
      setIsLoading(false);
      return;
    }

    // Wait for exercises to be available (not loading and has data)
    if (exercisesLoading || allExercises.length === 0) {
      logger.debug('[SessionScreen] Waiting for exercises to load...');
      return; // Don't initialize yet - wait for exercise data
    }

    // Session ID format: {programmeId}:{day}:{week}
    // Using colon delimiter to avoid conflicts with UUID programme IDs that contain dashes
    const parts = id.split(':');
    if (parts.length !== 3) {
      logger.error('[SessionScreen] Invalid session ID format (expected format: programmeId:day:week):', id);
      setIsLoading(false);
      return;
    }

    const programmeId = parts[0];
    const day = parseInt(parts[1], 10);
    const week = parseInt(parts[2], 10);

    // Validate that day and week are valid numbers
    if (isNaN(day) || isNaN(week) || day < 1 || week < 1) {
      logger.error('[SessionScreen] Invalid day or week in session ID:', { id, day, week });
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
  }, [id, programmes, allExercises, exercisesLoading, isWeekUnlocked, router]);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.targetSets || 0;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Memoize headerLeft to prevent infinite re-renders from Stack.Screen options
  const headerLeft = useMemo(() => {
    return () => (
      <Pressable onPress={() => router.back()} style={styles.closeButton} disabled={isSaving}>
        <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
        <Text style={styles.closeText}>End Workout</Text>
      </Pressable>
    );
  }, [router, isSaving]);

  // Memoize navigation options to prevent infinite loop
  const screenOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: COLORS.background },
    headerTintColor: COLORS.textPrimary,
    headerTitle: `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`,
    headerTitleStyle: { fontSize: 14, fontWeight: '500' as const, color: COLORS.textSecondary },
    headerLeft,
  }), [currentExerciseIndex, exercises.length, headerLeft]);

  const currentExerciseSetsCompleted = useMemo(() => {
    if (!currentExercise) return false;
    return currentExercise.sets.every(set => set.completed);
  }, [currentExercise]);

  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const handleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    
    if (!set.completed && set.weight && set.reps) {
      set.completed = true;
      setExercises(newExercises);
      setCompletedSets(completedSets + 1);
      
      const isLastSetOfExercise = setIndex === newExercises[exerciseIndex].sets.length - 1;
      const allSetsCompleted = newExercises[exerciseIndex].sets.every(s => s.completed);
      
      logger.debug('[SessionScreen] Set completed:', {
        setIndex,
        isLastSetOfExercise,
        allSetsCompleted,
        exerciseIndex,
        currentExerciseIndex
      });
      
      if (!isLastSetOfExercise || !allSetsCompleted) {
        setShowRestTimer(true);
      }
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      logger.debug('[SessionScreen] Moving to next exercise:', currentExerciseIndex + 1);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCompletedSets(0);
    }
  };

  const handleWeightChange = (exerciseIndex: number, setIndex: number, value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex].weight = value;
    setExercises(newExercises);
  };

  const handleRepsChange = (exerciseIndex: number, setIndex: number, value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex].reps = value;
    setExercises(newExercises);
  };

  const handleCompleteWorkout = async () => {
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
      const date = getLocalDateString(); // Use local date to prevent timezone issues

      const { data: insertedWorkout, error } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          programme_id: sessionData.programmeId,
          programme_name: sessionData.programmeName,
          day: sessionData.day,
          week: sessionData.week,
          exercises: workoutExercises,
          completed_at: completedAt,
        })
        .select()
        .single();

      if (error) {
        logger.error('[SessionScreen] Supabase error:', error);
        throw new Error(`Failed to save workout: ${error.message}`);
      }

      logger.debug('[SessionScreen] Workout logged successfully:', insertedWorkout?.id);
      logger.debug('[SessionScreen] Now syncing analytics data...');

      const analyticsRecords = workoutExercises
        .map((exercise) => {
          const completedSets = exercise.sets.filter((set) => set.completed);
          if (completedSets.length === 0) return null;

          const maxWeight = Math.max(...completedSets.map((set) => set.weight));
          const totalVolume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
          const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

          return {
            user_id: user.id,
            exercise_id: exercise.exerciseId,
            date,
            max_weight: maxWeight,
            total_volume: totalVolume,
            total_reps: totalReps,
          };
        })
        .filter((record): record is NonNullable<typeof record> => record !== null);

      if (analyticsRecords.length > 0) {
        logger.debug('[SessionScreen] Inserting', analyticsRecords.length, 'analytics records');
        
        // Fetch existing analytics records for today to aggregate instead of overwrite
        const { data: existingRecords, error: fetchError } = await supabase
          .from('analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .in('exercise_id', analyticsRecords.map(r => r.exercise_id));

        if (fetchError) {
          logger.error('[SessionScreen] Error fetching existing analytics:', fetchError);
        }

        // Aggregate new data with existing data (sum volumes/reps, max weight)
        const aggregatedRecords = analyticsRecords.map(newRecord => {
          const existingRecord = existingRecords?.find(
            r => r.exercise_id === newRecord.exercise_id
          );

          if (existingRecord) {
            logger.debug('[SessionScreen] Aggregating with existing record for exercise:', newRecord.exercise_id);
            // Aggregate: sum volumes and reps, take max weight
            return {
              ...newRecord,
              max_weight: Math.max(existingRecord.max_weight, newRecord.max_weight),
              total_volume: existingRecord.total_volume + newRecord.total_volume,
              total_reps: existingRecord.total_reps + newRecord.total_reps,
            };
          }

          return newRecord;
        });

        const { error: analyticsError } = await supabase
          .from('analytics')
          .upsert(aggregatedRecords, {
            onConflict: 'user_id,exercise_id,date',
          });

        if (analyticsError) {
          logger.error('[SessionScreen] Analytics sync error:', analyticsError);
        } else {
          logger.debug('[SessionScreen] Analytics synced successfully');
        }
      }
      
      logger.debug('[SessionScreen] Updating schedule status to completed...');
      const today = new Date();
      const dayOfWeek = (today.getDay() + 6) % 7;
      
      // Use local timezone to calculate week start
      const weekStart = getLocalWeekStart(today);

      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existingSchedule) {
        const updatedSchedule = existingSchedule.schedule.map((day: any, idx: number) => {
          if (idx === dayOfWeek && (day.status === 'scheduled' || day.status === 'empty')) {
            return { ...day, status: 'completed' };
          }
          return day;
        });

        const { error: scheduleError } = await supabase
          .from('schedules')
          .update({ schedule: updatedSchedule })
          .eq('id', existingSchedule.id);

        if (scheduleError) {
          logger.error('[SessionScreen] Error updating schedule:', scheduleError);
        } else {
          logger.debug('[SessionScreen] Schedule updated successfully');
        }
      }
      
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
          <Text style={[styles.progressPercentage, { color: accent }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accent }]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.exerciseTitle}>{currentExercise.name}</Text>
            <Text style={styles.exerciseSubtitle}>
              {completedSets} of {totalSets} sets completed
            </Text>

            {currentExercise.sets.map((set, setIndex) => (
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
                      {setIndex === 0 || currentExercise.sets[setIndex - 1].completed
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
                      onChangeText={(value) => handleWeightChange(currentExerciseIndex, setIndex, value)}
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
                      onChangeText={(value) => handleRepsChange(currentExerciseIndex, setIndex, value)}
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
                      onPress={() => handleSetComplete(currentExerciseIndex, setIndex)}
                      disabled={!set.weight || !set.reps}
                    >
                      <Check size={20} color={COLORS.background} strokeWidth={3} />
                    </Pressable>
                  )}
                </View>
              </Card>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>

        {currentExerciseSetsCompleted && (
          <View style={styles.stickyFooter}>
            {!isLastExercise ? (
              <Pressable
                style={[styles.completeButton, { backgroundColor: accent }]}
                onPress={() => {
                  logger.debug('[SessionScreen] Next Exercise pressed:', {
                    currentIndex: currentExerciseIndex,
                    nextIndex: currentExerciseIndex + 1,
                    totalExercises: exercises.length
                  });
                  handleNextExercise();
                }}
              >
                <Text style={styles.completeButtonText}>Next Exercise</Text>
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
  keyboardAvoid: {
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});
