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

// Helper to get goals from localStorage
export const getGoals = (): Goal[] => {
  const goalsJson = localStorage.getItem(GOALS_STORAGE_KEY);
  return goalsJson ? JSON.parse(goalsJson) : [];
};

// Helper to save goals to localStorage
const saveGoals = (goals: Goal[]): void => {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
};

// --- Main Goal Functions ---

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

export const updateGoal = (updatedGoal: Goal): Goal[] => {
  let goals = getGoals();
  goals = goals.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal));
  saveGoals(goals);
  return goals;
};

export const deleteGoal = (goalId: string): Goal[] => {
  let goals = getGoals();
  goals = goals.filter(goal => goal.id !== goalId);
  saveGoals(goals);
  return goals;
};

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

export const updateGoalTitle = (goalId: string, newTitle: string): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;
  goals[goalIndex].title = newTitle;
  saveGoals(goals);
  return goals[goalIndex];
};

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

export const deleteSubGoal = (goalId: string, subGoalId: string): Goal | undefined => {
  const goals = getGoals();
  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return undefined;

  goals[goalIndex].subGoals = goals[goalIndex].subGoals.filter(sg => sg.id !== subGoalId);
  saveGoals(goals);
  return goals[goalIndex];
};

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