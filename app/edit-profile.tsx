import { useRouter } from 'expo-router';
import { X, Check, Lock } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ColorPicker from '@/components/ColorPicker';
import GlowCard from '@/components/GlowCard';
import { COLORS, SPACING, AccentColor } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc';

// Color normalization helper function
const normalizeHexColor = (color: string): string => {
  if (!color || typeof color !== 'string') return '#FF6B55';
  const trimmed = color.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const upper = withHash.toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(upper)) return upper;
  return '#FF6B55';
};

const splitName = (fullName: string): { first: string; last: string } => {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' ') || '',
  };
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUser();
  const { accent, setAccentColor } = useTheme();

  const initialName = splitName(user?.name || '');
  const [firstName, setFirstName] = useState(initialName.first);
  const [lastName, setLastName] = useState(initialName.last);
  const [selectedColor, setSelectedColor] = useState(() => normalizeHexColor(user?.accentColor || accent));
  const [gender, setGender] = useState<'male' | 'female'>(
    (user?.gender === 'male' || user?.gender === 'female') ? user.gender : 'male'
  );
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || '');
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileMutation = trpc.profile.update.useMutation();

  useEffect(() => {
    if (user) {
      const nameParts = splitName(user.name);
      setFirstName(nameParts.first);
      setLastName(nameParts.last);
      setSelectedColor(normalizeHexColor(user.accentColor || accent));
      setGender((user.gender === 'male' || user.gender === 'female') ? user.gender : 'male');
      setHeightCm(user.heightCm?.toString() || '');
      setWeightKg(user.weightKg?.toString() || '');
      setAge(user.age?.toString() || '');
    }
  }, [user, accent]);

  const currentFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const savedGender = (user?.gender === 'male' || user?.gender === 'female') ? user.gender : 'male';

  const hasChanges = () => {
    const currentColor = normalizeHexColor(selectedColor);
    const savedColor = normalizeHexColor(user?.accentColor || accent);
    return (
      currentFullName !== (user?.name || '') ||
      currentColor !== savedColor ||
      gender !== savedGender ||
      heightCm !== (user?.heightCm?.toString() || '') ||
      weightKg !== (user?.weightKg?.toString() || '') ||
      age !== (user?.age?.toString() || '')
    );
  };

  // Input sanitizers
  const handleHeightChange = (text: string) => {
    setHeightCm(text.replace(/[^0-9]/g, ''));
  };

  const handleWeightChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    setWeightKg(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned);
  };

  const handleAgeChange = (text: string) => {
    setAge(text.replace(/[^0-9]/g, ''));
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name cannot be empty');
      return;
    }

    if (!hasChanges()) {
      router.back();
      return;
    }

    // Validate measurements
    const parsedHeight = heightCm ? parseInt(heightCm, 10) : null;
    if (parsedHeight !== null && (parsedHeight < 50 || parsedHeight > 300)) {
      Alert.alert('Error', 'Height must be between 50 and 300 cm');
      return;
    }

    const parsedWeight = weightKg ? parseFloat(weightKg) : null;
    if (parsedWeight !== null && (parsedWeight < 20 || parsedWeight > 500)) {
      Alert.alert('Error', 'Weight must be between 20 and 500 kg');
      return;
    }

    const parsedAge = age ? parseInt(age, 10) : null;
    if (parsedAge !== null && (parsedAge < 10 || parsedAge > 120)) {
      Alert.alert('Error', 'Age must be between 10 and 120 years');
      return;
    }

    setIsSaving(true);

    try {
      const updates: {
        name?: string;
        accentColor?: string;
        gender?: 'male' | 'female';
        heightCm?: number | null;
        weightKg?: number | null;
        age?: number | null;
      } = {};

      if (currentFullName !== (user?.name || '')) {
        updates.name = currentFullName;
      }

      const normalizedSelectedColor = normalizeHexColor(selectedColor);
      const normalizedSavedColor = normalizeHexColor(user?.accentColor || accent);

      if (normalizedSelectedColor !== normalizedSavedColor) {
        updates.accentColor = normalizedSelectedColor;
      }

      if (gender !== savedGender) {
        updates.gender = gender;
      }

      if (parsedHeight !== (user?.heightCm ?? null)) {
        updates.heightCm = parsedHeight;
      }

      if (parsedWeight !== (user?.weightKg ?? null)) {
        updates.weightKg = parsedWeight;
      }

      if (parsedAge !== (user?.age ?? null)) {
        updates.age = parsedAge;
      }

      // Guard: if no fields actually changed, skip the mutation
      if (Object.keys(updates).length === 0) {
        router.back();
        return;
      }

      const result = await updateProfileMutation.mutateAsync(updates);

      if (result.success) {
        await updateProfile(updates);

        if (updates.accentColor) {
          const colorMap = Object.fromEntries(
            Object.entries(COLORS.accents).map(([name, hex]) => [hex.toUpperCase(), name])
          ) as Record<string, AccentColor>;

          const colorName = colorMap[normalizedSelectedColor] || 'orange';
          logger.debug('[EditProfile] Setting accent color to:', colorName, 'from hex:', normalizedSelectedColor);
          setAccentColor(colorName);
        }

        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      logger.error('[EditProfile] Error updating profile:', error);

      let errorMessage = 'Failed to update profile';

      // Extract message from tRPC error shape
      const tRPCMessage = error?.shape?.message || error?.data?.message;
      if (typeof tRPCMessage === 'string' && tRPCMessage.length > 0) {
        errorMessage = tRPCMessage;
      } else if (typeof error?.message === 'string' && error.message.length > 0) {
        if (error.message.includes('<!DOCTYPE') || error.message.includes('HTML')) {
          errorMessage = 'Server error. Please check if the backend is running correctly.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={isSaving || !hasChanges()}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Check
                size={24}
                color={hasChanges() ? accent : COLORS.textTertiary}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* IDENTITY */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>IDENTITY</Text>

              {/* First Name + Last Name */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.fieldLabel}>FIRST NAME</Text>
                  <View style={styles.fieldInputContainer}>
                    <TextInput
                      style={styles.fieldInput}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First name"
                      placeholderTextColor={COLORS.textTertiary}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.fieldLabel}>LAST NAME</Text>
                  <View style={styles.fieldInputContainer}>
                    <TextInput
                      style={styles.fieldInput}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last name"
                      placeholderTextColor={COLORS.textTertiary}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.emailField}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <View style={styles.emailContainer}>
                  <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
                  <Lock size={16} color={COLORS.textTertiary} strokeWidth={2} />
                </View>
              </View>

              {/* Gender Cards */}
              <View style={styles.genderRow}>
                {(['female', 'male'] as const).map((option) => {
                  const isSelected = gender === option;
                  const letter = option === 'female' ? 'F' : 'M';
                  return (
                    <View key={option} style={styles.genderCardWrapper}>
                      <Pressable
                        style={[
                          styles.genderCard,
                          isSelected && styles.genderCardSelected,
                        ]}
                        onPress={() => setGender(option)}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                        <Text style={[
                          styles.genderLetter,
                          isSelected && styles.genderLetterSelected,
                        ]}>
                          {letter}
                        </Text>
                        <Text style={[
                          styles.genderLabel,
                          isSelected && styles.genderLabelSelected,
                        ]}>
                          {option.toUpperCase()}
                        </Text>
                      </Pressable>
                      {isSelected && <View style={styles.selectionDot} />}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* MEASUREMENTS */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MEASUREMENTS</Text>

              {/* Height - full width */}
              <View style={styles.measurementCard}>
                <Text style={styles.measurementLabel}>Height</Text>
                <View style={styles.measurementValueRow}>
                  <TextInput
                    style={styles.measurementInput}
                    value={heightCm}
                    onChangeText={handleHeightChange}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={COLORS.textTertiary}
                    maxLength={3}
                  />
                  <Text style={styles.measurementUnit}>CM</Text>
                </View>
              </View>

              {/* Weight + Age - side by side */}
              <View style={styles.measurementRow}>
                <View style={[styles.measurementCard, styles.measurementCardHalf]}>
                  <Text style={styles.measurementLabel}>Weight</Text>
                  <View style={styles.measurementValueRow}>
                    <TextInput
                      style={styles.measurementInput}
                      value={weightKg}
                      onChangeText={handleWeightChange}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={COLORS.textTertiary}
                      maxLength={5}
                    />
                    <Text style={styles.measurementUnit}>KG</Text>
                  </View>
                </View>
                <View style={[styles.measurementCard, styles.measurementCardHalf]}>
                  <Text style={styles.measurementLabel}>Age</Text>
                  <View style={styles.measurementValueRow}>
                    <TextInput
                      style={styles.measurementInput}
                      value={age}
                      onChangeText={handleAgeChange}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={COLORS.textTertiary}
                      maxLength={3}
                    />
                    <Text style={styles.measurementUnit}>YR</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* APPEARANCE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>APPEARANCE</Text>
              <GlowCard glowColor={normalizeHexColor(selectedColor)} intensity="medium">
                <View style={styles.colorCardInner}>
                  <ColorPicker
                    selectedColor={selectedColor}
                    onColorSelect={setSelectedColor}
                  />
                </View>
              </GlowCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
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
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    fontStyle: 'italic' as const,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },

  // Name fields
  nameRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  fieldInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  fieldInput: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  // Email
  emailField: {
    marginBottom: SPACING.md,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Gender cards
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderCardWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  genderCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 130,
    overflow: 'hidden',
    position: 'relative',
  },
  genderCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
  },
  genderLetter: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    opacity: 0.08,
    position: 'absolute',
    top: '10%',
  },
  genderLetterSelected: {
    color: COLORS.background,
    opacity: 0.12,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  genderLabelSelected: {
    color: COLORS.background,
  },
  selectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },

  // Measurement cards
  measurementCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  measurementRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  measurementCardHalf: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  measurementValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  measurementInput: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    minWidth: 30,
    textAlign: 'right',
    padding: 0,
  },
  measurementUnit: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.textTertiary,
  },

  // Color picker
  colorCardInner: {
    padding: SPACING.lg,
    minHeight: 350,
  },
});
