import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, AccentColor } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

const COLOR_OPTIONS: { name: string; color: AccentColor; rgb: string }[] = [
  { name: 'Red', color: 'red', rgb: COLORS.accents.red },
  { name: 'Orange', color: 'orange', rgb: COLORS.accents.orange },
  { name: 'Yellow', color: 'yellow', rgb: COLORS.accents.yellow },
  { name: 'Green', color: 'green', rgb: COLORS.accents.green },
  { name: 'Teal', color: 'teal', rgb: COLORS.accents.teal },
  { name: 'Blue', color: 'blue', rgb: COLORS.accents.blue },
  { name: 'Purple', color: 'purple', rgb: COLORS.accents.purple },
  { name: 'Pink', color: 'pink', rgb: COLORS.accents.pink },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { updateProfile } = useUser();
  const { setAccentColor } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(1);

  const handleContinue = async () => {
    if (!firstName || !lastName || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const result = await updateProfile({ name: fullName });
      
      if (result.success) {
        const selectedColor = COLOR_OPTIONS[selectedColorIndex].color;
        await setAccentColor(selectedColor);
        router.replace('/(tabs)/home' as any);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToColor = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * 110 - 50,
      animated: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[
              styles.colorPreview,
              { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb }
            ]} />
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about yourself to personalize your experience
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>First Name*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Last Name*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth*</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textTertiary}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                placeholderTextColor={COLORS.textTertiary}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                placeholderTextColor={COLORS.textTertiary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Muscle Mass (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                placeholderTextColor={COLORS.textTertiary}
                value={muscleMass}
                onChangeText={setMuscleMass}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.colorSection}>
              <Text style={styles.label}>Select Theme Color</Text>
              <Text style={styles.colorSubtitle}>
                {COLOR_OPTIONS[selectedColorIndex].name}
              </Text>
              
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorCarousel}
              >
                {COLOR_OPTIONS.map((option, index) => {
                  const isSelected = index === selectedColorIndex;
                  const scaleAnim = new Animated.Value(isSelected ? 1 : 0.85);

                  return (
                    <Pressable
                      key={option.color}
                      onPress={() => {
                        setSelectedColorIndex(index);
                        scrollToColor(index);
                      }}
                      style={styles.colorOption}
                    >
                      <Animated.View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: option.rgb },
                          isSelected && styles.colorCircleSelected,
                          { transform: [{ scale: scaleAnim }] },
                        ]}
                      />
                      {isSelected && (
                        <View style={[styles.colorIndicator, { backgroundColor: option.rgb }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Pressable
              onPress={handleContinue}
              style={[
                styles.continueButton,
                { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb },
                loading && styles.continueButtonDisabled
              ]}
              disabled={loading}
            >
              <Text style={styles.continueButtonText}>
                {loading ? 'Creating Profile...' : 'Get Started'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: SPACING.md,
  },
  form: {
    gap: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  colorSection: {
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  colorSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  colorCarousel: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  colorOption: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  colorCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: COLORS.textPrimary,
    borderWidth: 3,
  },
  colorIndicator: {
    width: 30,
    height: 4,
    borderRadius: 2,
  },
  continueButton: {
    paddingVertical: SPACING.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
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
