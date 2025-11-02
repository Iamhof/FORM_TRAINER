import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { EXERCISE_LIBRARY } from '@/constants/exercise-library';
import { COLORS, SPACING } from '@/constants/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = EXERCISE_LIBRARY.find(ex => ex.id === id);

  const handlePlayVideo = () => {
    if (exercise?.videoUrl) {
      Linking.openURL(exercise.videoUrl);
    }
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyColors = {
    Beginner: COLORS.accents.green,
    Intermediate: COLORS.accents.yellow,
    Advanced: COLORS.accents.red,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          testID="back-button"
        >
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.videoPlaceholder}
          onPress={handlePlayVideo}
          activeOpacity={0.8}
        >
          <View style={styles.playIconContainer}>
            <Play size={48} color={COLORS.textPrimary} fill={COLORS.textPrimary} />
          </View>
          <Text style={styles.videoHint}>Tap to watch demonstration</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>

          <View style={styles.tagsContainer}>
            {exercise.categories.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
            {exercise.difficulty && (
              <View
                style={[
                  styles.difficultyTag,
                  { backgroundColor: `${difficultyColors[exercise.difficulty]}20` },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyTagText,
                    { color: difficultyColors[exercise.difficulty] },
                  ]}
                >
                  {exercise.difficulty}
                </Text>
              </View>
            )}
          </View>

          {exercise.equipment && exercise.equipment.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment</Text>
              <View style={styles.equipmentContainer}>
                {exercise.equipment.map((item, index) => (
                  <View key={index} style={styles.equipmentPill}>
                    <Text style={styles.equipmentText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{exercise.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {exercise.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {exercise.tips && exercise.tips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Tips</Text>
              {exercise.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <CheckCircle2
                    size={16}
                    color={COLORS.accents.orange}
                    style={styles.tipIcon}
                  />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  videoPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(255, 107, 85, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accents.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  videoHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 107, 85, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 85, 0.3)',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.accents.orange,
  },
  difficultyTag: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  equipmentPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  equipmentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accents.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: SPACING.sm,
    marginTop: 3,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.accents.orange,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
});
