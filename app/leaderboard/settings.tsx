import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ArrowLeft, LogOut } from 'lucide-react-native';
import Card from '@/components/Card';
import ConfirmModal from '@/components/ConfirmModal';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';

export default function LeaderboardSettingsScreen() {
  const { accent } = useTheme();
  const { profile, optOut, updateDisplayName } = useLeaderboard();
  const [displayName, setDisplayName] = useState<string>(profile?.display_name || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showOptOutModal, setShowOptOutModal] = useState<boolean>(false);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Display Name Required', 'Please enter a display name.');
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
      await updateDisplayName(displayName.trim());
      Alert.alert('Success', 'Display name updated successfully!');
    } catch (error) {
      console.error('[UpdateDisplayName] Error:', error);
      Alert.alert('Error', 'Failed to update display name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptOut = async () => {
    setIsSubmitting(true);
    try {
      await optOut();
      setShowOptOutModal(false);
      router.back();
    } catch (error) {
      console.error('[OptOut] Error:', error);
      Alert.alert('Error', 'Failed to opt out. Please try again.');
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
          <Text style={styles.headerTitle}>Leaderboard Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            <Text style={styles.sectionDescription}>
              Change how your name appears on the leaderboard.
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
            
            <Pressable
              style={[
                styles.updateButton,
                { backgroundColor: accent },
                (isSubmitting || displayName === profile?.display_name) && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdateDisplayName}
              disabled={isSubmitting || displayName === profile?.display_name}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Update Name</Text>
              )}
            </Pressable>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <Text style={styles.sectionDescription}>
              Your real name and personal data are always kept private. Only your display name appears on leaderboards.
            </Text>
          </Card>

          <Card style={[styles.section, styles.dangerSection]}>
            <View style={styles.dangerHeader}>
              <LogOut size={24} color={COLORS.error} strokeWidth={2} />
              <Text style={styles.dangerTitle}>Leave Leaderboard</Text>
            </View>
            <Text style={styles.dangerDescription}>
              You can opt out of the leaderboard at any time. Your ranking data will be removed, but you can rejoin later.
            </Text>
            <Pressable
              style={styles.dangerButton}
              onPress={() => setShowOptOutModal(true)}
            >
              <Text style={styles.dangerButtonText}>Opt Out</Text>
            </Pressable>
          </Card>
        </ScrollView>

        <ConfirmModal
          visible={showOptOutModal}
          title="Leave Leaderboard?"
          message="Are you sure you want to opt out? Your ranking data will be removed from all leaderboards."
          confirmText="Leave"
          cancelText="Cancel"
          onConfirm={handleOptOut}
          onCancel={() => setShowOptOutModal(false)}
          destructive
        />
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
    marginBottom: SPACING.md,
  },
  updateButton: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
  },
  dangerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  dangerButton: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    minHeight: 44,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
