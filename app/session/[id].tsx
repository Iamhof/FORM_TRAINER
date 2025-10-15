import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Card from '@/components/Card';
import RestTimerModal from '@/components/RestTimerModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type SetData = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseData = {
  id: string;
  name: string;
  targetSets: number;
  sets: SetData[];
};

const MOCK_WORKOUT = {
  name: 'Barbell Bench Press',
  exercises: [
    {
      id: '1',
      name: 'Barbell Bench Press',
      targetSets: 4,
      sets: [
        { weight: '', reps: '', completed: false },
        { weight: '', reps: '', completed: false },
        { weight: '', reps: '', completed: false },
        { weight: '', reps: '', completed: false },
      ],
    },
  ] as ExerciseData[],
};

export default function SessionScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [exercises, setExercises] = useState(MOCK_WORKOUT.exercises);
  const [currentExerciseIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise.targetSets;
  const progress = (completedSets / totalSets) * 100;

  const allSetsCompleted = useMemo(() => {
    return exercises.every(exercise => 
      exercise.sets.every(set => set.completed)
    );
  }, [exercises]);

  const handleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    
    if (!set.completed && set.weight && set.reps) {
      set.completed = true;
      setExercises(newExercises);
      setCompletedSets(completedSets + 1);
      setShowRestTimer(true);
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

  const handleCompleteWorkout = () => {
    console.log('Workout completed for programme:', id);
    router.back();
  };

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitle: `Exercise 1 of ${exercises.length}`,
          headerTitleStyle: { fontSize: 14, fontWeight: '500' as const, color: COLORS.textSecondary },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                    {setIndex === 0 || exercises[0].sets[setIndex - 1].completed
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
                    onChangeText={(value) => handleWeightChange(0, setIndex, value)}
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
                    onChangeText={(value) => handleRepsChange(0, setIndex, value)}
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
                    onPress={() => handleSetComplete(0, setIndex)}
                    disabled={!set.weight || !set.reps}
                  >
                    <Check size={20} color={COLORS.background} strokeWidth={3} />
                  </Pressable>
                )}
              </View>
            </Card>
          ))}

          {allSetsCompleted && (
            <Pressable
              style={[styles.completeButton, { backgroundColor: accent }]}
              onPress={handleCompleteWorkout}
            >
              <Check size={24} color={COLORS.background} strokeWidth={3} />
              <Text style={styles.completeButtonText}>Complete Workout</Text>
            </Pressable>
          )}
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 200,
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
});
