/**
 * todoLocalStorage.ts
 * Handles all To-Do list localStorage operations and task manipulation logic for the productivity app.
 * Provides CRUD operations for To-Do, Done, and Tomorrow lists, as well as rollover and task movement utilities.
 */

import { getListFromStorage, saveListToStorage } from './storageHelpers';

export interface TodoTask {
  id: string;
  text: string;
  estimatedTime: string; // e.g., '30' (minutes) or '01:00' (hh:mm)
  actualTime?: number; // seconds elapsed
  completed: boolean;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  listType: 'todo' | 'done' | 'tomorrow';
  source?: string; // NEW: e.g., 'Routine'
  habitId?: string; // NEW: reference to originating habit
  goalId?: string; // NEW: linked goal
  subGoalId?: string; // NEW: linked sub-goal
}

const TODO_KEY = 'todoList';
const DONE_KEY = 'doneList';
const TOMORROW_KEY = 'tomorrowList';

/**
 * Get the current To-Do list from localStorage.
 * @returns {TodoTask[]} Array of To-Do tasks.
 */
export const getTodoList = (): TodoTask[] => {
  return getListFromStorage<TodoTask>(TODO_KEY);
};

/**
 * Get the current Done list from localStorage.
 * @returns {TodoTask[]} Array of completed tasks.
 */
export const getDoneList = (): TodoTask[] => {
  return getListFromStorage<TodoTask>(DONE_KEY);
};

/**
 * Get the current Tomorrow list from localStorage.
 * @returns {TodoTask[]} Array of tasks scheduled for tomorrow.
 */
export const getTomorrowList = (): TodoTask[] => {
  return getListFromStorage<TodoTask>(TOMORROW_KEY);
};

/**
 * Save the To-Do list to localStorage.
 * @param {TodoTask[]} list - Array of To-Do tasks to save.
 */
export const saveTodoList = (list: TodoTask[]) => {
  saveListToStorage(TODO_KEY, list);
};

/**
 * Save the Done list to localStorage.
 * @param {TodoTask[]} list - Array of completed tasks to save.
 */
export const saveDoneList = (list: TodoTask[]) => {
  saveListToStorage(DONE_KEY, list);
};

/**
 * Save the Tomorrow list to localStorage.
 * @param {TodoTask[]} list - Array of tasks scheduled for tomorrow to save.
 */
export const saveTomorrowList = (list: TodoTask[]) => {
  saveListToStorage(TOMORROW_KEY, list);
};

/**
 * Add a new task to the To-Do or Tomorrow list.
 * @param {Omit<TodoTask, 'id' | 'createdAt'>} task - Task data (without id/createdAt).
 * @returns {TodoTask} The newly created task with id and createdAt.
 */
export const addTask = (task: Omit<TodoTask, 'id' | 'createdAt'>): TodoTask => {
  const newTask: TodoTask = {
    ...task,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  let list: TodoTask[] = [];
  if (task.listType === 'todo') {
    list = getTodoList();
    saveTodoList([...list, newTask]);
  } else if (task.listType === 'tomorrow') {
    list = getTomorrowList();
    saveTomorrowList([...list, newTask]);
  }
  return newTask;
};

/**
 * Update an existing task in the appropriate list.
 * @param {TodoTask} task - The updated task object.
 */
export const updateTask = (task: TodoTask) => {
  let list: TodoTask[] = [];
  if (task.listType === 'todo') {
    list = getTodoList().map(t => t.id === task.id ? task : t);
    saveTodoList(list);
  } else if (task.listType === 'done') {
    list = getDoneList().map(t => t.id === task.id ? task : t);
    saveDoneList(list);
  } else if (task.listType === 'tomorrow') {
    list = getTomorrowList().map(t => t.id === task.id ? task : t);
    saveTomorrowList(list);
  }
};

/**
 * Delete a task from the specified list.
 * @param {string} id - Task id to delete.
 * @param {'todo' | 'done' | 'tomorrow'} listType - List type to delete from.
 */
export const deleteTask = (id: string, listType: 'todo' | 'done' | 'tomorrow') => {
  let list: TodoTask[] = [];
  if (listType === 'todo') {
    list = getTodoList().filter(t => t.id !== id);
    saveTodoList(list);
  } else if (listType === 'done') {
    list = getDoneList().filter(t => t.id !== id);
    saveDoneList(list);
  } else if (listType === 'tomorrow') {
    list = getTomorrowList().filter(t => t.id !== id);
    saveTomorrowList(list);
  }
};

/**
 * Move a task from one list to another (e.g., To-Do → Done).
 * @param {string} id - Task id to move.
 * @param {'todo' | 'done' | 'tomorrow'} from - Source list.
 * @param {'todo' | 'done' | 'tomorrow'} to - Destination list.
 */
export const moveTask = (id: string, from: 'todo' | 'done' | 'tomorrow', to: 'todo' | 'done' | 'tomorrow') => {
  let fromList: TodoTask[] = [];
  let toList: TodoTask[] = [];
  let task: TodoTask | undefined;
  if (from === 'todo') {
    fromList = getTodoList();
    task = fromList.find(t => t.id === id);
    fromList = fromList.filter(t => t.id !== id);
    saveTodoList(fromList);
  } else if (from === 'done') {
    fromList = getDoneList();
    task = fromList.find(t => t.id === id);
    fromList = fromList.filter(t => t.id !== id);
    saveDoneList(fromList);
  } else if (from === 'tomorrow') {
    fromList = getTomorrowList();
    task = fromList.find(t => t.id === id);
    fromList = fromList.filter(t => t.id !== id);
    saveTomorrowList(fromList);
  }
  if (task) {
    task.listType = to;
    if (to === 'todo') {
      toList = getTodoList();
      saveTodoList([...toList, task]);
    } else if (to === 'done') {
      toList = getDoneList();
      saveDoneList([...toList, task]);
    } else if (to === 'tomorrow') {
      toList = getTomorrowList();
      saveTomorrowList([...toList, task]);
    }
  }
};

/**
 * Rollover logic: On app load, move any Tomorrow tasks whose createdAt is before today to the To-Do list.
 * This is per-task and does not rely on a global last active date.
 */
export const rolloverIfNeeded = () => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = getTomorrowList();
  const todo = getTodoList();
  // Tasks to move: createdAt < today
  const toMove = tomorrow.filter(t => t.createdAt && t.createdAt.slice(0, 10) < today);
  if (toMove.length > 0) {
    // Move to To-Do, update listType
    const updatedTodo = [
      ...todo,
      ...toMove.map(t => ({ ...t, listType: 'todo' as 'todo' }))
    ];
    saveTodoList(updatedTodo);
    // Remove from Tomorrow
    const remainingTomorrow = tomorrow.filter(t => !(t.createdAt && t.createdAt.slice(0, 10) < today));
    saveTomorrowList(remainingTomorrow);
  }
}; 