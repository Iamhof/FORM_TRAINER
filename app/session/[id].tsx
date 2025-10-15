import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Card from '@/components/Card';
import RestTimerModal from '@/components/RestTimerModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import { EXERCISES } from '@/constants/exercises';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';

type SetData = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseData = {
  exerciseId: string;
  name: string;
  targetSets: number;
  sets: SetData[];
};

export default function SessionScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { programmes, refetch } = useProgrammes();
  const { user } = useUser();
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



  useEffect(() => {
    if (!id) {
      console.error('[SessionScreen] No session ID provided');
      setIsLoading(false);
      return;
    }

    const parts = id.split('-');
    if (parts.length < 4) {
      console.error('[SessionScreen] Invalid session ID format:', id);
      setIsLoading(false);
      return;
    }

    const programmeId = parts.slice(0, -2).join('-');
    const day = parseInt(parts[parts.length - 2], 10);
    const week = parseInt(parts[parts.length - 1], 10);

    console.log('[SessionScreen] Parsed session:', { programmeId, day, week });

    const programme = programmes.find(p => p.id === programmeId);
    if (!programme) {
      console.error('[SessionScreen] Programme not found:', programmeId);
      setIsLoading(false);
      return;
    }

    const dayExercises = programme.exercises.filter(ex => ex.day === day);
    console.log('[SessionScreen] Found exercises for day', day, ':', dayExercises.length);

    const mappedExercises: ExerciseData[] = dayExercises.map(ex => {
      const exerciseData = EXERCISES.find(e => e.id === ex.exerciseId);
      return {
        exerciseId: ex.exerciseId,
        name: exerciseData?.name || 'Unknown Exercise',
        targetSets: ex.sets,
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
  }, [id, programmes]);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.targetSets || 0;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const currentExerciseSetsCompleted = useMemo(() => {
    if (!currentExercise) return false;
    const allCompleted = currentExercise.sets.every(set => set.completed);
    console.log('[SessionScreen] Current exercise sets completed:', allCompleted, currentExercise.sets);
    return allCompleted;
  }, [currentExercise]);

  const allExercisesCompleted = useMemo(() => {
    return exercises.every(exercise => 
      exercise.sets.every(set => set.completed)
    );
  }, [exercises]);

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
      
      if (!isLastSetOfExercise || !allSetsCompleted) {
        setShowRestTimer(true);
      }
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      console.log('[SessionScreen] Moving to next exercise:', currentExerciseIndex + 1);
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
      console.error('[SessionScreen] No session data or user available');
      Alert.alert(
        'Error',
        'Session data is missing. Please try starting the workout again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    try {
      setIsSaving(true);
      console.log('[SessionScreen] Completing workout...', sessionData);

      const workoutExercises = exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets.map(set => ({
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps, 10) || 0,
          completed: set.completed,
        })),
      }));

      console.log('[SessionScreen] Saving workout to Supabase:', {
        programmeId: sessionData.programmeId,
        day: sessionData.day,
        week: sessionData.week,
        exerciseCount: workoutExercises.length,
      });

      const { data: insertedWorkout, error } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          programme_id: sessionData.programmeId,
          programme_name: sessionData.programmeName,
          day: sessionData.day,
          week: sessionData.week,
          exercises: workoutExercises,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[SessionScreen] Supabase error:', error);
        throw new Error(`Failed to save workout: ${error.message}`);
      }

      console.log('[SessionScreen] Workout logged successfully:', insertedWorkout?.id);
      console.log('[SessionScreen] Refreshing programme context...');
      
      await refetch();
      
      console.log('[SessionScreen] Programme context refreshed, navigating back');
      
      Alert.alert(
        'Workout Complete! 🎉',
        'Great job! Your progress has been saved.',
        [
          {
            text: 'View Progress',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[SessionScreen] Error completing workout:', error);
      
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
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitle: `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`,
          headerTitleStyle: { fontSize: 14, fontWeight: '500' as const, color: COLORS.textSecondary },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton} disabled={isSaving}>
              <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
              <Text style={styles.closeText}>End Workout</Text>
            </Pressable>
          ),
        }}
      />
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
                style={[
                  styles.setCard,
                  set.completed && { borderColor: accent, borderWidth: 2 },
                ]}
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
                onPress={handleNextExercise}
              >
                <Text style={styles.completeButtonText}>Next Exercise</Text>
              </Pressable>
            ) : allExercisesCompleted ? (
              <Pressable
                style={[styles.completeButton, { backgroundColor: accent }, isSaving && styles.completeButtonDisabled]}
                onPress={handleCompleteWorkout}
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
            ) : null}
          </View>
        )}
      </SafeAreaView>

      <RestTimerModal
        visible={showRestTimer}
        duration={175}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
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
