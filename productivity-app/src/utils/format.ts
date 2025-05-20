/**
 * format.ts
 * Utility functions for formatting time and other values.
 */

/**
 * Format seconds as mm:ss (e.g., 90 -> '01:30').
 * @param {number} seconds - Number of seconds.
 * @returns {string} Formatted time string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
} 