# Productivity App

A modern, mobile-friendly productivity suite built with **React**, **TypeScript**, and **Vite**. This app helps you track habits, manage to-dos, set and achieve goals, and use the Pomodoro technique—all in one place.

---

## Features

### 🟢 **Habit Tracker**
- Track habits with daily, weekly, or custom schedules.
- Supports both "Good" and "Avoid" habits.
- 8-week calendar view with streaks, best, total, and percent stats.
- Auto-add daily habits to your To-Do list.
- "Replacement Habit" suggestions for avoid habits.
- Drag-and-drop reordering and filtering by habit type.

### 📝 **To-Do List**
- Add, edit, and reorder tasks with drag-and-drop.
- Link tasks to goals/sub-goals for integrated progress tracking.
- "Routine" badge for auto-added tasks from habits.
- Push tasks to "Tomorrow" and automatic rollover each day.
- Timer for each task, with persistence.
- "Delete All" for completed tasks (Done tab).

### 🎯 **Goals**
- Create goals with optional reward/motivation.
- Add sub-goals, each with an optional estimated time.
- Link sub-goals to To-Do tasks and sync completion status.
- Drag-and-drop reordering of sub-goals.
- Complete goals with feedback and visual progress.

### ⏲️ **Pomodoro Timer**
- Four Pomodoro slots per cycle, with checkboxes and break times.
- Editable task names for each Pomodoro.
- Add Pomodoro tasks to the To-Do list.
- Timer persists across tab switches.

### 💡 **General**
- Responsive, mobile-first UI with desktop optimizations.
- Info modals with best-practices for each tab.
- All data stored locally in your browser (no account required).
- Modern, clean design using Bootstrap 5.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Bootstrap 5
- **State & Persistence:** React hooks + browser localStorage
- **Linting/Formatting:** ESLint, Prettier

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the app in development:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## Folder Structure

```
src/
  components/      # Main React components (HabitTracker, TodoList, PomodoroTimer, Goals, etc.)
  utils/           # LocalStorage and helper utilities
  hooks/           # Custom React hooks
  contexts/        # React context providers (if any)
public/            # Static assets
```

---

## Contributing

- Code is organized for clarity and maintainability.
- Please add concise comments for new utility functions or complex logic.
- PRs and suggestions are welcome!

---

## License

MIT
