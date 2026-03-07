/**
 * Backend Runtime Utilities
 *
 * Provides type-safe access to runtime global variables for Node.js environment
 */

/**
 * Safely check if running in development mode
 * Works in Node.js/backend environment
 */
export function isDevelopmentMode(): boolean {
  try {
    // Try to access __DEV__ from global scope
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
