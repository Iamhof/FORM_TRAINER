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
  const glowOpacity = glowIntensity === 'subtle' ? 0.15 : glowIntensity === 'strong' ? 0.35 : 0.25;
  const blurAmount = glowIntensity === 'subtle' ? 30 : glowIntensity === 'strong' ? 50 : 40;
  
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.glowContainer, style]}>
        <View
          // @ts-ignore - web only styles
          style={[
            styles.glow,
            styles.glow1,
            {
              filter: `blur(${blurAmount}px)`,
            },
          ]}
        >
          <LinearGradient
            colors={[`${accent}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`, 'transparent']}
            style={styles.gradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1.2 }}
          />
        </View>

        <View
          // @ts-ignore - web only styles
          style={[
            styles.glow,
            styles.glow2,
            {
              filter: `blur(${blurAmount * 0.7}px)`,
            },
          ]}
        >
          <LinearGradient
            colors={[`${accent}${Math.round((glowOpacity * 1.5) * 255).toString(16).padStart(2, '0')}`, 'transparent']}
            style={styles.gradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1.0 }}
          />
        </View>

        <View style={styles.cardContent}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.glowContainer, style]}>
      <View style={styles.glowNativeWrapper}>
        <View
          style={[
            styles.glowNative,
            {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowOpacity * 0.8,
              shadowRadius: blurAmount * 0.5,
              elevation: 10,
            },
          ]}
        />
        <View
          style={[
            styles.glowNative,
            styles.glowNative2,
            {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowOpacity * 1.2,
              shadowRadius: blurAmount * 0.35,
              elevation: 15,
            },
          ]}
        />
      </View>

      <View style={styles.gradientOverlay}>
        <LinearGradient
          colors={[`${accent}${Math.round((glowOpacity * 0.3) * 255).toString(16).padStart(2, '0')}`, 'transparent']}
          style={styles.gradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1.2 }}
        />
      </View>

      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowContainer: {
    position: 'relative' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  glow: {
    position: 'absolute' as const,
    borderRadius: 24,
  },
  glow1: {
    width: '95%',
    height: '90%',
    opacity: 0.6,
  },
  glow2: {
    width: '90%',
    height: '80%',
    opacity: 0.8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  glowNativeWrapper: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
  },
  glowNative: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: Platform.OS === 'android' ? '#000000' : 'transparent',
  },
  glowNative2: {
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
  },
  gradientOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  cardContent: {
    zIndex: 1,
    width: '100%',
  },
});
