import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { X, Search, Plus } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { EXERCISES, Exercise } from '@/constants/exercises';

type ExerciseSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExerciseIds?: string[];
};

const CATEGORIES = ['All', 'Push', 'Pull', 'Legs'];

export default function ExerciseSelectorModal({
  visible,
  onClose,
  onSelectExercise,
  selectedExerciseIds = [],
}: ExerciseSelectorModalProps) {
  const { accent } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      exercise.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Exercise</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={[styles.searchContainer, { borderColor: accent }]}>
          <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && {
                  backgroundColor: accent,
                },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.categoryIndicator, { backgroundColor: accent }]} />

        <ScrollView
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.map((exercise) => {
            const isSelected = selectedExerciseIds.includes(exercise.id);
            return (
              <Pressable
                key={exercise.id}
                style={[
                  styles.exerciseItem,
                  isSelected && styles.exerciseItemDisabled,
                ]}
                onPress={() => !isSelected && onSelectExercise(exercise)}
                disabled={isSelected}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, isSelected && styles.exerciseNameDisabled]}>
                    {exercise.name}
                  </Text>
                  <View style={styles.exerciseTags}>
                    <View style={[styles.tag, { backgroundColor: `${accent}20` }]}>
                      <Text style={[styles.tagText, { color: accent }]}>{exercise.muscleGroup}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{exercise.type}</Text>
                    </View>
                  </View>
                </View>
                {!isSelected && (
                  <View style={[styles.addButton, { backgroundColor: accent }]}>
                    <Plus size={20} color={COLORS.background} strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: SPACING.xs,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.background,
  },
  categoryIndicator: {
    height: 3,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 2,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  exerciseItemDisabled: {
    opacity: 0.4,
  },
  exerciseInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  exerciseNameDisabled: {
    color: COLORS.textSecondary,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    textTransform: 'capitalize' as const,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
