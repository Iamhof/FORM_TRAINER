import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cache } from './cache';
import { EXERCISE_LIBRARY } from '@/constants/exercise-library';
import { Exercise } from '@/types/exercises';
import { logger } from './logger';

const EXERCISE_CACHE_KEY = 'exercise_library_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get exercise library with caching support
 * Since the library is bundled, this is mainly for offline access
 * and versioning support in the future
 */
export async function getExerciseLibrary(): Promise<Exercise[]> {
  try {
    // Try to get from cache first
    const cached = await Cache.get<Exercise[]>(EXERCISE_CACHE_KEY);
    if (cached !== null) {
      logger.debug('[ExerciseCache] Using cached exercise library');
      return cached;
    }

    // If not in cache, use bundled library
    logger.debug('[ExerciseCache] Using bundled exercise library');
    const library = EXERCISE_LIBRARY;

    // Cache it for offline access
    await Cache.set(EXERCISE_CACHE_KEY, library, CACHE_TTL);

    return library;
  } catch (error) {
    logger.error('[ExerciseCache] Error getting exercise library:', error);
    // Fallback to bundled library on error
    return EXERCISE_LIBRARY;
  }
}

/**
 * Invalidate exercise library cache
 * Useful when updating the library
 */
export async function invalidateExerciseCache(): Promise<void> {
  await Cache.invalidate(EXERCISE_CACHE_KEY);
  logger.debug('[ExerciseCache] Cache invalidated');
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const library = await getExerciseLibrary();
  return library.find(ex => ex.id === id);
}

