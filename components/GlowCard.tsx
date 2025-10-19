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
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrapper, style]}>
        <View 
          style={[
            styles.glowWeb,
            {
              backgroundColor: accent,
              filter: `blur(60px)`,
              opacity: 0.3,
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
          styles.glowLayer1,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            backgroundColor: 'transparent',
          },
        ]} 
      />
      <View 
        style={[
          styles.glowLayer2,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            backgroundColor: 'transparent',
          },
        ]} 
      />
      <View 
        style={[
          styles.glowLayer3,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            backgroundColor: 'transparent',
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
  glowWeb: {
    position: 'absolute' as const,
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 32,
    pointerEvents: 'none' as const,
  },
  glowLayer1: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  glowLayer2: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  glowLayer3: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 1,
  },
});
