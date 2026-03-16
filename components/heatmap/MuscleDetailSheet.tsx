import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import GlowCard from '@/components/GlowCard';
import { REGION_LABELS } from '@/constants/heatmap/types';
import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';

import type { MuscleRegion, MuscleVolumeData } from '@/constants/heatmap/types';

type MuscleDetailSheetProps = {
  region: MuscleRegion;
  data: MuscleVolumeData;
  accentColor: string;
};

export function MuscleDetailSheet({ region, data, accentColor }: MuscleDetailSheetProps) {
  const label = REGION_LABELS[region];
  const intensityPct = Math.round(data.intensity * 100);

  return (
    <GlowCard glowColor={accentColor} intensity="low" style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title}>{label}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {data.volume >= 1000
                ? `${(data.volume / 1000).toFixed(1)}t`
                : `${data.volume}kg`}
            </Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.sets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>{intensityPct}%</Text>
            <Text style={styles.statLabel}>Intensity</Text>
          </View>
        </View>

        <View style={styles.intensityBarBg}>
          <View
            style={[
              styles.intensityBarFill,
              {
                width: `${intensityPct}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  intensityBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colorWithOpacity(COLORS.textSecondary, 0.15),
    overflow: 'hidden',
  },
  intensityBarFill: {
    height: 6,
    borderRadius: 3,
  },
});
