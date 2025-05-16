import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { PomodoroSettings, CompletedPomodoroLogEntry } from '../types';

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosPerLongBreak: 4,
};

interface AppContextState {
  pomodoroSettings: PomodoroSettings;
  updatePomodoroSettings: (newSettings: Partial<PomodoroSettings>) => void;
  completedPomodoros: CompletedPomodoroLogEntry[];
  addCompletedPomodoro: (taskName?: string) => void;
  // We can add functions to clear logs or get daily logs later
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pomodoroSettings, setPomodoroSettings] = useLocalStorage<PomodoroSettings>(
    'pomodoroSettings',
    DEFAULT_POMODORO_SETTINGS
  );
  const [completedPomodoros, setCompletedPomodoros] = useLocalStorage<CompletedPomodoroLogEntry[]>(
    'completedPomodorosLog',
    []
  );

  const updatePomodoroSettings = (newSettings: Partial<PomodoroSettings>) => {
    setPomodoroSettings((prevSettings) => ({ ...prevSettings, ...newSettings }));
  };

  const addCompletedPomodoro = (taskName?: string) => {
    const now = new Date();
    const newEntry: CompletedPomodoroLogEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      taskName,
      completedAt: now.getTime(),
      duration: pomodoroSettings.workDuration, // Log the duration used for this pomodoro
      date: now.toISOString().split('T')[0], // YYYY-MM-DD
    };
    setCompletedPomodoros((prevLog) => [newEntry, ...prevLog]); // Add to the beginning of the array
  };

  return (
    <AppContext.Provider
      value={{
        pomodoroSettings,
        updatePomodoroSettings,
        completedPomodoros,
        addCompletedPomodoro,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 