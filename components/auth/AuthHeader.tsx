import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { COLORS, SPACING, NEON, colorWithOpacity } from '@/constants/theme';

import ChromaticText from './ChromaticText';

type AuthHeaderProps = {
  isSignUp: boolean;
};

export default function AuthHeader({ isSignUp }: AuthHeaderProps) {
  const iconGlow = Platform.select({
    ios: {
      shadowColor: NEON.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: `0 4px 20px ${colorWithOpacity(NEON.primary, 0.4)}`,
    } as any,
  });

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, iconGlow]}>
        <LinearGradient
          colors={[NEON.primary, NEON.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Zap size={32} color={COLORS.background} strokeWidth={2.5} fill={COLORS.background} />
        </LinearGradient>
      </View>

      <ChromaticText
        text={isSignUp ? 'JOIN THE\nCOLLECTIVE' : 'WELCOME\nBACK'}
        intensity={1}
      />

      <Text style={styles.subtitle}>
        {isSignUp
          ? 'start your fitness journey today'
          : 'sign in to continue your progress'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconWrapper: {
    marginBottom: SPACING.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
});
