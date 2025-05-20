export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type HabitType = 'good' | 'avoid';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  habitType?: HabitType; // 'good' (default) or 'avoid'
  frequency: {
    type: FrequencyType;
    daysOfWeek?: number[]; // 0=Sun, 6=Sat
    timesPerWeek?: number;
  };
  startDate: string; // ISO string
  endDate?: string; // ISO string
  reminderTime?: string; // 'HH:MM' 24h
  autoAddToTodo?: boolean; // NEW: auto-add to To-Do List each day
  replacementHabit?: string; // NEW: for Avoid habits
}

const HABITS_KEY = 'habits';
const COMPLETIONS_KEY = 'habitCompletions'; // { [habitId]: string[] }
const HISTORICAL_COMPLETIONS_KEY = 'habitHistoricalCompletions'; // { [habitId]: string[] }

export const getHabits = (): Habit[] => {
  const data = localStorage.getItem(HABITS_KEY);
  return data ? JSON.parse(data) : [];
};
export const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
};

export const getCompletions = (): Record<string, string[]> => {
  const data = localStorage.getItem(COMPLETIONS_KEY);
  return data ? JSON.parse(data) : {};
};

export const getHistoricalCompletions = (): Record<string, string[]> => {
  const data = localStorage.getItem(HISTORICAL_COMPLETIONS_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveCompletions = (completions: Record<string, string[]>) => {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
};

export const saveHistoricalCompletions = (completions: Record<string, string[]>) => {
  localStorage.setItem(HISTORICAL_COMPLETIONS_KEY, JSON.stringify(completions));
};

export const addHabit = (habit: Omit<Habit, 'id'>): Habit => {
  const newHabit: Habit = { ...habit, id: Date.now().toString(), habitType: habit.habitType || 'good' };
  const habits = getHabits();
  saveHabits([...habits, newHabit]);
  return newHabit;
};

export const updateHabit = (habit: Habit) => {
  const habits = getHabits().map(h => h.id === habit.id ? { ...habit, habitType: habit.habitType || 'good' } : h);
  saveHabits(habits);
};

export const deleteHabit = (id: string) => {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  const completions = getCompletions();
  delete completions[id];
  saveCompletions(completions);
};

export const markHabitComplete = (habitId: string, date: string) => {
  const completions = getCompletions();
  const historicalCompletions = getHistoricalCompletions();
  
  // Add to current completions
  if (!completions[habitId]) completions[habitId] = [];
  if (!completions[habitId].includes(date)) completions[habitId].push(date);
  saveCompletions(completions);
  
  // Add to historical completions
  if (!historicalCompletions[habitId]) historicalCompletions[habitId] = [];
  if (!historicalCompletions[habitId].includes(date)) historicalCompletions[habitId].push(date);
  saveHistoricalCompletions(historicalCompletions);
};

export const unmarkHabitComplete = (habitId: string, date: string) => {
  const completions = getCompletions();
  const historicalCompletions = getHistoricalCompletions();
  
  // Remove from current completions
  if (completions[habitId]) {
    completions[habitId] = completions[habitId].filter(d => d !== date);
    saveCompletions(completions);
  }
  
  // Remove from historical completions
  if (historicalCompletions[habitId]) {
    historicalCompletions[habitId] = historicalCompletions[habitId].filter(d => d !== date);
    saveHistoricalCompletions(historicalCompletions);
  }
};

// --- Stats helpers ---
export const getCurrentWeekDates = (): string[] => {
  const today = new Date();
  const week: string[] = [];
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // Sunday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d.toISOString().slice(0, 10));
  }
  return week;
};

export const getHabitStats = (habit: Habit): {
  total: number;
  currentStreak: number;
  bestStreak: number;
  percent: number;
  completions: string[];
} => {
  const completions = getCompletions()[habit.id] || [];
  const weekDates = getCurrentWeekDates();
  
  // Only consider completions in the current week for current stats
  const weekCompletions = completions.filter(date => weekDates.includes(date));
  
  // Streak: consecutive days up to today
  let streak = 0;
  for (let i = weekDates.length - 1; i >= 0; i--) {
    if (weekCompletions.includes(weekDates[i])) {
      streak++;
    } else {
      break;
    }
  }
  
  // Best streak in the week
  let bestStreak = 0, cur = 0;
  for (let i = 0; i < weekDates.length; i++) {
    if (weekCompletions.includes(weekDates[i])) {
      cur++;
      bestStreak = Math.max(bestStreak, cur);
    } else {
      cur = 0;
    }
  }
  
  const percent = weekDates.length > 0 ? Math.round((weekCompletions.length / weekDates.length) * 100) : 0;
  
  return {
    total: weekCompletions.length,
    currentStreak: streak,
    bestStreak,
    percent,
    completions: weekCompletions,
  };
};

// Add new function to get historical completions for a specific date range
export const getHistoricalCompletionsForRange = (habitId: string, startDate: string, endDate: string): string[] => {
  const historicalCompletions = getHistoricalCompletions()[habitId] || [];
  return historicalCompletions.filter(date => date >= startDate && date <= endDate);
}; 