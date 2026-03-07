/**
 * Runtime Utilities
 *
 * Provides type-safe access to runtime global variables
 * without using `any` type assertions.
 */

/**
 * Safely check if running in development mode
 * Works in both React Native and Node.js environments
 */
export function isDevelopmentMode(): boolean {
  try {
    // Try to access __DEV__ from global scope
    // Using indirect access to avoid TypeScript errors
    const globalObj = global as typeof globalThis & { __DEV__?: boolean };
    if (typeof globalObj.__DEV__ !== 'undefined') {
      return globalObj.__DEV__ === true;
    }
  } catch {
    // Fallback if global access fails
  }

  // Fallback to NODE_ENV check
  return process.env.NODE_ENV === 'development';
}

/**
 * Get application start timestamp for performance tracking
 * Returns null if not set
 */
export function getAppStartTime(): number | null {
  try {
    const globalObj = global as typeof globalThis & { __APP_START_TIME?: number };
    return globalObj.__APP_START_TIME ?? null;
  } catch {
    return null;
  }
}

/**
 * Calculate elapsed time since app start
 * Returns 0 if start time is not available
 */
export function getElapsedTime(): number {
  const startTime = getAppStartTime();
  return startTime ? Date.now() - startTime : 0;
}
