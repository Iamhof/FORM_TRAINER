import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import tinycolor from 'tinycolor2';

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
  const glowTint = tinycolor.mix('#FFFFFF', accent, 25).toHexString();
  
  const intensitySettings = {
    subtle: {
      blurIntensity: 8,
      shadowLayers: [
        { opacity: 0.08, blur: 20, spread: 0 },
        { opacity: 0.05, blur: 35, spread: 0 },
      ],
      gradientOpacity: 0.04,
    },
    medium: {
      blurIntensity: 10,
      shadowLayers: [
        { opacity: 0.1, blur: 25, spread: 0 },
        { opacity: 0.08, blur: 40, spread: 0 },
        { opacity: 0.05, blur: 60, spread: 0 },
      ],
      gradientOpacity: 0.06,
    },
    strong: {
      blurIntensity: 12,
      shadowLayers: [
        { opacity: 0.15, blur: 30, spread: 0 },
        { opacity: 0.1, blur: 50, spread: 0 },
        { opacity: 0.06, blur: 80, spread: 0 },
      ],
      gradientOpacity: 0.08,
    },
  };

  const settings = intensitySettings[glowIntensity];

  if (Platform.OS === 'web') {
    const boxShadows = settings.shadowLayers
      .map((layer) => {
        const shadowHexOpacity = Math.round(layer.opacity * 255).toString(16).padStart(2, '0');
        const spreadPx = layer.blur / 6;
        return `0 0 ${layer.blur}px ${spreadPx}px ${glowTint}${shadowHexOpacity}`;
      })
      .join(', ');

    const gradientAlpha = Math.round(settings.gradientOpacity * 255).toString(16).padStart(2, '0');

    return (
      <View style={[styles.wrapper, style]}>
        <View style={styles.glowLayerWeb}>
          <LinearGradient
            colors={[`${glowTint}${gradientAlpha}`, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1.5 }}
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
              borderRadius: 24,
            },
          ]}
        />
        <BlurView
          intensity={settings.blurIntensity}
          tint="dark"
          style={styles.blurContainer}
        >
          <View style={styles.contentWrapper}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  const gradientAlpha = Math.round(settings.gradientOpacity * 255).toString(16).padStart(2, '0');

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.glowContainerNative}>
        {settings.shadowLayers.map((layer, index) => (
          <View
            key={`glow-${index}`}
            style={[
              styles.glowLayerNative,
              {
                shadowColor: glowTint,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: layer.opacity,
                shadowRadius: layer.blur / 2,
                elevation: 8 + index * 4,
                backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'transparent',
                opacity: Platform.OS === 'android' ? 0.001 : 1,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.gradientBackdrop}>
        <LinearGradient
          colors={[`${glowTint}${gradientAlpha}`, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>
      <BlurView
        intensity={settings.blurIntensity}
        tint="dark"
        style={styles.blurContainer}
      >
        <View style={styles.contentWrapper}>
          {children}
        </View>
      </BlurView>
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
    top: -24,
    left: -24,
    right: -24,
    bottom: -24,
    borderRadius: 32,
    pointerEvents: 'none' as const,
    zIndex: 0,
    overflow: 'visible' as const,
  },
  glowShadowWeb: {
    position: 'absolute' as const,
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  glowContainerNative: {
    position: 'absolute' as const,
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    zIndex: 0,
  },
  glowLayerNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  gradientBackdrop: {
    position: 'absolute' as const,
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 28,
    pointerEvents: 'none' as const,
    zIndex: 0,
    overflow: 'visible' as const,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    zIndex: 2,
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 3,
    borderRadius: 16,
  },
});
