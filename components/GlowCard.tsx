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
        { opacity: 0.4, blur: 16, spread: 0 },
        { opacity: 0.25, blur: 32, spread: 0 },
        { opacity: 0.15, blur: 48, spread: 0 },
      ],
      borderOpacity: 0.3,
    },
    medium: {
      shadowLayers: [
        { opacity: 0.5, blur: 20, spread: 0 },
        { opacity: 0.3, blur: 40, spread: 0 },
        { opacity: 0.2, blur: 60, spread: 0 },
      ],
      borderOpacity: 0.4,
    },
    strong: {
      shadowLayers: [
        { opacity: 0.6, blur: 24, spread: 0 },
        { opacity: 0.4, blur: 48, spread: 0 },
        { opacity: 0.25, blur: 72, spread: 0 },
        { opacity: 0.15, blur: 96, spread: 0 },
      ],
      borderOpacity: 0.5,
    },
  };

  const settings = intensitySettings[glowIntensity];

  const hexOpacity = Math.round(settings.borderOpacity * 255).toString(16).padStart(2, '0');
  const borderColor = `${accent}${hexOpacity}`;

  if (Platform.OS === 'web') {
    const boxShadows = settings.shadowLayers
      .map((layer) => {
        const shadowHexOpacity = Math.round(layer.opacity * 255).toString(16).padStart(2, '0');
        const spreadPx = layer.spread;
        return `0 0 ${layer.blur}px ${spreadPx}px ${accent}${shadowHexOpacity}`;
      })
      .join(', ');

    return (
      <View style={[styles.wrapper, style]}>
        <View
          style={[
            styles.glowLayerWeb,
            {
              boxShadow: boxShadows,
              borderWidth: 1.5,
              borderColor,
            },
          ]}
        />
        <View style={[styles.contentWrapper, { borderWidth: 1, borderColor }]}>
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
                elevation: 10 + index * 4,
                backgroundColor: '#1A1A1A',
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.contentWrapper, { borderWidth: 1.5, borderColor }]}>
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
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 24,
    pointerEvents: 'none' as const,
  },
  glowContainerNative: {
    position: 'absolute' as const,
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
  },
  glowLayerNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 10,
    overflow: 'hidden' as const,
    borderRadius: 16,
  },
});
