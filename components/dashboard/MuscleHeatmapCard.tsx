import { BlurView } from 'expo-blur';
import { ChevronRight, Lock } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { BodyView } from '@/components/heatmap/BodyView';
import { HeatmapLegend } from '@/components/heatmap/HeatmapLegend';
import { MUSCLE_REGIONS } from '@/constants/heatmap/types';
import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';
import { useHeatmapData } from '@/hooks/useHeatmapData';

import type { MuscleRegion, MuscleVolumeData } from '@/constants/heatmap/types';

const EMPTY_DATA: Record<MuscleRegion, MuscleVolumeData> = Object.fromEntries(
  MUSCLE_REGIONS.map((r) => [r, { volume: 0, sets: 0, intensity: 0 }]),
) as Record<MuscleRegion, MuscleVolumeData>;

const noop = () => {};

type MuscleHeatmapCardProps = {
  accent: string;
  isPremium: boolean;
  onUpgrade: () => void;
  onSeeMore: () => void;
};

export function MuscleHeatmapCard({
  accent,
  isPremium,
  onUpgrade,
  onSeeMore,
}: MuscleHeatmapCardProps) {
  const { muscleData, isLoading } = useHeatmapData('month', isPremium);
  const handleRegionPress = useCallback(noop, []);

  const data = isPremium ? muscleData : EMPTY_DATA;

  return (
    <Card style={styles.card}>
      <View style={styles.heatmapContainer}>
        {isLoading && isPremium ? (
          <View style={styles.loader}>
            <ActivityIndicator color={accent} size="large" />
          </View>
        ) : (
          <View style={styles.bodyWrapper}>
            <View style={styles.bodyScaler}>
              <BodyView
                view="front"
                muscleData={data}
                accentColor={accent}
                onRegionPress={handleRegionPress}
              />
            </View>
          </View>
        )}

        {/* Premium lock overlay */}
        {!isPremium && (
          <View style={StyleSheet.absoluteFill}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <View style={styles.lockOverlay}>
              <View style={[styles.lockIcon, { backgroundColor: colorWithOpacity(accent, 0.15) }]}>
                <Lock size={24} color={accent} strokeWidth={2} />
              </View>
              <Text style={styles.lockTitle}>MUSCLE ACTIVITY</Text>
              <Text style={styles.lockSubtitle}>
                See which muscles you train most
              </Text>
              <Pressable
                onPress={onUpgrade}
                style={[styles.upgradeBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to PRO</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Legend + See More (premium only) */}
      {isPremium && (
        <>
          <HeatmapLegend accentColor={accent} />
          <Pressable onPress={onSeeMore} style={styles.seeMoreRow}>
            <Text style={[styles.seeMoreText, { color: accent }]}>See More</Text>
            <ChevronRight size={16} color={accent} strokeWidth={2.5} />
          </Pressable>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  heatmapContainer: {
    height: 280,
    overflow: 'hidden',
    position: 'relative',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScaler: {
    transform: [{ scale: 0.54 }],
  },
  androidBlur: {
    backgroundColor: 'rgba(8, 8, 10, 0.85)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  lockSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  upgradeBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
  seeMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.md,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
