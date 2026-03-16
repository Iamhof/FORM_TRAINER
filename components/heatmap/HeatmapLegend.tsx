import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';

type HeatmapLegendProps = {
  accentColor: string;
};

export function HeatmapLegend({ accentColor }: HeatmapLegendProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Low</Text>
      <View style={styles.barWrapper}>
        <Svg width="100%" height={12}>
          <Defs>
            <LinearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity={0} />
              <Stop offset="100%" stopColor={accentColor} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width="100%"
            height={12}
            rx={6}
            fill="url(#legendGrad)"
          />
        </Svg>
      </View>
      <Text style={styles.label}>High</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  barWrapper: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: colorWithOpacity(COLORS.textSecondary, 0.1),
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
});
