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
        { opacity: 0.15, blur: 8, spread: 0 },
        { opacity: 0.1, blur: 16, spread: 0 },
      ],
      webBlur: 12,
      webOpacity: 0.2,
    },
    medium: {
      shadowLayers: [
        { opacity: 0.25, blur: 12, spread: 0 },
        { opacity: 0.15, blur: 24, spread: 0 },
        { opacity: 0.1, blur: 40, spread: 0 },
      ],
      webBlur: 20,
      webOpacity: 0.3,
    },
    strong: {
      shadowLayers: [
        { opacity: 0.4, blur: 16, spread: 0 },
        { opacity: 0.25, blur: 32, spread: 0 },
        { opacity: 0.15, blur: 48, spread: 0 },
        { opacity: 0.1, blur: 64, spread: 0 },
      ],
      webBlur: 28,
      webOpacity: 0.4,
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
                boxShadow: `0 0 ${layer.blur}px ${layer.blur / 2}px ${accent}`,
                opacity: layer.opacity,
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
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 1,
  },
});
