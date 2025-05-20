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
const LAST_ACTIVE_DATE_KEY = 'todoLastActiveDate';

export const getTodoList = (): TodoTask[] => {
  const data = localStorage.getItem(TODO_KEY);
  return data ? JSON.parse(data) : [];
};
export const getDoneList = (): TodoTask[] => {
  const data = localStorage.getItem(DONE_KEY);
  return data ? JSON.parse(data) : [];
};
export const getTomorrowList = (): TodoTask[] => {
  const data = localStorage.getItem(TOMORROW_KEY);
  return data ? JSON.parse(data) : [];
};
export const getLastActiveDate = (): string | null => {
  return localStorage.getItem(LAST_ACTIVE_DATE_KEY);
};

export const saveTodoList = (list: TodoTask[]) => {
  localStorage.setItem(TODO_KEY, JSON.stringify(list));
};
export const saveDoneList = (list: TodoTask[]) => {
  localStorage.setItem(DONE_KEY, JSON.stringify(list));
};
export const saveTomorrowList = (list: TodoTask[]) => {
  localStorage.setItem(TOMORROW_KEY, JSON.stringify(list));
};
export const saveLastActiveDate = (date: string) => {
  localStorage.setItem(LAST_ACTIVE_DATE_KEY, date);
};

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

export const rolloverIfNeeded = () => {
  const lastDate = getLastActiveDate();
  const today = new Date().toISOString().slice(0, 10);
  if (lastDate !== today) {
    // Clear done list
    saveDoneList([]);
    // Move tomorrow list to todo list
    const tomorrow = getTomorrowList();
    const todo = getTodoList();
    saveTodoList([
      ...todo,
      ...tomorrow.map(t => ({ ...t, listType: 'todo' as 'todo' }))
    ]);
    saveTomorrowList([]);
    saveLastActiveDate(today);
  }
}; 