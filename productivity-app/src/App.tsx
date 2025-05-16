import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import TodoList from './components/TodoList'
import PomodoroTimer from './components/PomodoroTimer'
import HabitTracker from './components/HabitTracker'
import Goals from './components/Goals'
import './App.css'

type TabName = 'Todo' | 'Pomodoro' | 'Habits' | 'Goals'

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Todo')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Todo':
        return <TodoList />
      case 'Pomodoro':
        return <PomodoroTimer />
      case 'Habits':
        return <HabitTracker />
      case 'Goals':
        return <Goals />
      default:
        return null
    }
  }

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
        {renderTabContent()}
      </div>
    </div>
  )
}

export default App
