import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS, SPACING, colorWithOpacity } from '@/constants/theme';

import { BodyView } from './BodyView';
import { HeatmapLegend } from './HeatmapLegend';
import { MuscleDetailSheet } from './MuscleDetailSheet';

import type { MuscleRegion, MuscleView, MuscleVolumeData } from '@/constants/heatmap/types';

type BodyHeatmapProps = {
  muscleData: Record<MuscleRegion, MuscleVolumeData>;
  accentColor: string;
};

const VIEWS: MuscleView[] = ['front', 'back'];
const VIEW_LABELS: Record<MuscleView, string> = { front: 'Front', back: 'Back' };

export function BodyHeatmap({ muscleData, accentColor }: BodyHeatmapProps) {
  const [activeView, setActiveView] = useState<MuscleView>('front');
  const [selectedRegion, setSelectedRegion] = useState<MuscleRegion | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get('window').width;
  const pageWidth = screenWidth - SPACING.lg * 2;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      const view = VIEWS[page];
      if (view && view !== activeView) {
        setActiveView(view);
      }
    },
    [activeView, pageWidth],
  );

  const handleViewToggle = useCallback(
    (view: MuscleView) => {
      const index = VIEWS.indexOf(view);
      scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
      setActiveView(view);
    },
    [pageWidth],
  );

  const handleRegionPress = useCallback((region: MuscleRegion) => {
    setSelectedRegion((prev) => (prev === region ? null : region));
  }, []);

  return (
    <View>
      {/* View toggle tabs */}
      <View style={styles.toggleRow}>
        {VIEWS.map((view) => (
          <TouchableOpacity
            key={view}
            onPress={() => handleViewToggle(view)}
            style={[
              styles.toggleTab,
              activeView === view && {
                backgroundColor: colorWithOpacity(accentColor, 0.15),
                borderColor: colorWithOpacity(accentColor, 0.3),
              },
            ]}
          >
            <Text
              style={[
                styles.toggleLabel,
                activeView === view && { color: accentColor },
              ]}
            >
              {VIEW_LABELS[view]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable body views */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={{ width: pageWidth * 2 }}
      >
        {VIEWS.map((view) => (
          <View key={view} style={{ width: pageWidth, alignItems: 'center' }}>
            <BodyView
              view={view}
              muscleData={muscleData}
              accentColor={accentColor}
              onRegionPress={handleRegionPress}
            />
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {VIEWS.map((view) => (
          <View
            key={view}
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeView === view
                    ? accentColor
                    : colorWithOpacity(COLORS.textSecondary, 0.3),
              },
            ]}
          />
        ))}
      </View>

      <HeatmapLegend accentColor={accentColor} />

      {/* Detail sheet when a region is tapped */}
      {selectedRegion && muscleData[selectedRegion] && (
        <MuscleDetailSheet
          region={selectedRegion}
          data={muscleData[selectedRegion]}
          accentColor={accentColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  toggleTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorWithOpacity(COLORS.textSecondary, 0.2),
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  scrollView: {
    flexGrow: 0,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginVertical: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
