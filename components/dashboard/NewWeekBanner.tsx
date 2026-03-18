import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';

import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';

type NewWeekBannerProps = {
  scheduledCount: number;
  targetCount: number;
  onPress: () => void;
  accent: string;
};

export default function NewWeekBanner({
  scheduledCount,
  targetCount,
  onPress,
  accent,
}: NewWeekBannerProps) {
  const remaining = targetCount - scheduledCount;
  const message = `Pick ${remaining} more training days`;

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={[colorWithOpacity(accent, 0.5), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View
          style={[
            styles.innerContainer,
            Platform.select({
              web: {
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              } as any,
              default: {},
            }),
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: colorWithOpacity(accent, 0.1) }]}>
            <Calendar size={18} color={accent} strokeWidth={2} />
          </View>
          <View style={styles.textArea}>
            <Text style={styles.title}>WEEK SETUP</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>
          <ChevronRight size={18} color={accent} strokeWidth={2.5} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: 15,
    backgroundColor: Platform.select({
      web: 'rgba(255, 255, 255, 0.03)',
      android: 'rgba(18, 18, 20, 0.85)',
      default: 'rgba(255, 255, 255, 0.03)',
    }),
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    marginBottom: 2,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
