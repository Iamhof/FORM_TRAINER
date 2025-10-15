import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Dumbbell, Target, TrendingUp } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

const slides = [
  {
    id: 1,
    title: 'Track Your Workouts',
    description: 'Log your exercises, sets, and reps to monitor your progress over time',
    icon: Dumbbell,
  },
  {
    id: 2,
    title: 'Set Your Goals',
    description: 'Create custom training programmes tailored to your fitness objectives',
    icon: Target,
  },
  {
    id: 3,
    title: 'See Your Progress',
    description: 'Visualize your strength gains and stay motivated on your fitness journey',
    icon: TrendingUp,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/auth' as any);
    }
  };

  const handleSkip = () => {
    router.replace('/auth' as any);
  };

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.slideContent}>
          <View style={styles.iconContainer}>
            <Icon size={80} color={COLORS.accents.orange} strokeWidth={2} />
          </View>

          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <Pressable onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.accents.orange}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    textAlign: 'center' as const,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  bottomSection: {
    paddingBottom: SPACING.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: COLORS.accents.orange,
  },
  nextButton: {
    backgroundColor: COLORS.accents.orange,
    paddingVertical: SPACING.md + 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.background,
  },
});
