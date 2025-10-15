import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING } from '@/constants/theme';
import { MonthlyDataPoint } from '@/types/analytics';

type LineChartProps = {
  data: MonthlyDataPoint[];
  color: string;
  height?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
};

const CHART_WIDTH = Dimensions.get('window').width - SPACING.md * 4;
const DEFAULT_HEIGHT = 180;

export default function LineChart({
  data,
  color,
  height = DEFAULT_HEIGHT,
  showValues = false,
  formatValue = (v) => v.toString(),
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], maxValue: 0, minValue: 0 };

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const pointSpacing = CHART_WIDTH / (data.length - 1 || 1);
    const chartHeight = height - 40;

    const points = data.map((item, index) => {
      const x = index * pointSpacing;
      const normalizedValue = (item.value - minValue) / range;
      const y = chartHeight - normalizedValue * chartHeight;

      return { x, y, value: item.value, month: item.month };
    });

    return { points, maxValue, minValue };
  }, [data, height]);

  const pathD = useMemo(() => {
    if (chartData.points.length === 0) return '';

    let path = `M ${chartData.points[0].x} ${chartData.points[0].y}`;

    for (let i = 1; i < chartData.points.length; i++) {
      const prev = chartData.points[i - 1];
      const curr = chartData.points[i];

      const controlX1 = prev.x + (curr.x - prev.x) / 3;
      const controlY1 = prev.y;
      const controlX2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      const controlY2 = curr.y;

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${curr.x} ${curr.y}`;
    }

    return path;
  }, [chartData.points]);

  const gradientPath = useMemo(() => {
    if (chartData.points.length === 0) return '';

    const chartHeight = height - 40;
    let path = pathD;
    const lastPoint = chartData.points[chartData.points.length - 1];
    path += ` L ${lastPoint.x} ${chartHeight} L ${chartData.points[0].x} ${chartHeight} Z`;

    return path;
  }, [pathD, chartData.points, height]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        <Svg width={CHART_WIDTH} height={height - 40} style={styles.svg}>
          <Defs>
            <LinearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>

          <Path d={gradientPath} fill={`url(#gradient-${color})`} />

          <Path d={pathD} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {chartData.points.map((point, index) => (
            <Circle key={index} cx={point.x} cy={point.y} r="5" fill={color} stroke={COLORS.background} strokeWidth="2" />
          ))}
        </Svg>

        {showValues && (
          <View style={styles.valuesContainer}>
            {chartData.points.map((point, index) => (
              <View key={index} style={[styles.valueLabel, { left: point.x - 20, top: point.y - 25 }]}>
                <Text style={[styles.valueText, { color }]}>{formatValue(point.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.xAxis}>
        {data.map((item, index) => (
          <View key={index} style={styles.xLabel}>
            <Text style={styles.xLabelText}>{item.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartArea: {
    position: 'relative',
    paddingHorizontal: SPACING.md,
  },
  svg: {
    overflow: 'visible',
  },
  valuesContainer: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    right: SPACING.md,
    bottom: 0,
  },
  valueLabel: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  xLabel: {
    flex: 1,
    alignItems: 'center',
  },
  xLabelText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING.xl,
  },
});
