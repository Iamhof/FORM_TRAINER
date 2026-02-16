/**
 * Safe Array Access Utilities
 *
 * Provides type-safe array indexing for TypeScript strict mode.
 * Addresses noUncheckedIndexedAccess: true violations by providing
 * defensive access patterns with clear semantics.
 *
 * @see CLAUDE.md - Type Safety Standards (Workstream 3)
 */

/**
 * Safely access an array element, returning undefined if out of bounds
 *
 * Use this for optional access where undefined is an acceptable result.
 *
 * @param arr - The array to access (can be undefined)
 * @param index - The index to access
 * @returns The element at index, or undefined if out of bounds
 *
 * @example
 * const slides = ['intro', 'features', 'outro'];
 * const slide = safeGet(slides, 10); // Returns undefined instead of crashing
 */
export function safeGet<T>(arr: T[] | undefined, index: number): T | undefined {
  if (!arr || index < 0 || index >= arr.length) {
    return undefined;
  }
  return arr[index];
}

/**
 * Access an array element, throwing an error if out of bounds
 *
 * Use this for required access where out-of-bounds is a programming error.
 * Ideal for static arrays (constants) where bounds should always be valid.
 *
 * @param arr - The array to access
 * @param index - The index to access
 * @param context - Description of where this access occurs (for error messages)
 * @returns The element at index
 * @throws {Error} If index is out of bounds
 *
 * @example
 * const COLOR_OPTIONS = ['red', 'blue', 'green'];
 * const color = assertGet(COLOR_OPTIONS, selectedIndex, 'ColorPicker');
 * // Throws if selectedIndex is invalid - caught by ErrorBoundary
 */
export function assertGet<T>(arr: T[], index: number, context: string): T {
  const item = arr[index];
  if (item === undefined) {
    throw new Error(
      `[${context}] Array index ${index} out of bounds [0, ${arr.length})`
    );
  }
  return item;
}

/**
 * Check if an index is valid for an array of given length
 *
 * Use this before array mutations to ensure type safety.
 *
 * @param index - The index to check
 * @param length - The length of the array
 * @returns True if index is valid (0 <= index < length)
 *
 * @example
 * const handleUpdate = (index: number) => {
 *   if (!ensureInBounds(index, items.length)) {
 *     logger.warn('Invalid index', { index, length: items.length });
 *     return;
 *   }
 *   const newItems = [...items];
 *   newItems[index]!.value = newValue; // Safe after bounds check
 *   setItems(newItems);
 * };
 */
export function ensureInBounds(index: number, length: number): boolean {
  return index >= 0 && index < length;
}
