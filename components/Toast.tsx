import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

type ToastProps = {
  message: string;
  visible: boolean;
  duration?: number;
  onHide: () => void;
  accentColor?: string;
};

export default function Toast({
  message,
  visible,
  duration = 1800,
  onHide,
  accentColor = COLORS.success,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const handleHide = useCallback(() => {
    onHideRef.current();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => handleHide());
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible, duration, opacity, translateY, handleHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: accentColor,
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  message: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
