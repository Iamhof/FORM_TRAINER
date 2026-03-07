import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform, TextInputProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';

import { COLORS, SPACING, NEON } from '@/constants/theme';

type NeonInputProps = {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  error?: string;
  testID?: string;
};

export default function NeonInput({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  autoComplete,
  error,
  testID,
}: NeonInputProps) {
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    focusProgress.value = withTiming(1, { duration: 300 });
  };

  const handleBlur = () => {
    focusProgress.value = withDelay(50, withTiming(0, { duration: 300 }));
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [NEON.glow.border.idle, NEON.glow.border.focus],
    );

    // Type-safe style object for React Native
    const baseStyle: ViewStyle = { borderColor };

    if (Platform.OS === 'ios') {
      baseStyle.shadowOpacity = focusProgress.value * 0.35;
      baseStyle.shadowRadius =
        NEON.glow.radius.idle +
        focusProgress.value *
          (NEON.glow.radius.focus - NEON.glow.radius.idle);
    }

    return baseStyle;
  });

  const webGlowStyle =
    Platform.OS === 'web'
      ? ({
          shadowColor: NEON.primary,
          boxShadow: `0 0 ${NEON.glow.radius.idle}px ${NEON.glow.shadow.idle}`,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        } as any)
      : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>

      <Animated.View
        style={[
          styles.inputWrapper,
          Platform.OS === 'ios' && {
            shadowColor: NEON.primary,
            shadowOffset: { width: 0, height: 0 },
          },
          webGlowStyle,
          animatedBorderStyle,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          accessibilityLabel={label}
          testID={testID}
        />
      </Animated.View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs + 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: NEON.glow.border.idle,
    backgroundColor: COLORS.cardBackground,
  },
  input: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    fontSize: 14,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 2,
  },
});
