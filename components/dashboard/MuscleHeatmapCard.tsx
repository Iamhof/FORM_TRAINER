import { ChevronRight, Lock } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';
import { useHeatmapData } from '@/hooks/useHeatmapData';

const BodyView = React.lazy(() =>
  import('@/components/heatmap/BodyView').then((m) => ({ default: m.BodyView })),
);
const HeatmapLegend = React.lazy(() =>
  import('@/components/heatmap/HeatmapLegend').then((m) => ({ default: m.HeatmapLegend })),
);

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

  return (
    <Card style={styles.card}>
      <View style={styles.heatmapContainer}>
        {isPremium ? (
          /* Premium: lazy-load SVG heatmap */
          isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={accent} size="large" />
            </View>
          ) : (
            <React.Suspense
              fallback={
                <View style={styles.loader}>
                  <ActivityIndicator color={accent} size="large" />
                </View>
              }
            >
              <View style={styles.bodyWrapper}>
                <View style={styles.bodyScaler}>
                  <BodyView
                    view="front"
                    muscleData={muscleData}
                    accentColor={accent}
                    onRegionPress={handleRegionPress}
                  />
                </View>
              </View>
            </React.Suspense>
          )
        ) : (
          /* Free: static promo card — no SVG loaded */
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
        )}
      </View>

      {/* Legend + See More (premium only) */}
      {isPremium && (
        <React.Suspense fallback={null}>
          <HeatmapLegend accentColor={accent} />
          <Pressable onPress={onSeeMore} style={styles.seeMoreRow}>
            <Text style={[styles.seeMoreText, { color: accent }]}>See More</Text>
            <ChevronRight size={16} color={accent} strokeWidth={2.5} />
          </Pressable>
        </React.Suspense>
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
  lockOverlay: {
    flex: 1,
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
