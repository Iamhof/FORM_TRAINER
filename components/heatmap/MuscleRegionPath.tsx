import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Path } from 'react-native-svg';

import { colorWithOpacity } from '@/constants/theme';

import type { MuscleRegion } from '@/constants/heatmap/types';

type MuscleRegionPathProps = {
  region: MuscleRegion;
  d: string;
  accentColor: string;
  intensity: number;
  onPress: (region: MuscleRegion) => void;
};

const MIN_VISIBLE_OPACITY = 0.08;

function MuscleRegionPathInner({
  region,
  d,
  accentColor,
  intensity,
  onPress,
}: MuscleRegionPathProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(region);
  }, [region, onPress]);

  const fillOpacity = intensity > 0
    ? Math.max(MIN_VISIBLE_OPACITY, intensity)
    : 0;

  return (
    <Path
      d={d}
      fill={fillOpacity > 0 ? colorWithOpacity(accentColor, fillOpacity) : 'transparent'}
      stroke={colorWithOpacity(accentColor, 0.2)}
      strokeWidth={0.5}
      onPress={handlePress}
    />
  );
}

export const MuscleRegionPath = React.memo(MuscleRegionPathInner);
