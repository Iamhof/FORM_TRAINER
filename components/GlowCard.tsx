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
        { opacity: 0.2, blur: 24, spread: -2 },
        { opacity: 0.12, blur: 36, spread: -4 },
        { opacity: 0.08, blur: 48, spread: -6 },
      ],
    },
    medium: {
      shadowLayers: [
        { opacity: 0.25, blur: 28, spread: -2 },
        { opacity: 0.15, blur: 42, spread: -4 },
        { opacity: 0.10, blur: 56, spread: -6 },
      ],
    },
    strong: {
      shadowLayers: [
        { opacity: 0.3, blur: 32, spread: 0 },
        { opacity: 0.2, blur: 48, spread: 0 },
        { opacity: 0.12, blur: 64, spread: 0 },
        { opacity: 0.06, blur: 80, spread: 0 },
      ],
    },
  };

  const settings = intensitySettings[glowIntensity];

  if (Platform.OS === 'web') {
    const boxShadows = settings.shadowLayers
      .map((layer) => {
        const hexOpacity = Math.round(layer.opacity * 255).toString(16).padStart(2, '0');
        const spreadPx = layer.spread;
        return `0 0 ${layer.blur}px ${spreadPx}px ${accent}${hexOpacity}`;
      })
      .join(', ');

    return (
      <View style={[styles.wrapper, style]}>
        <View
          style={[
            styles.glowLayerWeb,
            {
              boxShadow: boxShadows,
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
      <View style={styles.glowContainerNative}>
        {settings.shadowLayers.map((layer, index) => (
          <View
            key={`glow-${index}`}
            style={[
              styles.glowLayerNative,
              {
                shadowColor: accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: layer.opacity,
                shadowRadius: layer.blur / 2,
                elevation: 8 + index * 2,
              },
            ]}
          />
        ))}
      </View>
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
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    pointerEvents: 'none' as const,
  },
  glowContainerNative: {
    position: 'absolute' as const,
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
  },
  glowLayerNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 10,
    overflow: 'hidden' as const,
    borderRadius: 16,
  },
});
