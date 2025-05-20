/**
 * storageHelpers.ts
 * Generic helpers for getting and saving lists to localStorage.
 */

/**
 * Get a list from localStorage by key.
 * @param {string} key - The localStorage key.
 * @returns {T[]} The parsed list, or an empty array if not found.
 */
export function getListFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/**
 * Save a list to localStorage by key.
 * @param {string} key - The localStorage key.
 * @param {T[]} list - The list to save.
 */
export function saveListToStorage<T>(key: string, list: T[]): void {
  localStorage.setItem(key, JSON.stringify(list));
} 