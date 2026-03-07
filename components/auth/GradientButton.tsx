import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY, NEON } from '@/constants/theme';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: GradientButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      stiffness: 400,
      damping: 25,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 400,
      damping: 25,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
      >
        <LinearGradient
          colors={[NEON.gradient.start, NEON.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, (disabled || loading) && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.text}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: SPACING.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.6,
  },
});
