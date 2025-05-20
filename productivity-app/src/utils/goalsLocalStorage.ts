/**
 * goalsLocalStorage.ts
 * Handles all Goal and Sub-Goal localStorage operations for the productivity app.
 * Provides CRUD operations for goals and sub-goals, as well as progress, completion, and feedback logic.
 */

import { getListFromStorage, saveListToStorage } from './storageHelpers';

export interface SubGoal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO string
  estimatedTime?: number; // minutes, optional
}

export interface Goal {
  id: string;
  title: string;
  progress: number; // 0-100
  createdAt: string; // ISO string
  subGoals: SubGoal[];
  completed: boolean;
  completedAt?: string; // ISO string, when the goal was marked as completed
  feedback?: string; // User's feedback upon completion
  autoProgress: boolean; // New: whether progress is automatic
  rewardMotivation?: string; // NEW: reward or motivation for this goal
}

const GOALS_STORAGE_KEY = 'userGoals';

/**
 * Get all goals from localStorage.
 * @returns {Goal[]} Array of goals.
 */
export const getGoals = (): Goal[] => {
  return getListFromStorage<Goal>(GOALS_STORAGE_KEY);
};

/**
 * Save all goals to localStorage.
 * @param {Goal[]} goals - Array of goals to save.
 */
const saveGoals = (goals: Goal[]): void => {
  saveListToStorage(GOALS_STORAGE_KEY, goals);
};

// --- Main Goal Functions ---

/**
 * Add a new goal.
 * @param {string} title - Goal title.
 * @param {string} [rewardMotivation] - Optional reward or motivation.
 * @returns {Goal} The newly created goal.
 */
export const addGoal = (title: string, rewardMotivation?: string): Goal => {
  const goals = getGoals();
  const newGoal: Goal = {
    id: Date.now().toString(),
    title,
    progress: 0,
    createdAt: new Date().toISOString(),
    subGoals: [],
    completed: false,
    feedback: '',
    autoProgress: false,
    rewardMotivation,
  };
  const updatedGoals = [...goals, newGoal];
  saveGoals(updatedGoals);
  return newGoal;
};

/**
 * Update an existing goal.
 * @param {Goal} updatedGoal - The updated goal object.
 * @returns {Goal[]} The updated array of goals.
 */
export const updateGoal = (updatedGoal: Goal): Goal[] => {
  let goals = getGoals();
  goals = goals.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal));
  saveGoals(goals);
  return goals;
};

/**
 * Delete a goal by id.
 * @param {string} goalId - The id of the goal to delete.
 * @returns {Goal[]} The updated array of goals.
 */
export const deleteGoal = (goalId: string): Goal[] => {
  let goals = getGoals();
  goals = goals.filter(goal => goal.id !== goalId);
  saveGoals(goals);
  return goals;
};

/**
 * Toggle completion status for a goal, with optional feedback.
 * @param {string} goalId - The id of the goal.
 * @param {boolean} isCompleted - Whether the goal is completed.
 * @param {string} [feedbackText] - Optional feedback text.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const toggleGoalCompletion = (goalId: string, isCompleted: boolean, feedbackText?: string): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;

  goals[goalIndex].completed = isCompleted;
  goals[goalIndex].completedAt = isCompleted ? new Date().toISOString() : undefined;
  if (isCompleted && feedbackText !== undefined) {
    goals[goalIndex].feedback = feedbackText;
  } else if (!isCompleted) {
    // Optionally clear feedback when un-completing, or leave as is
    // goals[goalIndex].feedback = ''; 
  }
  
  saveGoals(goals);
  return goals[goalIndex];
};

/**
 * Update the title of a goal.
 * @param {string} goalId - The id of the goal.
 * @param {string} newTitle - The new title.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const updateGoalTitle = (goalId: string, newTitle: string): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;
  goals[goalIndex].title = newTitle;
  saveGoals(goals);
  return goals[goalIndex];
};

/**
 * Toggle auto-progress for a goal. If enabling, recalculate progress from sub-goals.
 * @param {string} goalId - The id of the goal.
 * @param {boolean} auto - Whether to enable auto-progress.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const toggleGoalAutoProgress = (goalId: string, auto: boolean): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;
  goals[goalIndex].autoProgress = auto;
  // If enabling auto, recalculate progress
  if (auto) {
    const subGoals = goals[goalIndex].subGoals;
    if (subGoals.length > 0) {
      const completedCount = subGoals.filter(sg => sg.completed).length;
      goals[goalIndex].progress = Math.round((completedCount / subGoals.length) * 100);
    } else {
      goals[goalIndex].progress = 0;
    }
  }
  saveGoals(goals);
  return goals[goalIndex];
};

// --- Sub-Goal Functions ---

/**
 * Add a new sub-goal to a goal.
 * @param {string} goalId - The id of the parent goal.
 * @param {string} text - The sub-goal text.
 * @param {number} [estimatedTime] - Optional estimated time in minutes.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const addSubGoal = (goalId: string, text: string, estimatedTime?: number): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;

  const newSubGoal: SubGoal = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
    ...(estimatedTime !== undefined ? { estimatedTime } : {}),
  };

  goals[goalIndex].subGoals.push(newSubGoal);
  saveGoals(goals);
  return goals[goalIndex];
};

/**
 * Update the completion status of a sub-goal.
 * @param {string} goalId - The id of the parent goal.
 * @param {string} subGoalId - The id of the sub-goal.
 * @param {boolean} completed - Whether the sub-goal is completed.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const updateSubGoal = (goalId: string, subGoalId: string, completed: boolean): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;

  const subGoalIndex = goals[goalIndex].subGoals.findIndex(sg => sg.id === subGoalId);
  if (subGoalIndex === -1) return undefined;

  goals[goalIndex].subGoals[subGoalIndex].completed = completed;
  saveGoals(goals);
  return goals[goalIndex];
};

/**
 * Delete a sub-goal from a goal.
 * @param {string} goalId - The id of the parent goal.
 * @param {string} subGoalId - The id of the sub-goal to delete.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const deleteSubGoal = (goalId: string, subGoalId: string): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;

  goals[goalIndex].subGoals = goals[goalIndex].subGoals.filter(sg => sg.id !== subGoalId);
  saveGoals(goals);
  return goals[goalIndex];
};

/**
 * Update the text and/or estimated time of a sub-goal.
 * @param {string} goalId - The id of the parent goal.
 * @param {string} subGoalId - The id of the sub-goal.
 * @param {string} newText - The new sub-goal text.
 * @param {number} [estimatedTime] - Optional new estimated time in minutes.
 * @returns {Goal | undefined} The updated goal, or undefined if not found.
 */
export const updateSubGoalText = (goalId: string, subGoalId: string, newText: string, estimatedTime?: number): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;
  const subGoalIndex = goals[goalIndex].subGoals.findIndex(sg => sg.id === subGoalId);
  if (subGoalIndex === -1) return undefined;
  goals[goalIndex].subGoals[subGoalIndex].text = newText;
  if (estimatedTime !== undefined) {
    goals[goalIndex].subGoals[subGoalIndex].estimatedTime = estimatedTime;
  }
  saveGoals(goals);
  return goals[goalIndex];
}; 