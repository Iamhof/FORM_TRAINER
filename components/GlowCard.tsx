import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
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

  const borderGlowStyle = Platform.select({
    web: {
      boxShadow: `0 0 20px ${colorWithOpacity(glowColor, 0.3)}, 0 0 40px ${colorWithOpacity(glowColor, 0.15)}, inset 0 0 80px ${colorWithOpacity(glowColor, 0.05)}`,
    },
    default: {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.glowBorder, { borderColor: colorWithOpacity(glowColor, 0.3) }, borderGlowStyle as any]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
  },
  glowBorder: {
    borderWidth: 1,
    borderRadius: 16,
  },
});
