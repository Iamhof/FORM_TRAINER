import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import Card from '@/components/Card';
import { COLORS, SPACING } from '@/constants/theme';

const PLACEHOLDER_COLOR = COLORS.cardBorder;

function SkeletonBlock({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: PLACEHOLDER_COLOR, borderRadius: 8, opacity }, style]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Schedule header skeleton */}
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <SkeletonBlock style={styles.scheduleLabel} />
          <SkeletonBlock style={styles.schedulePlanned} />
        </View>
        <View style={styles.daysRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonBlock key={i} style={styles.dayChip} />
          ))}
        </View>
      </View>

      {/* Current Plan section */}
      <View style={styles.section}>
        <SkeletonBlock style={styles.sectionTitle} />
        <Card style={styles.programmeCard}>
          {/* Category pill + Active badge row */}
          <View style={styles.topRow}>
            <SkeletonBlock style={styles.categoryPill} />
            <SkeletonBlock style={styles.activeBadge} />
          </View>
          {/* Programme name */}
          <SkeletonBlock style={styles.programmeName} />
          {/* Progress row */}
          <View style={styles.progressRow}>
            <SkeletonBlock style={styles.progressLabel} />
            <SkeletonBlock style={styles.progressValue} />
          </View>
          {/* Progress bar */}
          <SkeletonBlock style={styles.progressBar} />
          {/* Next session button */}
          <SkeletonBlock style={styles.nextSessionBtn} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
  },
  scheduleSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  scheduleLabel: {
    width: 80,
    height: 12,
  },
  schedulePlanned: {
    width: 100,
    height: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 42,
    height: 76,
    borderRadius: 12,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    width: 130,
    height: 18,
    marginBottom: SPACING.md,
  },
  programmeCard: {
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryPill: {
    width: 100,
    height: 24,
  },
  activeBadge: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  programmeName: {
    width: '60%',
    height: 32,
    marginBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    width: 140,
    height: 11,
  },
  progressValue: {
    width: 80,
    height: 13,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: SPACING.lg,
  },
  nextSessionBtn: {
    height: 48,
    borderRadius: 14,
  },
});
