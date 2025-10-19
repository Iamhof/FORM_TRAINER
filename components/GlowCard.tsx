import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';

type GlowCardProps = {
  children: ReactNode;
  accent: string;
  style?: ViewStyle;
  glowIntensity?: 'subtle' | 'medium' | 'strong';
};

export default function GlowCard({ 
  children, 
  accent, 
  style,
  glowIntensity = 'medium'
}: GlowCardProps) {
  const intensityMap = {
    subtle: { opacity: 0.3, blur: 16 },
    medium: { opacity: 0.5, blur: 20 },
    strong: { opacity: 0.7, blur: 24 },
  };

  const { opacity, blur } = intensityMap[glowIntensity];

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrapper, style]}>
        <View 
          style={[
            styles.glowBorder,
            {
              borderColor: accent,
              filter: `blur(${blur}px)`,
              opacity,
            },
          ]} 
        />
        <View style={styles.contentWrapper}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View 
        style={[
          styles.glowBorder,
          {
            borderColor: accent,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: opacity,
            shadowRadius: blur,
          },
        ]} 
      />
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative' as const,
  },
  glowBorder: {
    position: 'absolute' as const,
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 1,
  },
});
