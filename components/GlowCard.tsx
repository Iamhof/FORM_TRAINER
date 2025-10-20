import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
        { opacity: 0.5, blur: 12, spread: 0 },
        { opacity: 0.35, blur: 24, spread: 0 },
        { opacity: 0.2, blur: 40, spread: 0 },
      ],
      borderOpacity: 0,
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

  if (Platform.OS === 'web') {
    const boxShadows = settings.shadowLayers
      .map((layer) => {
        const shadowHexOpacity = Math.round(layer.opacity * 255).toString(16).padStart(2, '0');
        const spreadPx = layer.blur / 6;
        return `0 0 ${layer.blur}px ${spreadPx}px ${accent}${shadowHexOpacity}`;
      })
      .join(', ');

    return (
      <View style={[styles.wrapper, style]}>
        <View style={styles.glowLayerWeb}>
          <LinearGradient
            colors={[`${accent}60`, `${accent}30`, `${accent}10`, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View
          // @ts-ignore - boxShadow is web-only
          style={[
            styles.glowShadowWeb,
            {
              backgroundColor: 'transparent',
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
                shadowOpacity: layer.opacity * 1.3,
                shadowRadius: layer.blur / 2.5,
                elevation: 15 + index * 8,
                backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'transparent',
                opacity: Platform.OS === 'android' ? 0.001 : 1,
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
    overflow: 'visible' as const,
  },
  glowLayerWeb: {
    position: 'absolute' as const,
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 32,
    pointerEvents: 'none' as const,
    zIndex: 1,
    overflow: 'visible' as const,
  },
  glowShadowWeb: {
    position: 'absolute' as const,
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 24,
    pointerEvents: 'none' as const,
    zIndex: 1,
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
    zIndex: 2,
    borderRadius: 16,
  },
});
