import { getHabits } from './habitLocalStorage';
import { getTodoList, addTask } from './todoLocalStorage';
import type { Habit } from './habitLocalStorage';
import type { TodoTask } from './todoLocalStorage';

// Helper: is this habit scheduled for today?
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

// Helper: get today's date string (YYYY-MM-DD)
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Main routine: run on app load
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