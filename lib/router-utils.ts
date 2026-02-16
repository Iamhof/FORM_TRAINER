/**
 * Router Parameter Validation Utilities
 *
 * Provides type-safe parsing and validation of Expo Router parameters.
 * Router params have type `string | string[] | undefined`, requiring
 * defensive parsing to prevent runtime errors.
 *
 * @see CLAUDE.md - Type Safety Standards (Workstream 3)
 */

import { logger } from '@/lib/logger';

/**
 * Parse a router parameter to a single string or null
 *
 * Router params can be string, string[], or undefined.
 * This function normalizes them to string | null.
 *
 * @param param - The router parameter to parse
 * @returns The parsed string value, or null if undefined/empty
 *
 * @example
 * const { id } = useLocalSearchParams();
 * const sessionId = parseParam(id); // string | null
 * if (!sessionId) {
 *   // Handle missing parameter
 *   return null;
 * }
 */
export function parseParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? (param[0] ?? null) : param;
}

/**
 * Require a router parameter, throwing an error if missing
 *
 * Use this for required route parameters where absence is an error.
 * The thrown error will be caught by ErrorBoundary for graceful handling.
 *
 * @param param - The router parameter to parse
 * @param name - Name of the parameter (for error messages)
 * @returns The parsed string value
 * @throws {Error} If parameter is undefined or empty
 *
 * @example
 * export default function SessionScreen() {
 *   const { id } = useLocalSearchParams();
 *   try {
 *     const sessionId = requireParam(id, 'session ID');
 *     // Use sessionId safely
 *   } catch (error) {
 *     // ErrorBoundary will catch this and show error UI
 *     router.replace('/(tabs)/home');
 *     return null;
 *   }
 * }
 */
export function requireParam(param: string | string[] | undefined, name: string): string {
  const parsed = parseParam(param);
  if (!parsed) {
    logger.error(`[RouterUtils] Missing required param: ${name}`, { param });
    throw new Error(`Missing required route parameter: ${name}`);
  }
  return parsed;
}

/**
 * Parse a router parameter to a number or null
 *
 * Safely parses numeric route parameters, returning null for invalid values.
 *
 * @param param - The router parameter to parse
 * @returns The parsed numeric value, or null if invalid/missing
 *
 * @example
 * const { week } = useLocalSearchParams();
 * const weekNumber = parseNumericParam(week) ?? 0; // Default to 0
 */
export function parseNumericParam(param: string | string[] | undefined): number | null {
  const parsed = parseParam(param);
  if (!parsed) return null;
  const num = parseInt(parsed, 10);
  return isNaN(num) ? null : num;
}
