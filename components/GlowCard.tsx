import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';

type GlowCardProps = {
  children: ReactNode;
  glowColor?: string;
  isActive?: boolean;
  style?: ViewStyle;
};

export default function GlowCard({ 
  children, 
  glowColor = COLORS.accents.orange,
  isActive = true,
  style
}: GlowCardProps) {
  if (!isActive) {
    return <View style={style}>{children}</View>;
  }

  const colorWithOpacity = (hex: string, alpha: number) => {
    const rgb = hex.match(/\d+/g);
    if (!rgb || rgb.length < 3) return `rgba(255, 107, 85, ${alpha})`;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.glowWrapper, styles.glow1]}>
        <LinearGradient
          colors={[colorWithOpacity(glowColor, 0.2), colorWithOpacity(glowColor, 0)]}
          style={styles.glowInner}
        />
      </View>

      <View style={[styles.glowWrapper, styles.glow2]}>
        <LinearGradient
          colors={[colorWithOpacity(glowColor, 0.4), colorWithOpacity(glowColor, 0)]}
          style={styles.glowInner}
        />
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
    width: '100%',
  },
  glowWrapper: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
  glow1: {
    transform: [{ scale: 1.15 }, { translateY: 10 }],
    opacity: 0.5,
  },
  glow2: {
    transform: [{ scale: 1.0 }, { translateY: 15 }],
    opacity: 0.9,
  },
  glowInner: {
    flex: 1,
    borderRadius: 50,
  },
  content: {
    zIndex: 5,
  },
});
