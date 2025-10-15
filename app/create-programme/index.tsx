import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 120;
const ITEM_HEIGHT = 100;

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function CreateProgrammeScreen() {
  const { accent } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'frequency' | 'duration'>('name');
  const [programmeName, setProgrammeName] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState(3);
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [centerFrequency, setCenterFrequency] = useState(3);
  const [centerDuration, setCenterDuration] = useState(4);
  const frequencyScrollRef = useRef<ScrollView>(null);
  const durationScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (step === 'frequency' && frequencyScrollRef.current) {
      const index = FREQUENCY_OPTIONS.indexOf(selectedFrequency);
      setTimeout(() => {
        frequencyScrollRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    } else if (step === 'duration' && durationScrollRef.current) {
      const index = DURATION_OPTIONS.indexOf(selectedDuration);
      setTimeout(() => {
        durationScrollRef.current?.scrollTo({
          x: index * ITEM_WIDTH,
          animated: false,
        });
      }, 100);
    }
  }, [step]);

  const handleFrequencyScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const centerValue = FREQUENCY_OPTIONS[index];
    if (centerValue !== undefined) {
      setCenterFrequency(centerValue);
    }
  };

  const handleFrequencyScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const selectedValue = FREQUENCY_OPTIONS[index];
    if (selectedValue !== undefined && selectedValue !== selectedFrequency) {
      setSelectedFrequency(selectedValue);
    }
  };

  const handleDurationScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const centerValue = DURATION_OPTIONS[index];
    if (centerValue !== undefined) {
      setCenterDuration(centerValue);
    }
  };

  const handleDurationScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const selectedValue = DURATION_OPTIONS[index];
    if (selectedValue !== undefined && selectedValue !== selectedDuration) {
      setSelectedDuration(selectedValue);
    }
  };

  const handleContinue = () => {
    if (step === 'name') {
      setStep('frequency');
    } else if (step === 'frequency') {
      setStep('duration');
    } else {
      router.push(`/create-programme/days?name=${encodeURIComponent(programmeName)}&frequency=${selectedFrequency}&duration=${selectedDuration}` as any);
    }
  };

  const handleBack = () => {
    if (step === 'duration') {
      setStep('frequency');
    } else if (step === 'frequency') {
      setStep('name');
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.background}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitle: 'Create Programme',
          headerTitleStyle: { fontSize: 16, fontWeight: '600' as const },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
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
          {step === 'name' ? (
            <>
              <Text style={styles.title}>Name your programme</Text>
              <Text style={styles.subtitle}>Give it a name that motivates you</Text>

              <TextInput
                style={[styles.input, { borderColor: accent }]}
                placeholder="e.g., Summer Shred, Strength Builder"
                placeholderTextColor={COLORS.textTertiary}
                value={programmeName}
                onChangeText={setProgrammeName}
                autoFocus
              />
            </>
          ) : step === 'frequency' ? (
            <>
              <Text style={styles.title}>Training frequency</Text>
              <Text style={styles.subtitle}>How many days per week will you train?</Text>

              <View style={styles.verticalPickerContainer}>
                <View style={[styles.selectionLineHorizontal, styles.topLine]} />
                <View style={[styles.selectionLineHorizontal, styles.bottomLine]} />
                <ScrollView
                  ref={frequencyScrollRef}
                  style={styles.verticalPicker}
                  contentContainerStyle={styles.verticalPickerContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onScroll={handleFrequencyScroll}
                  onMomentumScrollEnd={handleFrequencyScrollEnd}
                  scrollEventThrottle={16}
                >
                  {FREQUENCY_OPTIONS.map((option, index) => {
                    const isSelected = centerFrequency === option;
                    return (
                      <Pressable
                        key={option}
                        style={styles.verticalPickerItem}
                        onPress={() => {
                          setSelectedFrequency(option);
                          setCenterFrequency(option);
                          frequencyScrollRef.current?.scrollTo({
                            y: index * ITEM_HEIGHT,
                            animated: true,
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            isSelected && { color: accent, fontSize: 80, fontWeight: '700' as const },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.unit}>days/week</Text>
              <Text style={styles.hint}>Drag or tap to select</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Programme duration</Text>
              <Text style={styles.subtitle}>How many weeks will your programme run?</Text>

              <View style={styles.pickerContainer}>
                <View style={[styles.selectionLine, styles.leftLine]} />
                <View style={[styles.selectionLine, styles.rightLine]} />
                <ScrollView
                  ref={durationScrollRef}
                  horizontal
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={ITEM_WIDTH}
                  decelerationRate="fast"
                  onScroll={handleDurationScroll}
                  onMomentumScrollEnd={handleDurationScrollEnd}
                  scrollEventThrottle={16}
                >
                  {DURATION_OPTIONS.map((option, index) => {
                    const isSelected = centerDuration === option;
                    return (
                      <Pressable
                        key={option}
                        style={styles.pickerItem}
                        onPress={() => {
                          setSelectedDuration(option);
                          setCenterDuration(option);
                          durationScrollRef.current?.scrollTo({
                            x: index * ITEM_WIDTH,
                            animated: true,
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            isSelected && { color: accent, fontSize: 80, fontWeight: '700' as const },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.unit}>weeks</Text>
              <Text style={styles.hint}>Drag or tap to select</Text>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.footerButton, { borderColor: COLORS.textPrimary }]}
            onPress={handleBack}
          >
            <ChevronLeft size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={styles.footerButtonText}>Back</Text>
          </Pressable>

          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
          />
          <ChevronRight size={20} color={COLORS.background} strokeWidth={2} style={styles.chevron} />
        </View>
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
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  verticalPickerContainer: {
    height: 300,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
    position: 'relative' as const,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  verticalPicker: {
    height: 300,
    width: '100%',
  },
  verticalPickerContent: {
    paddingVertical: 150,
    alignItems: 'center',
  },
  verticalPickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerContainer: {
    height: 200,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
    position: 'relative' as const,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  picker: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  pickerContent: {
    paddingHorizontal: (SCREEN_WIDTH / 2) - (ITEM_WIDTH / 2),
    alignItems: 'center',
  },
  pickerItem: {
    width: ITEM_WIDTH,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 56,
    fontWeight: '500' as const,
    color: COLORS.textTertiary,
    textAlign: 'center' as const,
  },
  selectionLineHorizontal: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.textTertiary,
    zIndex: 10,
  },
  topLine: {
    top: 150 - (ITEM_HEIGHT / 2) - 2,
  },
  bottomLine: {
    bottom: 150 - ITEM_HEIGHT,
  },
  selectionLine: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.textTertiary,
    zIndex: 10,
  },
  leftLine: {
    left: (SCREEN_WIDTH / 2) - (ITEM_WIDTH / 2),
  },
  rightLine: {
    right: (SCREEN_WIDTH / 2) - (ITEM_WIDTH / 2),
  },
  unit: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center' as const,
  },
  hint: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center' as const,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  continueButton: {
    flex: 1,
  },
  chevron: {
    position: 'absolute' as const,
    right: SPACING.lg + SPACING.md,
    pointerEvents: 'none' as const,
  },
});
