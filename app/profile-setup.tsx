import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');

  const formatDateOfBirth = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 8);
    
    let formatted = '';
    if (limited.length > 0) {
      formatted = limited.slice(0, 2);
    }
    if (limited.length >= 3) {
      formatted += '/' + limited.slice(2, 4);
    }
    if (limited.length >= 5) {
      formatted += '/' + limited.slice(4, 8);
    }
    
    setDateOfBirth(formatted);
  };
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(1);

  // Create animated values once for all color options to prevent memory leaks
  const colorAnimations = useMemo(() => {
    return COLOR_OPTIONS.map((_, index) => 
      new Animated.Value(index === 1 ? 1 : 0.85) // Match initial selectedColorIndex
    );
  }, []);

  // Animate scale changes when color selection changes
  useEffect(() => {
    colorAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === selectedColorIndex ? 1 : 0.85,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    });
  }, [selectedColorIndex, colorAnimations]);

  const handleContinue = async () => {
    if (!firstName || !lastName || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const result = await updateProfile({ 
        name: fullName,
        gender: gender 
      });
      
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
                onChangeText={formatDateOfBirth}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender*</Text>
              <Text style={styles.genderSubtitle}>
                Required for leaderboard participation
              </Text>
              <View style={styles.genderOptions}>
                <Pressable
                  style={[
                    styles.genderButton,
                    gender === 'male' && [styles.genderButtonSelected, { borderColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]}
                  onPress={() => setGender('male')}
                >
                  <View style={[
                    styles.genderRadio,
                    gender === 'male' && [styles.genderRadioSelected, { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]} />
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextSelected
                  ]}>Male</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.genderButton,
                    gender === 'female' && [styles.genderButtonSelected, { borderColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]}
                  onPress={() => setGender('female')}
                >
                  <View style={[
                    styles.genderRadio,
                    gender === 'female' && [styles.genderRadioSelected, { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]} />
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextSelected
                  ]}>Female</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.genderButton,
                    gender === 'other' && [styles.genderButtonSelected, { borderColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]}
                  onPress={() => setGender('other')}
                >
                  <View style={[
                    styles.genderRadio,
                    gender === 'other' && [styles.genderRadioSelected, { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]} />
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'other' && styles.genderButtonTextSelected
                  ]}>Other</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.genderButton,
                    gender === 'prefer_not_to_say' && [styles.genderButtonSelected, { borderColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]}
                  onPress={() => setGender('prefer_not_to_say')}
                >
                  <View style={[
                    styles.genderRadio,
                    gender === 'prefer_not_to_say' && [styles.genderRadioSelected, { backgroundColor: COLOR_OPTIONS[selectedColorIndex].rgb }]
                  ]} />
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'prefer_not_to_say' && styles.genderButtonTextSelected
                  ]}>Prefer not to say</Text>
                </Pressable>
              </View>
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
                  // Use pre-created animated value instead of creating new ones on each render
                  const scaleAnim = colorAnimations[index];

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
  genderSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  genderOptions: {
    gap: SPACING.sm,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderRadioSelected: {
    borderColor: 'transparent',
  },
  genderButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  genderButtonTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
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
