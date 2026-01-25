import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExerciseFilters } from '@/hooks/useExerciseFilters';
import { ExerciseCard } from '@/components/ExerciseCard';
import { CategoryFilterChip } from '@/components/CategoryFilterChip';
import { CATEGORIES } from '@/constants/exercise-library';
import { COLORS, SPACING } from '@/constants/theme';

export default function ExercisesScreen() {
  const {
    filteredExercises,
    selectedCategories,
    toggleCategory,
  } = useExerciseFilters();

  const getItemLayout = React.useCallback(
    (_data: any, index: number) => ({
      length: 208,
      offset: 208 * Math.floor(index / 2),
      index,
    }),
    []
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Exercise Library</Text>
      <Text style={styles.subtitle}>
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      >
        {CATEGORIES.map((category) => (
          <CategoryFilterChip
            key={category}
            category={category}
            isSelected={selectedCategories.includes(category)}
            onPress={() => toggleCategory(category)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No exercises found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters to see more exercises
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <FlatList
        data={filteredExercises}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  filtersScroll: {
    marginHorizontal: -SPACING.md,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.md,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
