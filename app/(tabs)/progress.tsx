import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyHeatmap } from '@/components/heatmap/BodyHeatmap';
import { BOTTOM_NAV_HEIGHT, COLORS, SPACING, TYPOGRAPHY, colorWithOpacity } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useHeatmapData } from '@/hooks/useHeatmapData';

import type { HeatmapPeriod } from '@/constants/heatmap/types';

const PERIODS: { key: HeatmapPeriod; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'three_months', label: '3 Months' },
  { key: 'all', label: 'All Time' },
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useTheme();
  const { muscleData, period, setPeriod, isLoading } = useHeatmapData();

  const scrollPaddingBottom = useMemo(() => {
    return BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md;
  }, [insets.bottom]);

  const handlePeriodChange = useCallback(
    (p: HeatmapPeriod) => setPeriod(p),
    [setPeriod],
  );

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Progress</Text>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {PERIODS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handlePeriodChange(key)}
                style={[
                  styles.periodChip,
                  period === key && {
                    backgroundColor: colorWithOpacity(accent, 0.15),
                    borderColor: colorWithOpacity(accent, 0.3),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodLabel,
                    period === key && { color: accent },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={accent} size="large" />
            </View>
          ) : (
            <BodyHeatmap muscleData={muscleData} accentColor={accent} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  periodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  periodChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colorWithOpacity(COLORS.textSecondary, 0.2),
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  loader: {
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
