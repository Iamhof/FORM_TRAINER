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
      blurIntensity: 10,
      shadowLayers: [
        { opacity: 0.1, blur: 15, spread: 0 },
        { opacity: 0.08, blur: 25, spread: 0 },
      ],
      gradientOpacity: 0.08,
    },
    medium: {
      blurIntensity: 12,
      shadowLayers: [
        { opacity: 0.12, blur: 20, spread: 0 },
        { opacity: 0.1, blur: 30, spread: 0 },
      ],
      gradientOpacity: 0.1,
    },
    strong: {
      blurIntensity: 15,
      shadowLayers: [
        { opacity: 0.15, blur: 25, spread: 0 },
        { opacity: 0.12, blur: 35, spread: 0 },
        { opacity: 0.08, blur: 50, spread: 0 },
      ],
      gradientOpacity: 0.12,
    },
  };

  const settings = intensitySettings[glowIntensity];

  if (Platform.OS === 'web') {
    const boxShadows = settings.shadowLayers
      .map((layer) => {
        const shadowHexOpacity = Math.round(layer.opacity * 255).toString(16).padStart(2, '0');
        const spreadPx = layer.blur / 8;
        return `0 0 ${layer.blur}px ${spreadPx}px ${glowTint}${shadowHexOpacity}`;
      })
      .join(', ');

    const gradientAlpha = Math.round(settings.gradientOpacity * 255).toString(16).padStart(2, '0');

    return (
      <View style={[styles.wrapper, style]}>
        <View style={styles.glowLayerWeb}>
          <LinearGradient
            colors={[`${glowTint}${gradientAlpha}`, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 2.0 }}
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
                elevation: 10 + index * 5,
                backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'transparent',
                opacity: Platform.OS === 'android' ? 0.001 : 1,
              },
            ]}
          />
        ))}
      </View>
      <BlurView
        intensity={settings.blurIntensity}
        tint="dark"
        style={styles.blurContainer}
      >
        <LinearGradient
          colors={[`${glowTint}${gradientAlpha}`, 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 2.0 }}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
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
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 28,
    pointerEvents: 'none' as const,
    zIndex: 1,
    overflow: 'visible' as const,
  },
  glowShadowWeb: {
    position: 'absolute' as const,
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    pointerEvents: 'none' as const,
    zIndex: 1,
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
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    zIndex: 2,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  contentWrapper: {
    position: 'relative' as const,
    zIndex: 3,
    borderRadius: 16,
  },
});
