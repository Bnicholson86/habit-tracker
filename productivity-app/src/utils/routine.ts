/**
 * routine.ts
 * Handles daily routines for habits, specifically auto-adding eligible habits to the To-Do list each day.
 * Provides helpers to determine if a habit is scheduled for today and to run the daily routine on app load.
 */

import { getHabits } from './habitLocalStorage';
import { getTodoList, addTask } from './todoLocalStorage';
import type { Habit } from './habitLocalStorage';
import type { TodoTask } from './todoLocalStorage';

/**
 * Determine if a habit is scheduled for today based on its frequency.
 * @param {Habit} habit - The habit to check.
 * @returns {boolean} True if the habit is scheduled for today, false otherwise.
 */
export function isHabitScheduledForToday(habit: Habit): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  if (habit.frequency.type === 'daily') return true;
  if (habit.frequency.type === 'custom') {
    return habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
  }
  // For weekly, we don't auto-add (per requirements)
  return false;
}

/**
 * Get today's date string in YYYY-MM-DD format.
 * @returns {string} Today's date string.
 */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Main routine: On app load, auto-add eligible habits to the To-Do list for today if not already present.
 * Only adds 'good' habits with autoAddToTodo enabled and scheduled for today.
 * Side effect: may add new tasks to the To-Do list in localStorage.
 */
export function runDailyHabitRoutines() {
  const habits = getHabits();
  const todoList = getTodoList();
  const today = todayStr();
  habits.forEach(habit => {
    if (
      habit.habitType === 'good' &&
      habit.autoAddToTodo &&
      isHabitScheduledForToday(habit)
    ) {
      // Check if already exists for today
      const alreadyExists = todoList.some(
        t => t.habitId === habit.id && t.createdAt.slice(0, 10) === today
      );
      if (!alreadyExists) {
        addTask({
          text: habit.name + ' (from Habit)',
          estimatedTime: '',
          completed: false,
          listType: 'todo',
          source: 'Routine',
          habitId: habit.id,
        });
      }
    }
  });
} 