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
          styles.glowNative,
          {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 8,
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
  glowNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    position: 'relative' as const,
  },
});
