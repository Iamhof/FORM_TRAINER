import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ExerciseCategory } from '@/types/exercises';
import { COLORS, SPACING } from '@/constants/theme';

interface CategoryFilterChipProps {
  category: ExerciseCategory;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryFilterChip({ category, isSelected, onPress }: CategoryFilterChipProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`category-chip-${category}`}
      >
        <View style={[styles.chip, isSelected && styles.chipSelected]}>
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {category}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: SPACING.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.accents.orange,
    borderColor: COLORS.accents.orange,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.textPrimary,
  },
});
