/**
 * Date utility functions for handling timezone-aware date operations.
 * 
 * These utilities ensure dates are always handled in the user's local timezone,
 * preventing issues where UTC conversion causes dates to shift by a day.
 */

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format.
 * Uses the device's local timezone instead of UTC to prevent date shifting issues.
 * 
 * @param date - The date to convert (defaults to current date/time)
 * @returns Date string in YYYY-MM-DD format using local timezone
 * 
 * @example
 * // User in PST timezone at 11 PM on Jan 15
 * getLocalDateString(new Date('2024-01-15T23:00:00'))
 * // Returns: '2024-01-15' (correct)
 * // vs toISOString().split('T')[0] would return '2024-01-16' (wrong!)
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets the Monday of the week for a given date, in local timezone.
 * Returns date string in YYYY-MM-DD format.
 * 
 * @param date - The date to find the week start for (defaults to current date)
 * @returns Date string for Monday of that week in YYYY-MM-DD format
 * 
 * @example
 * // For Wednesday, Jan 17, 2024
 * getLocalWeekStart(new Date('2024-01-17'))
 * // Returns: '2024-01-15' (the Monday of that week)
 */
export const getLocalWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Calculate days to subtract to reach Monday (start of week)
  // Sunday (0) needs to go back 6 days, all other days use (1 - day)
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return getLocalDateString(monday);
};

