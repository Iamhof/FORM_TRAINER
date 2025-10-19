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
              filter: `blur(40px)`,
              opacity: 0.15,
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
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 8,
          },
        ]} 
      />
      <View 
        style={[
          styles.glowLayer2,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
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
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 32,
    pointerEvents: 'none' as const,
  },
  glowLayer1: {
    position: 'absolute' as const,
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 24,
    backgroundColor: '#000',
  },
  glowLayer2: {
    position: 'absolute' as const,
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  contentWrapper: {
    position: 'relative' as const,
  },
});
