// Add shared TypeScript types here

export interface ExampleType {
  id: string;
  name: string;
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  pomodorosPerLongBreak: number;
}

export interface CompletedPomodoroLogEntry {
  id: string; // unique id, e.g., timestamp + random
  taskName?: string; // Optional task name
  completedAt: number; // Unix timestamp (ms)
  duration: number; // minutes (e.g., workDuration at the time of completion)
  date: string; // YYYY-MM-DD for easy daily filtering
} 