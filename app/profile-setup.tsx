import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Briefcase } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';

const USER_TYPES = [
  {
    id: 'client',
    label: 'I want to train',
    description: 'Track your workouts and progress',
    icon: User,
    isPT: false,
  },
  {
    id: 'pt',
    label: 'I\'m a Personal Trainer',
    description: 'Manage clients and programmes',
    icon: Briefcase,
    isPT: true,
  },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { updateProfile } = useUser();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    const isPT = selectedType === 'pt';
    
    setLoading(true);
    try {
      const result = await updateProfile({ is_pt: isPT });
      
      if (result.success) {
        router.replace('/(tabs)/home' as any);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience
          </Text>
        </View>

        <View style={styles.options}>
          {USER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <Pressable
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                ]}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Icon
                    size={32}
                    color={isSelected ? COLORS.background : COLORS.accents.orange}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{type.label}</Text>
                  <Text style={styles.optionDescription}>{type.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleContinue}
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          disabled={loading || !selectedType}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Setting up...' : 'Continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl * 2,
  },
  header: {
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  options: {
    gap: SPACING.md,
    marginBottom: SPACING.xl * 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  optionSelected: {
    borderColor: COLORS.accents.orange,
    backgroundColor: `${COLORS.accents.orange}10`,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.accents.orange}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.accents.orange,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  continueButton: {
    backgroundColor: COLORS.accents.orange,
    paddingVertical: SPACING.md + 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.background,
  },
});
