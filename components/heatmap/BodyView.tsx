import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BACK_MUSCLE_PATHS, BODY_OUTLINE_BACK } from '@/constants/heatmap/muscle-paths-back';
import { BODY_OUTLINE_FRONT, FRONT_MUSCLE_PATHS } from '@/constants/heatmap/muscle-paths-front';
import { colorWithOpacity } from '@/constants/theme';

import { MuscleRegionPath } from './MuscleRegionPath';

import type { MuscleRegion, MuscleView, MuscleVolumeData } from '@/constants/heatmap/types';

type BodyViewProps = {
  view: MuscleView;
  muscleData: Record<MuscleRegion, MuscleVolumeData>;
  accentColor: string;
  onRegionPress: (region: MuscleRegion) => void;
};

export function BodyView({ view, muscleData, accentColor, onRegionPress }: BodyViewProps) {
  const outline = view === 'front' ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK;
  const musclePaths = view === 'front' ? FRONT_MUSCLE_PATHS : BACK_MUSCLE_PATHS;

  const getIntensity = useCallback(
    (region: MuscleRegion): number => muscleData[region]?.intensity ?? 0,
    [muscleData],
  );

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 200 500" style={styles.svg}>
        <Path
          d={outline}
          fill="transparent"
          stroke={colorWithOpacity('#FFFFFF', 0.15)}
          strokeWidth={1}
        />
        {musclePaths.map((mp) => (
          <MuscleRegionPath
            key={mp.region}
            region={mp.region}
            d={mp.d}
            accentColor={accentColor}
            intensity={getIntensity(mp.region)}
            onPress={onRegionPress}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    width: 200,
    height: 500,
  },
});
