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

  const colorWithOpacity = (color: string, alpha: number) => {
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return `rgba(255, 107, 85, ${alpha})`;
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(255, 107, 85, ${alpha})`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.glowContainer}>
        <View style={[styles.glowWrapper, styles.glow1]}>
          <LinearGradient
            colors={[colorWithOpacity(glowColor, 0.25), colorWithOpacity(glowColor, 0)]}
            style={styles.glowInner}
          />
        </View>

        <View style={[styles.glowWrapper, styles.glow2]}>
          <LinearGradient
            colors={[colorWithOpacity(glowColor, 0.5), colorWithOpacity(glowColor, 0)]}
            style={styles.glowInner}
          />
        </View>
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
    overflow: 'visible',
  },
  glowContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
        filter: 'blur(70px)',
      } as any,
    }),
  },
  glow1: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.4 }, { translateY: 15 }],
    opacity: 0.6,
  },
  glow2: {
    transform: [{ scaleX: 1.05 }, { scaleY: 1.2 }, { translateY: 20 }],
    opacity: 1,
  },
  glowInner: {
    flex: 1,
    borderRadius: 50,
  },
  content: {
    zIndex: 5,
  },
});
