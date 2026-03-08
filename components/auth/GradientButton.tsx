import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';

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
          colors={[`${NEON.primary}80`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, (disabled || loading) && styles.disabled]}
        >
          <View
            style={[
              styles.innerContainer,
              Platform.select({
                web: {
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                } as any,
                default: {},
              }),
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.text}>{title}</Text>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 16,
    padding: 1,
  },
  innerContainer: {
    paddingVertical: SPACING.md + 2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.select({
      web: 'rgba(255, 255, 255, 0.03)',
      android: 'rgba(18, 18, 20, 0.85)',
      default: 'rgba(255, 255, 255, 0.03)',
    }),
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
