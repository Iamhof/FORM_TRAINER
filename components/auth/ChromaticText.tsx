import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TextStyle } from 'react-native';

import { NEON } from '@/constants/theme';

type ChromaticTextProps = {
  text: string;
  style?: TextStyle;
  intensity?: number;
};

export default function ChromaticText({
  text,
  style,
  intensity = 1,
}: ChromaticTextProps) {
  const offsetX = NEON.chromatic.offsetX * intensity;
  const offsetY = NEON.chromatic.offsetY * intensity;

  const jitterX = useRef(new Animated.Value(0)).current;
  const jitterY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createJitter = () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(jitterX, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.timing(jitterX, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(jitterY, {
            toValue: 1,
            duration: 80,
            useNativeDriver: false,
          }),
          Animated.timing(jitterY, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ]),
      );

    const animation = createJitter();
    animation.start();

    return () => animation.stop();
  }, [jitterX, jitterY]);

  const animatedRedLeft = jitterX.interpolate({
    inputRange: [0, 1],
    outputRange: [-offsetX, -offsetX - 1],
  });

  const animatedRedTop = jitterY.interpolate({
    inputRange: [0, 1],
    outputRange: [-offsetY, -offsetY + 0.5],
  });

  const animatedBlueLeft = jitterX.interpolate({
    inputRange: [0, 1],
    outputRange: [offsetX, offsetX + 1],
  });

  const animatedBlueTop = jitterY.interpolate({
    inputRange: [0, 1],
    outputRange: [offsetY, offsetY - 0.5],
  });

  const baseTextStyle: TextStyle = {
    fontSize: 48,
    fontWeight: '800',
    fontStyle: 'italic',
    textAlign: 'center',
    ...style,
  };

  return (
    <View style={styles.container}>
      {/* Red channel — offset top-left */}
      <Animated.Text
        style={[
          baseTextStyle,
          styles.layer,
          {
            color: NEON.chromatic.red,
            opacity: 0.6,
            left: animatedRedLeft,
            top: animatedRedTop,
          },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {text}
      </Animated.Text>

      {/* Blue channel — offset bottom-right */}
      <Animated.Text
        style={[
          baseTextStyle,
          styles.layer,
          {
            color: NEON.chromatic.blue,
            opacity: 0.6,
            left: animatedBlueLeft,
            top: animatedBlueTop,
          },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {text}
      </Animated.Text>

      {/* Base layer — white, drives layout */}
      <Text
        style={[baseTextStyle, { color: 'white' }]}
        adjustsFontSizeToFit
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  layer: {
    position: 'absolute',
  },
});
