import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { X, ChevronLeft, Check } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useProgrammes } from '@/contexts/ProgrammeContext';
import Button from '@/components/Button';

type DayExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest: number;
};

type TrainingDay = {
  name: string;
  exercises: DayExercise[];
};

export default function ReviewProgrammeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addProgramme } = useProgrammes();
  
  const programmeName = params.name as string || '';
  const frequency = parseInt(params.frequency as string) || 3;
  const duration = parseInt(params.duration as string) || 4;
  const days: TrainingDay[] = JSON.parse(params.days as string || '[]');

  const handleSave = async () => {
    await new Promise(res => setTimeout(res, 800));
    
    await addProgramme({
      name: programmeName,
      frequency,
      duration,
      days: days.map(day => ({
        name: day.name,
        exercises: day.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
        })),
      })),
    });
    
    router.push('/(tabs)/home');
  };

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
          <Text style={styles.title}>Review your programme</Text>
          <Text style={styles.subtitle}>Make sure everything looks good</Text>

          <View style={styles.programmeCard}>
            <Text style={styles.programmeName}>{programmeName || 'Untitled Programme'}</Text>
            <Text style={styles.programmeDetails}>
              {frequency} days per week • {duration} weeks
            </Text>

            {days.map((day, dayIndex) => (
              <View key={dayIndex} style={styles.daySection}>
                <Text style={styles.dayName}>{day.name || `Day ${dayIndex + 1}`}</Text>
                
                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseStats}>
                      {exercise.sets}×{exercise.reps}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.footerButton, { borderColor: COLORS.textPrimary }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={styles.footerButtonText}>Back</Text>
          </Pressable>

          <Button
            title="Save Programme"
            onPress={handleSave}
            variant="primary"
            style={styles.continueButton}
          />
          <Check size={20} color={COLORS.background} strokeWidth={2.5} style={styles.chevron} />
        </View>
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
  closeButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  programmeCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  programmeName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  programmeDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  daySection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  exerciseName: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  exerciseStats: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
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
