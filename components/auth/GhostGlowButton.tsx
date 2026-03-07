import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, Platform } from 'react-native';

import { SPACING, TYPOGRAPHY, NEON, colorWithOpacity } from '@/constants/theme';

type GhostGlowButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export default function GhostGlowButton({
  title,
  onPress,
  disabled = false,
  testID,
}: GhostGlowButtonProps) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(flashAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colorWithOpacity(NEON.primary, 0.1)],
  });

  const glowShadow = Platform.select({
    ios: {
      shadowColor: NEON.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: `0 0 16px ${colorWithOpacity(NEON.primary, 0.25)}`,
    } as any,
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.button,
          glowShadow,
          { backgroundColor },
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colorWithOpacity(NEON.primary, 0.6),
  },
  text: {
    ...TYPOGRAPHY.button,
    color: NEON.primary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
});
