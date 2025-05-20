// HabitTracker.tsx
// Main Habit Tracker component for the productivity app.
// Handles habit CRUD, completion tracking, 8-week calendar, drag-and-drop, and integration with To-Do list.

import React, { useState, useEffect, useRef } from 'react';
import type { Habit, FrequencyType, HabitType } from '../utils/habitLocalStorage';
import {
  getHabits, addHabit, updateHabit, deleteHabit,
  markHabitComplete, unmarkHabitComplete, getHabitStats, getCurrentWeekDates,
  getHistoricalCompletionsForRange
} from '../utils/habitLocalStorage';
import { isHabitScheduledForToday } from '../utils/routine';
import { addTask } from '../utils/todoLocalStorage';

// Helper to format time as 12-hour with AM/PM
const formatTime12h = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Helper to get last N weeks' dates for the calendar
const getLastNWeeks = (n: number): string[][] => {
  const today = new Date();
  const weeks: string[][] = [];
  let start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // Start of this week
  for (let w = 0; w < n; w++) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() - w * 7 + i);
      week.push(d.toISOString().slice(0, 10));
    }
    weeks.unshift(week); // Most recent week last
  }
  return weeks;
};

const HabitTracker: React.FC = () => {
  // --- Weekly refresh: clear completions if new week (but keep stats) ---
  useEffect(() => {
    const lastWeek = localStorage.getItem('habitLastWeek');
    const now = new Date();
    const weekNum = `${now.getFullYear()}-W${Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    if (lastWeek !== weekNum && now.getDay() === 0 && now.getHours() >= 0) {
      // Only reset completions for the current week, not stats
      localStorage.setItem('habitCompletions', '{}');
      localStorage.setItem('habitLastWeek', weekNum);
    }
  }, []);

  // --- State ---
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Habit>>({ frequency: { type: 'daily' }, habitType: 'good' });
  const [dummy, setDummy] = useState(0); // for re-render on completions change
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'good' | 'avoid'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // --- Filtered habits for rendering and drag-and-drop ---
  const filteredHabits = habits.filter(h => filter === 'all' || h.habitType === filter);

  // --- Drag-and-drop handlers for habits ---
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (index: number) => setDragOverIndex(index);
  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    // Map filtered index to actual index in habits array
    const fromId = filteredHabits[draggedIndex].id;
    const toId = filteredHabits[index].id;
    const fromIdx = habits.findIndex(h => h.id === fromId);
    const toIdx = habits.findIndex(h => h.id === toId);
    const newList = [...habits];
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setHabits(newList);
    localStorage.setItem('habits', JSON.stringify(newList));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // --- Refresh habits from storage on mount ---
  useEffect(() => {
    setHabits(getHabits());
  }, []);

  // --- Info modal content for best practices ---
  const infoContent = `
    <h4>Habit Tracking Best Practices</h4>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    
    <h5>Key Principles</h5>
    <ul>
      <li>Start small and build gradually</li>
      <li>Be consistent rather than perfect</li>
      <li>Track your progress daily</li>
      <li>Celebrate small wins</li>
    </ul>
    
    <h5>Recommended Reading</h5>
    <ul>
      <li>"Atomic Habits" by James Clear</li>
      <li>"The Power of Habit" by Charles Duhigg</li>
    </ul>
    
    <h5>Research & Data</h5>
    <p>Studies show that it takes an average of 66 days to form a new habit. However, this can vary from 18 to 254 days depending on the person and the habit.</p>
  `;

  // --- Add or update habit (handles auto-add to To-Do if enabled) ---
  const handleSave = () => {
    if (!form.name || !form.frequency) return;
    let habitId: string = editingId || '';
    let isNew = false;
    if (editingId) {
      updateHabit({ ...(form as Habit), id: editingId, habitType: form.habitType || 'good', autoAddToTodo: form.autoAddToTodo || false, replacementHabit: form.replacementHabit });
    } else {
      const newHabit = addHabit({ ...(form as Omit<Habit, 'id'>), habitType: form.habitType || 'good', startDate: new Date().toISOString().slice(0, 10), autoAddToTodo: form.autoAddToTodo || false, replacementHabit: form.replacementHabit });
      habitId = newHabit.id;
      isNew = true;
    }
    // Immediate To-Do creation if autoAddToTodo is enabled and scheduled for today
    if (
      form.habitType === 'good' &&
      form.autoAddToTodo &&
      (form.frequency?.type === 'daily' || (form.frequency?.type === 'custom' && form.frequency.daysOfWeek && form.frequency.daysOfWeek.length > 0)) &&
      habitId &&
      isHabitScheduledForToday({ ...(form as Habit), id: habitId, habitType: form.habitType || 'good' })
    ) {
      const today = new Date().toISOString().slice(0, 10);
      // Check if already exists
      const todoList = JSON.parse(localStorage.getItem('todoList') || '[]');
      const alreadyExists = todoList.some((t: any) => t.habitId === habitId && t.createdAt && t.createdAt.slice(0, 10) === today);
      if (!alreadyExists) {
        addTask({
          text: form.name + ' (from Habit)',
          estimatedTime: '',
          completed: false,
          listType: 'todo',
          source: 'Routine',
          habitId: habitId,
        });
      }
    }
    setHabits(getHabits());
    setForm({ frequency: { type: 'daily' }, habitType: 'good' });
    setEditingId(null);
  };
  const handleEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setForm(habit);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const handleDelete = (id: string) => {
    deleteHabit(id);
    setHabits(getHabits());
  };

  // --- Mark complete/uncomplete for today (updates stats and calendar) ---
  const handleToggleComplete = (habit: Habit, date: string) => {
    const stats = getHabitStats(habit);
    if (stats.completions.includes(date)) {
      unmarkHabitComplete(habit.id, date);
    } else {
      markHabitComplete(habit.id, date);
    }
    setHabits(getHabits());
    setDummy(d => d + 1); // force re-render
  };

  // --- Calendar and stats helpers ---
  const weekDates = getCurrentWeekDates();
  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last8Weeks = getLastNWeeks(8);
  
  // Get the date range for the 8-week calendar
  const getDateRange = () => {
    const startDate = last8Weeks[0][0]; // First day of oldest week
    const endDate = last8Weeks[last8Weeks.length - 1][6]; // Last day of most recent week
    return { startDate, endDate };
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Habit Tracker</h2>
        <button 
          className="btn btn-outline-info btn-sm" 
          onClick={() => setShowInfoModal(true)}
          title="Learn more about habit tracking"
        >
          <i className="bi bi-info-circle"></i>
        </button>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
          <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-scrollable modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Habit Tracking Guide</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowInfoModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body" dangerouslySetInnerHTML={{ __html: infoContent }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Habit Form */}
      <div className="card mb-4" ref={formRef}>
        <div className="card-body">
          <h5 className="card-title">{editingId ? 'Edit Habit' : 'Add Habit'}</h5>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Habit name"
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Goal (optional)"
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.frequency?.type || 'daily'}
                onChange={e => {
                  const newType = e.target.value as FrequencyType;
                  setForm(f => ({
                    ...f,
                    frequency: {
                      type: newType,
                      timesPerWeek: newType === 'custom' ? undefined : f.frequency?.timesPerWeek,
                      daysOfWeek: newType === 'custom' ? [] : f.frequency?.daysOfWeek
                    }
                  }));
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {/* Habit Type Dropdown */}
            <div className="col-md-2">
              <label htmlFor="habitType" className="form-label mb-0">Habit Type</label>
              <select
                id="habitType"
                className="form-select"
                value={form.habitType || 'good'}
                onChange={e => setForm(f => ({ ...f, habitType: e.target.value as HabitType }))}
                title="Track habits you want to build (Good) or stop (Avoid)."
              >
                <option value="good">Good Habit</option>
                <option value="avoid">Avoid Habit</option>
              </select>
            </div>
            {form.frequency?.type === 'custom' && (
              <div className="col-md-2">
                <select
                  className="form-select"
                  multiple
                  value={form.frequency.daysOfWeek?.map(String) || []}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions).map(o => Number(o.value));
                    setForm(f => ({
                      ...f,
                      frequency: {
                        ...f.frequency,
                        daysOfWeek: options,
                        type: 'custom',
                        timesPerWeek: undefined
                      },
                    }));
                  }}
                >
                  <option value={0}>Sun</option>
                  <option value={1}>Mon</option>
                  <option value={2}>Tue</option>
                  <option value={3}>Wed</option>
                  <option value={4}>Thu</option>
                  <option value={5}>Fri</option>
                  <option value={6}>Sat</option>
                </select>
              </div>
            )}
            {form.frequency?.type === 'weekly' && (
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Times/week"
                  min={1}
                  value={form.frequency.timesPerWeek || ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    frequency: {
                      ...f.frequency,
                      timesPerWeek: Number(e.target.value),
                      type: 'weekly'
                    },
                  }))}
                />
              </div>
            )}
            <div className="col-md-2">
              <label htmlFor="reminderTime" className="form-label mb-0">Reminder</label>
              <input
                type="time"
                id="reminderTime"
                className="form-control"
                placeholder="08:00 (optional)"
                value={form.reminderTime || '08:00'}
                onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))}
              />
              <div className="form-text">No notifications yet. For your reference only.</div>
            </div>
            {form.habitType === 'good' && (form.frequency?.type === 'daily' || (form.frequency?.type === 'custom' && form.frequency.daysOfWeek && form.frequency.daysOfWeek.length > 0)) && (
              <div className="col-md-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoAddToTodo"
                    checked={!!form.autoAddToTodo}
                    onChange={e => setForm(f => ({ ...f, autoAddToTodo: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="autoAddToTodo">
                    Auto-add to To-Do List each day
                  </label>
                </div>
              </div>
            )}
            {form.habitType === 'avoid' && (
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Replacement Habit (what to do instead)"
                  value={form.replacementHabit || ''}
                  onChange={e => setForm(f => ({ ...f, replacementHabit: e.target.value }))}
                />
              </div>
            )}
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={handleSave}>{editingId ? 'Save' : 'Add'}</button>
            </div>
            {editingId && (
              <div className="col-md-2">
                <button className="btn btn-secondary w-100" onClick={() => { setEditingId(null); setForm({ frequency: { type: 'daily' }, habitType: 'good' }); }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Filter Toggle */}
      <div className="mb-3 d-flex gap-2 align-items-center">
        <span className="fw-bold">Show:</span>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>All</button>
        <button className={`btn btn-sm ${filter === 'good' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilter('good')}>Good Habits</button>
        <button className={`btn btn-sm ${filter === 'avoid' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFilter('avoid')}>Avoid Habits</button>
      </div>
      {/* Habit List */}
      <ul className="list-group">
        {filteredHabits.map((habit, idx) => {
          const stats = getHabitStats(habit);
          const { startDate, endDate } = getDateRange();
          const historicalCompletions = getHistoricalCompletionsForRange(habit.id, startDate, endDate);
          
          // Determine if a day should be enabled based on habit type
          const isDayEnabled = (date: string) => {
            if (habit.frequency.type === 'daily') return true;
            if (habit.frequency.type === 'weekly') return true; // All days enabled for weekly
            if (habit.frequency.type === 'custom') {
              const dayOfWeek = new Date(date).getDay();
              return habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
            }
            return true;
          };

          // Emoji for habit type
          const habitEmoji = habit.habitType === 'avoid' ? '🚫' : '✅';

          return (
            <li
              key={habit.id}
              className={`list-group-item mb-3 habit-draggable${dragOverIndex === idx ? ' drag-over' : ''} d-flex align-items-start`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              style={{ transition: 'background 0.2s' }}
            >
              <span className="me-3" style={{ cursor: 'grab', fontSize: 18, alignSelf: 'flex-start' }} title="Drag to reorder">☰</span>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{habitEmoji} {habit.name}</strong> <span className="text-muted small">{habit.description && !habit.description.startsWith('GOAL:') ? '' : habit.description}</span>
                    {habit.description && (
                      <div className="small mt-1"><span className="fw-bold">GOAL:</span> {habit.description}</div>
                    )}
                  </div>
                  <div className="d-flex gap-2" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => handleEdit(habit)} title="Edit">&#9998;</button>
                    <button className="btn btn-outline-danger btn-sm me-2" onClick={() => handleDelete(habit.id)} title="Delete">&times;</button>
                    <button className="btn btn-outline-info btn-sm" onClick={() => setExpandedHabitId(expandedHabitId === habit.id ? null : habit.id)}>
                      {expandedHabitId === habit.id ? 'Hide Calendar' : 'Show Calendar'}
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="me-3">Streak: <strong>{stats.currentStreak}</strong></span>
                  <span className="me-3">Best: <strong>{stats.bestStreak}</strong></span>
                  <span className="me-3">Total: <strong>{stats.total}</strong></span>
                  <span className="me-3">%: <strong>{stats.percent}</strong></span>
                </div>
                {/* Day-of-week labels */}
                <div className="d-flex align-items-center mb-2">
                  {weekDayLabels.map((label, i) => (
                    <span key={label} className="text-center me-2" style={{ width: 35 }}>{label}</span>
                  ))}
                </div>
                {/* Streak/Calendar dots for this week */}
                <div className="d-flex align-items-center mb-2">
                  {weekDates.map((date, i) => {
                    const enabled = isDayEnabled(date);
                    const completed = stats.completions.includes(date);
                    // For avoid habits, invert logic
                    const isAvoid = habit.habitType === 'avoid';
                    return (
                      <button
                        key={date}
                        className={`btn btn-sm rounded-circle me-2 ${
                          !enabled ? 'btn-light' :
                          isAvoid ? (completed ? 'btn-danger' : 'btn-outline-secondary') : (completed ? 'btn-success' : 'btn-outline-secondary')
                        }`}
                        style={{ width: 35, height: 35, opacity: enabled ? 1 : 0.5 }}
                        onClick={() => enabled && handleToggleComplete(habit, date)}
                        title={date}
                        disabled={!enabled}
                      >
                        {isAvoid ? (completed ? '✗' : '') : (completed ? '✓' : '')}
                      </button>
                    );
                  })}
                </div>
                {expandedHabitId === habit.id && (
                  <div className="mb-2">
                    <div className="mb-1 fw-bold text-center text-md-start">Last 8 Weeks</div>
                    {/* 8-week stats for this habit */}
                    <div className="mb-2 text-muted small text-center text-md-start">
                      {(() => {
                        // Calculate stats for the last 8 weeks
                        const allDates = last8Weeks.flat();
                        const completions = getHistoricalCompletionsForRange(habit.id, allDates[0], allDates[allDates.length-1]);
                        const isAvoid = habit.habitType === 'avoid';
                        // For avoid: streak = consecutive unclicked days, best = max such streak, total = # days NOT clicked, % = success rate
                        if (isAvoid) {
                          let streak = 0, bestStreak = 0, cur = 0;
                          for (let i = allDates.length - 1; i >= 0; i--) {
                            if (!completions.includes(allDates[i])) {
                              streak++;
                            } else {
                              break;
                            }
                          }
                          for (let i = 0; i < allDates.length; i++) {
                            if (!completions.includes(allDates[i])) {
                              cur++;
                              bestStreak = Math.max(bestStreak, cur);
                            } else {
                              cur = 0;
                            }
                          }
                          const total = allDates.length - completions.length;
                          const percent = allDates.length > 0 ? Math.round((total / allDates.length) * 100) : 0;
                          return (
                            <>
                              Streak: <strong>{streak}</strong> | Best: <strong>{bestStreak}</strong> | Total: <strong>{total}</strong> | %: <strong>{percent}</strong>
                            </>
                          );
                        } else {
                          // Good habit logic (as before)
                          let streak = 0, bestStreak = 0, cur = 0;
                          for (let i = allDates.length - 1; i >= 0; i--) {
                            if (completions.includes(allDates[i])) {
                              streak++;
                            } else {
                              break;
                            }
                          }
                          for (let i = 0; i < allDates.length; i++) {
                            if (completions.includes(allDates[i])) {
                              cur++;
                              bestStreak = Math.max(bestStreak, cur);
                            } else {
                              cur = 0;
                            }
                          }
                          const percent = allDates.length > 0 ? Math.round((completions.length / allDates.length) * 100) : 0;
                          return (
                            <>
                              Streak: <strong>{streak}</strong> | Best: <strong>{bestStreak}</strong> | Total: <strong>{completions.length}</strong> | %: <strong>{percent}</strong>
                            </>
                          );
                        }
                      })()}
                    </div>
                    <div style={{ overflowX: 'auto' }} className="text-start ps-2 pe-4">
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th></th>
                            {weekDayLabels.map(label => (
                              <th key={label} className="text-center" style={{ width: 35 }}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {last8Weeks.map((week, wIdx) => (
                            <tr key={wIdx}>
                              <td className="text-start align-middle text-muted" style={{ minWidth: 60, fontWeight: 'bold' }}>
                                Week {last8Weeks.length - wIdx}
                              </td>
                              {week.map((date, dIdx) => {
                                const enabled = isDayEnabled(date);
                                const completed = historicalCompletions.includes(date);
                                const isAvoid = habit.habitType === 'avoid';
                                return (
                                  <td key={date} className="text-center p-1">
                                    <button
                                      className={`btn btn-xs rounded-circle ${
                                        !enabled ? 'btn-light' :
                                        isAvoid ? (completed ? 'btn-danger' : 'btn-outline-secondary') : (completed ? 'btn-success' : 'btn-outline-secondary')
                                      }`}
                                      style={{ 
                                        width: 30, 
                                        height: 30, 
                                        fontSize: 14, 
                                        padding: 0,
                                        opacity: enabled ? 1 : 0.5
                                      }}
                                      onClick={() => {
                                        if (enabled || completed) {
                                          if (completed) {
                                            unmarkHabitComplete(habit.id, date);
                                          } else {
                                            markHabitComplete(habit.id, date);
                                          }
                                          setHabits(getHabits());
                                          setDummy(d => d + 1);
                                        }
                                      }}
                                      title={date}
                                    >
                                      {isAvoid ? (completed ? '✗' : '') : (completed ? '✓' : '')}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="text-muted small">
                  {habit.frequency.type === 'custom' && habit.frequency.daysOfWeek && (
                    <>Days: {habit.frequency.daysOfWeek.map(d => weekDayLabels[d]).join(', ')} </>
                  )}
                  {habit.frequency.type === 'weekly' && (
                    <>Once per week</>
                  )}
                  {habit.reminderTime && (
                    <>| Reminder: {formatTime12h(habit.reminderTime)}</>
                  )}
                </div>
                {habit.habitType === 'avoid' && habit.replacementHabit && isHabitScheduledForToday(habit) && (
                  <div className="mt-2">
                    <span className="text-danger fw-bold">Do this instead:</span> {habit.replacementHabit}
                    <button
                      className="btn btn-outline-primary btn-sm ms-2"
                      onClick={() => {
                        addTask({
                          text: habit.replacementHabit + ' (from Habit)',
                          estimatedTime: '',
                          completed: false,
                          listType: 'todo',
                          source: 'Routine',
                          habitId: habit.id,
                        });
                      }}
                      title="Add replacement to To-Do List"
                    >
                      + To-Do
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default HabitTracker; 