import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

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
  const intensityConfig = {
    subtle: { opacity: 0.08, blur: 24, spread: 8 },
    medium: { opacity: 0.12, blur: 32, spread: 10 },
    strong: { opacity: 0.18, blur: 40, spread: 14 },
  };

  const config = intensityConfig[glowIntensity];

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View 
          style={[
            styles.glowLayerWeb,
            {
              backgroundColor: accent,
              opacity: config.opacity * 0.3,
              filter: `blur(${config.blur * 1.5}px)`,
            },
          ]} 
        />
        <View 
          style={[
            styles.glowLayerWeb,
            styles.glowLayerMedium,
            {
              backgroundColor: accent,
              opacity: config.opacity * 0.5,
              filter: `blur(${config.blur}px)`,
            },
          ]} 
        />
        <View 
          style={[
            styles.glowLayerWeb,
            styles.glowLayerSmall,
            {
              backgroundColor: accent,
              opacity: config.opacity * 0.7,
              filter: `blur(${config.blur * 0.5}px)`,
            },
          ]} 
        />
        <View 
          style={[
            styles.glowLayerWeb,
            styles.glowLayerTiny,
            {
              backgroundColor: accent,
              opacity: config.opacity,
              filter: `blur(${config.blur * 0.3}px)`,
            },
          ]} 
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View 
        style={[
          styles.glowLayerNative,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: config.opacity * 0.6,
            shadowRadius: config.blur * 1.2,
            elevation: config.spread,
          },
        ]} 
      />
      <View 
        style={[
          styles.glowLayerNative,
          styles.glowLayerMedium,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: config.opacity * 0.5,
            shadowRadius: config.blur * 0.8,
            elevation: config.spread * 0.7,
          },
        ]} 
      />
      <View 
        style={[
          styles.glowLayerNative,
          styles.glowLayerSmall,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: config.opacity * 0.4,
            shadowRadius: config.blur * 0.5,
            elevation: config.spread * 0.5,
          },
        ]} 
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
  },
  glowLayerWeb: {
    position: 'absolute' as const,
    top: -32,
    left: -32,
    right: -32,
    bottom: -32,
    borderRadius: 24,
    pointerEvents: 'none' as const,
    zIndex: -1,
  },
  glowLayerNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    zIndex: -1,
  },
  glowLayerMedium: {
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
  },
  glowLayerSmall: {
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
  },
  glowLayerTiny: {
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
  },
});
