import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, BarChart3 } from 'lucide-react-native';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgrammes } from '@/contexts/ProgrammeContext';

export default function ProgrammeOverviewScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programmes } = useProgrammes();
  
  const programmeId = params.id as string;
  const programme = programmes.find(p => p.id === programmeId);
  
  if (!programme) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <Text style={styles.errorText}>Programme not found</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  const overallProgress = Math.round((programme.progress.completedSessions / programme.progress.totalSessions) * 100);

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
          <Text style={styles.title}>{programme.name}</Text>
          <Text style={styles.subtitle}>{programme.frequency} days per week</Text>

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
              {programme.progress.completedSessions} of {programme.progress.totalSessions} sessions completed
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>Training Split</Text>

          {programme.days.map((day, index) => (
            <Card key={index} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleRow}>
                  <Text style={styles.workoutName}>{day.name}</Text>
                </View>
                <View style={[styles.dayBadge, { backgroundColor: `${accent}20` }]}>
                  <Text style={[styles.dayBadgeText, { color: accent }]}>Day {index + 1}</Text>
                </View>
              </View>
              <Text style={styles.exerciseCount}>{day.exercises.length} exercises</Text>

              <View style={styles.exerciseList}>
                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseSets}>{exercise.sets} × {exercise.reps}</Text>
                  </View>
                ))}
              </View>

              <Button
                title="Start Session"
                onPress={() => router.push(`/session/${programmeId}-${index}` as any)}
                variant="primary"
                style={styles.startButton}
              />
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
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING.xl,
  },
});
