import { X, Search, Plus } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';

import { Exercise } from '@/constants/exercises';
import { COLORS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useExercises } from '@/hooks/useExercises';

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
  const { data: exercises = [], isLoading, isError, error } = useExercises();
  // Loading state for when adding an exercise
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' ||
        exercise.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  // Handle adding exercise with loading state to prevent duplicate taps
  const handleAddExercise = async (exercise: Exercise) => {
    if (addingExerciseId) return; // Prevent duplicate taps
    
    setAddingExerciseId(exercise.id);
    try {
      await onSelectExercise(exercise);
      // Note: We don't close the modal here as the parent might want to add multiple exercises
    } catch (error) {
      console.error('[ExerciseSelectorModal] Error adding exercise:', error);
      // Keep modal open on error so user can retry
    } finally {
      setAddingExerciseId(null);
    }
  };

  // Memoize style objects that use accent to prevent re-renders
  const searchContainerStyle = useMemo(() => ({ borderColor: accent }), [accent]);
  const categoryIndicatorStyle = useMemo(() => ({ backgroundColor: accent }), [accent]);
  const tagBackgroundStyle = useMemo(() => ({ backgroundColor: `${accent}20` }), [accent]);
  const tagTextStyle = useMemo(() => ({ color: accent }), [accent]);
  const addButtonStyle = useMemo(() => ({ backgroundColor: accent }), [accent]);
  const categoryButtonActiveStyle = useMemo(() => ({ backgroundColor: accent }), [accent]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Exercise</Text>
          <Pressable onPress={onClose} style={styles.closeButton} disabled={!!addingExerciseId}>
            <X size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={[styles.searchContainer, searchContainerStyle]}>
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
                selectedCategory === category && categoryButtonActiveStyle,
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

        <View style={[styles.categoryIndicator, categoryIndicatorStyle]} />

        <ScrollView
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorTitle}>Failed to load exercises</Text>
              <Text style={styles.errorText}>
                {(error as unknown as Error)?.message || 'An error occurred while fetching exercises. Please try again.'}
              </Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>
                {exercises.length === 0 ? 'No exercises available' : 'No exercises found'}
              </Text>
              <Text style={styles.emptyText}>
                {exercises.length === 0
                  ? 'Exercises haven\'t been loaded yet. Please check your database connection.'
                  : 'Try adjusting your search or category filters to see more exercises.'}
              </Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => {
              // Count how many times this exercise is already used (allow duplicates)
              const usageCount = selectedExerciseIds.filter(id => id === exercise.id).length;
              const isAlreadyUsed = usageCount > 0;
              const isAdding = addingExerciseId === exercise.id;
              
              return (
                <Pressable
                  key={`${exercise.id}-${Math.random()}`} // Ensure unique key for potential duplicates
                  style={[styles.exerciseItem, isAdding && styles.exerciseItemDisabled]}
                  onPress={() => handleAddExercise(exercise)}
                  disabled={!!addingExerciseId}
                >
                  <View style={styles.exerciseInfo}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName}>
                        {exercise.name}
                      </Text>
                      {isAlreadyUsed && (
                        <View style={[styles.usageBadge, tagBackgroundStyle]}>
                          <Text style={[styles.usageBadgeText, tagTextStyle]}>
                            Used {usageCount}x
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.exerciseTags}>
                      <View style={[styles.tag, tagBackgroundStyle]}>
                        <Text style={[styles.tagText, tagTextStyle]}>{exercise.muscle_group}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{exercise.type}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.addButton, addButtonStyle]}>
                    {isAdding ? (
                      <ActivityIndicator size="small" color={COLORS.background} />
                    ) : (
                      <Plus size={20} color={COLORS.background} strokeWidth={2.5} />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
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
    opacity: 0.6,
  },
  exerciseInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap' as const,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  usageBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  usageBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    minHeight: 200,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
