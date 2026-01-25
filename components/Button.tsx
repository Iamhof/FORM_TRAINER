import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const { accent } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (variant === 'primary') {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        stiffness: 400,
        damping: 25,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (variant === 'primary') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        stiffness: 400,
        damping: 25,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', `${accent}1A`],
  });

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
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
            variant === 'primary' && { backgroundColor: accent },
            variant === 'outline' && { 
              backgroundColor,
              borderWidth: 2, 
              borderColor: accent 
            },
            disabled && styles.disabled,
          ]}
        >
          <Text
            style={[
              styles.text,
              variant === 'outline' && { color: accent },
            ]}
          >
            {title}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
