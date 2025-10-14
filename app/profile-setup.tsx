import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, AccentColor } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { User, Mail, Activity, Palette } from 'lucide-react-native';

const CURRENT_USER_ID_KEY = '@form_current_user_id';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ColorOption = {
  id: AccentColor;
  name: string;
  color: string;
  icon: string;
};

const additionalColors: ColorOption[] = [
  { id: 'red', name: 'Red', color: COLORS.accents.red, icon: '🔥' },
  { id: 'orange', name: 'Orange', color: COLORS.accents.orange, icon: '🍊' },
  { id: 'yellow', name: 'Yellow', color: COLORS.accents.yellow, icon: '⚡' },
  { id: 'green', name: 'Green', color: COLORS.accents.green, icon: '🌿' },
  { id: 'teal', name: 'Teal', color: COLORS.accents.teal, icon: '💎' },
  { id: 'blue', name: 'Blue', color: COLORS.accents.blue, icon: '💧' },
  { id: 'purple', name: 'Purple', color: COLORS.accents.purple, icon: '✨' },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { accent, setAccentColor, accentColor } = useTheme();
  const { saveUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'stone'>('kg');

  const scrollViewRef = useRef<ScrollView>(null);
  const colorScrollRef = useRef<ScrollView>(null);

  const handleColorSelect = (colorId: AccentColor) => {
    setAccentColor(colorId);
  };

  const handleComplete = async () => {
    if (!firstName) {
      alert('Please enter your first name');
      return;
    }

    setIsLoading(true);
    
    const userId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
    if (!userId) {
      alert('User ID not found. Please sign up again.');
      setIsLoading(false);
      return;
    }
    
    await saveUser({
      userId,
      firstName,
      email: '',
      selectedColor: accentColor,
      createdAt: Date.now(),
    });
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    router.replace('/(tabs)/home');
  };

  const renderColorCarousel = () => {
    return (
      <View style={styles.colorCarouselContainer}>
        <ScrollView
          ref={colorScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorCarousel}
          snapToInterval={SCREEN_WIDTH / 4}
          decelerationRate="fast"
        >
          {additionalColors.map((color, index) => {
            const isSelected = color.id === accentColor && color.color === accent;
            return (
              <TouchableOpacity
                key={`${color.id}-${index}`}
                style={[
                  styles.colorOption,
                  isSelected && { borderColor: accent, borderWidth: 3 },
                ]}
                onPress={() => handleColorSelect(color.id)}
              >
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.color },
                  ]}
                >
                  <Text style={styles.colorIcon}>{color.icon}</Text>
                </View>
                <Text
                  style={[
                    styles.colorName,
                    { color: isSelected ? accent : COLORS.textSecondary },
                  ]}
                >
                  {color.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.colorHint, { color: COLORS.textSecondary }]}>
          Swipe or click to select your preferred color
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: accent }]}>
            <User size={32} color={COLORS.background} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
            Help us personalize your training experience
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={accent} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
              Personal Information
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                First Name <Text style={{ color: accent }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
                placeholder="John"
                placeholderTextColor={COLORS.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                Last Name <Text style={{ color: accent }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
                placeholder="Doe"
                placeholderTextColor={COLORS.textSecondary}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>
              Age <Text style={{ color: accent }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="25"
              placeholderTextColor={COLORS.textSecondary}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={accent} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
              Contact Details
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>
              Mobile Number <Text style={{ color: accent }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="+44 7700 900000"
              placeholderTextColor={COLORS.textSecondary}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color={accent} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
              Physical Stats
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                Height <Text style={{ color: accent }}>*</Text>
              </Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    heightUnit === 'cm' && { borderColor: accent },
                  ]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: heightUnit === 'cm' ? accent : COLORS.textSecondary },
                    ]}
                  >
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    heightUnit === 'ft' && { borderColor: accent },
                  ]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: heightUnit === 'ft' ? accent : COLORS.textSecondary },
                    ]}
                  >
                    ft
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="175"
              placeholderTextColor={COLORS.textSecondary}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: COLORS.textSecondary }]}>
                Weight <Text style={{ color: accent }}>*</Text>
              </Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'kg' && { borderColor: accent },
                  ]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: weightUnit === 'kg' ? accent : COLORS.textSecondary },
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'stone' && { borderColor: accent },
                  ]}
                  onPress={() => setWeightUnit('stone')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: weightUnit === 'stone' ? accent : COLORS.textSecondary },
                    ]}
                  >
                    stone
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="75"
              placeholderTextColor={COLORS.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>
              Muscle Mass <Text style={{ color: COLORS.textTertiary }}>(Optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, { borderColor: accent, color: COLORS.textPrimary }]}
              placeholder="35"
              placeholderTextColor={COLORS.textSecondary}
              value={muscleMass}
              onChangeText={setMuscleMass}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={accent} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>
              Choose Your Theme Color
            </Text>
          </View>

          {renderColorCarousel()}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: accent }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: accent }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: accent }]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={[styles.completeButtonText, { color: COLORS.background }]}>
                Complete Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '400' as const,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  colorCarouselContainer: {
    marginTop: 8,
  },
  colorCarousel: {
    paddingVertical: 16,
    gap: 16,
  },
  colorOption: {
    alignItems: 'center',
    width: 80,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIcon: {
    fontSize: 24,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  colorHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  completeButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
