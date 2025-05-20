/**
 * dateUtils.ts
 * Utility functions for formatting and handling dates.
 */

/**
 * Convert a Date object to YYYY-MM-DD (ISO date string).
 * @param {Date} date - The date to format.
 * @returns {string} ISO date string (YYYY-MM-DD).
 */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Format a time string (HH:MM) as 12-hour time with AM/PM.
 * @param {string} time - Time string in 'HH:MM' 24h format.
 * @returns {string} Formatted 12-hour time string.
 */
export function formatTime12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
} 