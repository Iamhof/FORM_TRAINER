import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';

import { COLORS, colorWithOpacity } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

// Re-export for backwards compatibility — prefer importing from '@/constants/theme'
export { colorWithOpacity };

const INTENSITY_CONFIG = {
  low: {
    borderOpacity: 0.3,
    ios: { shadowOpacity: 0.2, shadowRadius: 8 },
    android: { elevation: 3 },
    webShadowSize: 10,
    webShadowOpacity: 0.15,
  },
  medium: {
    borderOpacity: 0.5,
    ios: { shadowOpacity: 0.35, shadowRadius: 12 },
    android: { elevation: 6 },
    webShadowSize: 16,
    webShadowOpacity: 0.25,
  },
  high: {
    borderOpacity: 0.8,
    ios: { shadowOpacity: 0.6, shadowRadius: 30 },
    android: { elevation: 15 },
    webShadowSize: 30,
    webShadowOpacity: 0.45,
  },
} as const;

type GlowCardProps = {
  children: ReactNode;
  glowColor?: string;
  isActive?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  style?: ViewStyle;
};

export default function GlowCard({
  children,
  glowColor,
  isActive = true,
  intensity = 'medium',
  style
}: GlowCardProps) {
  const { accent } = useTheme();
  const resolvedGlowColor = glowColor || accent;
  if (!isActive) {
    return <View style={style}>{children}</View>;
  }

  const config = INTENSITY_CONFIG[intensity];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.glowBorder,
          {
            borderColor: colorWithOpacity(resolvedGlowColor, config.borderOpacity),
            shadowColor: resolvedGlowColor,
            ...Platform.select({
              ios: {
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: config.ios.shadowOpacity,
                shadowRadius: config.ios.shadowRadius,
              },
              android: {
                elevation: config.android.elevation,
              },
              web: {
                boxShadow: `0 0 ${config.webShadowSize}px ${colorWithOpacity(resolvedGlowColor, config.webShadowOpacity)}, 0 10px 15px rgba(0,0,0,0.5)`,
              } as any,
            }),
          }
        ]}
      >
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
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
  },
});
