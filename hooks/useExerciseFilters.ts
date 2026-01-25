import { useState, useMemo } from 'react';
import { ExerciseCategory } from '@/types/exercises';
import { EXERCISE_LIBRARY } from '@/constants/exercise-library';

export function useExerciseFilters() {
  const [selectedCategories, setSelectedCategories] = useState<ExerciseCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    let filtered = EXERCISE_LIBRARY;

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(ex => 
        ex.categories.some(cat => selectedCategories.includes(cat))
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategories, searchQuery]);

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
  };

  return {
    filteredExercises,
    selectedCategories,
    setSelectedCategories,
    searchQuery,
    setSearchQuery,
    toggleCategory,
    clearFilters,
  };
}
