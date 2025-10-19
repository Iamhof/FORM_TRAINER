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
    subtle: { opacity: 0.15, blur: 20, spread: 12 },
    medium: { opacity: 0.25, blur: 32, spread: 16 },
    strong: { opacity: 0.35, blur: 40, spread: 20 },
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
              opacity: config.opacity * 0.4,
              filter: `blur(${config.blur}px)`,
            },
          ]} 
        />
        <View 
          style={[
            styles.glowLayerWeb,
            styles.glowLayerMedium,
            {
              backgroundColor: accent,
              opacity: config.opacity * 0.6,
              filter: `blur(${config.blur * 0.6}px)`,
            },
          ]} 
        />
        <View 
          style={[
            styles.glowLayerWeb,
            styles.glowLayerSmall,
            {
              backgroundColor: accent,
              opacity: config.opacity * 0.8,
              filter: `blur(${config.blur * 0.4}px)`,
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
            shadowOffset: { width: 0, height: config.spread },
            shadowOpacity: config.opacity,
            shadowRadius: config.blur,
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
            shadowOffset: { width: 0, height: config.spread * 0.6 },
            shadowOpacity: config.opacity * 0.7,
            shadowRadius: config.blur * 0.7,
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
            shadowOffset: { width: 0, height: config.spread * 0.4 },
            shadowOpacity: config.opacity * 0.5,
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
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    borderRadius: 32,
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
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
  },
  glowLayerSmall: {
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },
});
