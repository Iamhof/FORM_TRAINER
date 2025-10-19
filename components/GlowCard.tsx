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
  const intensitySettings = {
    subtle: {
      shadowLayers: [
        { opacity: 0.15, blur: 20, spread: 0 },
        { opacity: 0.08, blur: 30, spread: 0 },
        { opacity: 0.04, blur: 40, spread: 0 },
      ],
    },
    medium: {
      shadowLayers: [
        { opacity: 0.2, blur: 24, spread: 0 },
        { opacity: 0.12, blur: 36, spread: 0 },
        { opacity: 0.06, blur: 48, spread: 0 },
      ],
    },
    strong: {
      shadowLayers: [
        { opacity: 0.25, blur: 28, spread: 0 },
        { opacity: 0.15, blur: 42, spread: 0 },
        { opacity: 0.08, blur: 56, spread: 0 },
        { opacity: 0.04, blur: 72, spread: 0 },
      ],
    },
  };

  const settings = intensitySettings[glowIntensity];

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrapper, style]}>
        {settings.shadowLayers.map((layer, index) => (
          <View
            key={`glow-${index}`}
            style={[
              styles.glowLayerWeb,
              {
                boxShadow: `0 0 ${layer.blur}px ${layer.blur * 0.3}px ${accent}${Math.round(layer.opacity * 255).toString(16).padStart(2, '0')}`,
              },
            ]}
          />
        ))}
        <View style={styles.contentWrapper}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {settings.shadowLayers.map((layer, index) => (
        <View
          key={`glow-${index}`}
          style={[
            styles.glowLayerNative,
            {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: layer.opacity,
              shadowRadius: layer.blur,
            },
          ]}
        />
      ))}
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
  glowLayerWeb: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    pointerEvents: 'none' as const,
  },
  glowLayerNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.001)',
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 1,
  },
});
