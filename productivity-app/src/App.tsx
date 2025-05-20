import { useState, useEffect } from 'react'
import TodoList from './components/TodoList'
import PomodoroTimer from './components/PomodoroTimer'
import HabitTracker from './components/HabitTracker'
import Goals from './components/Goals'
import './App.css'
import { runDailyHabitRoutines } from './utils/routine'

type TabName = 'Todo' | 'Pomodoro' | 'Habits' | 'Goals'

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Todo')

  useEffect(() => {
    runDailyHabitRoutines();
  }, []);

  return (
    <div className='container mt-3'>
      <ul className='nav nav-tabs'>
        <li className='nav-item'>
          <button
            className={`nav-link ${activeTab === 'Todo' ? 'active' : ''}`}
            onClick={() => setActiveTab('Todo')}
          >
            To-Do List
          </button>
        </li>
        <li className='nav-item'>
          <button
            className={`nav-link ${activeTab === 'Pomodoro' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pomodoro')}
          >
            Pomodoro
          </button>
        </li>
        <li className='nav-item'>
          <button
            className={`nav-link ${activeTab === 'Habits' ? 'active' : ''}`}
            onClick={() => setActiveTab('Habits')}
          >
            Habit Tracker
          </button>
        </li>
        <li className='nav-item'>
          <button
            className={`nav-link ${activeTab === 'Goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('Goals')}
          >
            Goals
          </button>
        </li>
      </ul>
      <div className='tab-content mt-3'>
        <div style={{ display: activeTab === 'Todo' ? 'block' : 'none' }}>
          <TodoList />
        </div>
        <div style={{ display: activeTab === 'Pomodoro' ? 'block' : 'none' }}>
          <PomodoroTimer />
        </div>
        <div style={{ display: activeTab === 'Habits' ? 'block' : 'none' }}>
          <HabitTracker />
        </div>
        <div style={{ display: activeTab === 'Goals' ? 'block' : 'none' }}>
          <Goals />
        </div>
      </div>
    </div>
  )
}

export default App
