import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

import ExerciseSelectorModal from '@/components/ExerciseSelectorModal';
import { Exercise } from '@/constants/exercises';

type DayExercise = Exercise & {
  sets: number;
  reps: number;
  rest: number;
};

type TrainingDay = {
  name: string;
  exercises: DayExercise[];
};

export default function ProgrammeDaysScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const programmeName = params.name as string || '';
  const frequency = parseInt(params.frequency as string) || 3;
  const duration = parseInt(params.duration as string) || 4;

  const [currentDay, setCurrentDay] = useState(0);
  const [days, setDays] = useState<TrainingDay[]>(
    Array.from({ length: frequency }, (_, i) => ({
      name: '',
      exercises: [],
    }))
  );
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [editingExercise, setEditingExercise] = useState<number | null>(null);

  const handleDayNameChange = (value: string) => {
    const newDays = [...days];
    newDays[currentDay].name = value;
    setDays(newDays);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newDays = [...days];
    newDays[currentDay].exercises.push({
      ...exercise,
      sets: 3,
      reps: 10,
      rest: 90,
    });
    setDays(newDays);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (index: number, field: 'sets' | 'reps' | 'rest', value: number) => {
    const newDays = [...days];
    newDays[currentDay].exercises[index][field] = value;
    setDays(newDays);
  };

  const handleRemoveExercise = (index: number) => {
    const newDays = [...days];
    newDays[currentDay].exercises.splice(index, 1);
    setDays(newDays);
    setEditingExercise(null);
  };

  const handleNext = () => {
    if (currentDay < frequency - 1) {
      setCurrentDay(currentDay + 1);
    } else {
      router.push({
        pathname: '/create-programme/review',
        params: {
          name: programmeName,
          frequency: frequency.toString(),
          duration: duration.toString(),
          days: JSON.stringify(days),
        },
      } as any);
    }
  };

  const handleBack = () => {
    if (currentDay > 0) {
      setCurrentDay(currentDay - 1);
    } else {
      router.back();
    }
  };

  const selectedExerciseIds = days[currentDay].exercises.map((e) => e.id);

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitle: 'Create Programme',
          headerTitleStyle: { fontSize: 16, fontWeight: '600' as const },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
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
          <View style={styles.header}>
            <Text style={styles.title}>Day {currentDay + 1} of {frequency}</Text>
            <View style={[styles.badge, { backgroundColor: `${accent}20` }]}>
              <Text style={[styles.badgeText, { color: accent }]}>
                {currentDay + 1}/{frequency}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Add exercises for this training day</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Day name (optional)</Text>
            <TextInput
              style={[styles.input, { borderColor: accent }]}
              placeholder="Push Day"
              placeholderTextColor={COLORS.textTertiary}
              value={days[currentDay].name}
              onChangeText={handleDayNameChange}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises ({days[currentDay].exercises.length})</Text>

            {days[currentDay].exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseContainer}>
                <Pressable
                  style={styles.exerciseCard}
                  onPress={() => setEditingExercise(editingExercise === index ? null : index)}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Pressable
                      onPress={() => handleRemoveExercise(index)}
                      hitSlop={8}
                    >
                      <X size={20} color={COLORS.textSecondary} strokeWidth={2} />
                    </Pressable>
                  </View>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} sets × {exercise.reps} reps • {exercise.rest}s rest
                  </Text>
                  {editingExercise !== index && (
                    <Text style={[styles.editHint, { color: accent }]}>Edit Sets/Reps/Rest</Text>
                  )}
                </Pressable>

                {editingExercise === index && (
                  <View style={styles.editPanel}>
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Sets</Text>
                      <View style={styles.editControls}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'sets', Math.max(1, exercise.sets - 1))}
                        >
                          <Text style={styles.editButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.editValue}>{exercise.sets}</Text>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'sets', exercise.sets + 1)}
                        >
                          <Text style={styles.editButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Reps</Text>
                      <View style={styles.editControls}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'reps', Math.max(1, exercise.reps - 1))}
                        >
                          <Text style={styles.editButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.editValue}>{exercise.reps}</Text>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'reps', exercise.reps + 1)}
                        >
                          <Text style={styles.editButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Rest (s)</Text>
                      <View style={styles.editControls}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'rest', Math.max(0, exercise.rest - 15))}
                        >
                          <Text style={styles.editButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.editValue}>{exercise.rest}</Text>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleUpdateExercise(index, 'rest', exercise.rest + 15)}
                        >
                          <Text style={styles.editButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.doneButton, { backgroundColor: accent }]}
                      onPress={() => setEditingExercise(null)}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}

            <Pressable
              style={[styles.addExerciseBox, { borderColor: accent }]}
              onPress={() => setShowExerciseSelector(true)}
            >
              <Plus size={24} color={accent} strokeWidth={2} />
              <Text style={[styles.addExerciseText, { color: accent }]}>Add Exercise</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.footerButton, { borderColor: COLORS.textPrimary }]}
            onPress={handleBack}
          >
            <ChevronLeft size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={styles.footerButtonText}>Back</Text>
          </Pressable>

          <Button
            title={currentDay < frequency - 1 ? 'Next Day' : 'Review Programme'}
            onPress={handleNext}
            variant="primary"
            style={styles.continueButton}
          />
          <ChevronRight size={20} color={COLORS.background} strokeWidth={2} style={styles.chevron} />
        </View>
      </SafeAreaView>

      <ExerciseSelectorModal
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleAddExercise}
        selectedExerciseIds={selectedExerciseIds}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500' as const,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontWeight: '500' as const,
  },
  addExerciseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    marginTop: SPACING.sm,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  exerciseContainer: {
    marginBottom: SPACING.md,
  },
  exerciseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  exerciseDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  editHint: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  editPanel: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  editValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'center' as const,
  },
  doneButton: {
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.background,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  continueButton: {
    flex: 1,
  },
  chevron: {
    position: 'absolute' as const,
    right: SPACING.lg + SPACING.md,
    pointerEvents: 'none' as const,
  },
});
