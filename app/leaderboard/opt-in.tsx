import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function OptInScreen() {
  const { accent } = useTheme();
  const { optIn } = useLeaderboard();
  const [displayName, setDisplayName] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<Gender>('prefer_not_to_say');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert('Display Name Required', 'Please enter a display name for the leaderboard.');
      return;
    }

    if (displayName.length < 2) {
      Alert.alert('Display Name Too Short', 'Please enter at least 2 characters.');
      return;
    }

    if (displayName.length > 50) {
      Alert.alert('Display Name Too Long', 'Please use 50 characters or less.');
      return;
    }

    setIsSubmitting(true);
    try {
      await optIn(displayName.trim(), selectedGender);
      router.back();
    } catch (error) {
      console.error('[OptIn] Error:', error);
      Alert.alert('Error', 'Failed to join leaderboard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.background}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={[styles.backButton, { backgroundColor: `${accent}20` }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={accent} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Join Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            <Text style={styles.sectionDescription}>
              Choose a name to display on the leaderboard. This protects your privacy while you compete.
            </Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={50}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Text style={styles.characterCount}>{displayName.length}/50</Text>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Gender (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Some leaderboards are filtered by gender for fair competition.
            </Text>
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderOption,
                    selectedGender === option.value && {
                      backgroundColor: accent,
                      borderColor: accent,
                    },
                  ]}
                  onPress={() => setSelectedGender(option.value)}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      selectedGender === option.value && { color: COLORS.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedGender === option.value && (
                    <Check size={20} color={COLORS.textPrimary} strokeWidth={2.5} />
                  )}
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.infoSection}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Your workouts are automatically tracked and contribute to your ranking
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                You can opt out anytime from settings
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Your real name and personal data remain private
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Compete in multiple categories to find your strengths
              </Text>
            </View>
          </Card>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: accent },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>Join Leaderboard</Text>
            )}
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  genderOptions: {
    gap: SPACING.sm,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  genderOptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoSection: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  infoBullet: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    fontWeight: '700',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
