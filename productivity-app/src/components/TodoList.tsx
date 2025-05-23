// TodoList.tsx
// Main To-Do List component for the productivity app.
// Handles To-Do, Done, and Tomorrow lists, including CRUD, drag-and-drop, timers, and integration with habits and goals.

import React, { useState, useEffect, useRef } from 'react';
import GreenCheckmark from './goals/GreenCheckmark';
import {
  getTodoList, getDoneList, getTomorrowList, addTask, updateTask, deleteTask, moveTask, rolloverIfNeeded,
} from '../utils/todoLocalStorage';
import type { TodoTask } from '../utils/todoLocalStorage';
import { markHabitComplete } from '../utils/habitLocalStorage';
import { getGoals, addSubGoal, updateSubGoal, updateSubGoalText } from '../utils/goalsLocalStorage';
import { useDragAndDropList } from '../hooks/useDragAndDropList';
import { formatTime } from '../utils/format';

const TIMER_STATE_KEY = 'todoTimerState';

const TodoList: React.FC = () => {
  // --- Rollover logic: move Tomorrow tasks to Today if due ---
  useEffect(() => { rolloverIfNeeded(); }, []);

  // --- State ---
  const [todoList, setTodoList] = useState<TodoTask[]>(getTodoList());
  const [doneList, setDoneList] = useState<TodoTask[]>(getDoneList());
  const [tomorrowList, setTomorrowList] = useState<TodoTask[]>(getTomorrowList());
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskEst, setNewTaskEst] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingEst, setEditingEst] = useState('');

  // --- Timer state ---
  const [timedTaskId, setTimedTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // --- Restore timer state from localStorage on mount ---
  useEffect(() => {
    const timerState = localStorage.getItem(TIMER_STATE_KEY);
    if (timerState) {
      const { timedTaskId, timerSeconds } = JSON.parse(timerState);
      setTimedTaskId(timedTaskId);
      setTimerSeconds(timerSeconds);
      // If browser was closed, pause timer but keep elapsed time
    }
  }, []);

  // --- Persist timer state to localStorage ---
  useEffect(() => {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
      timedTaskId,
      timerSeconds,
      lastUpdated: Date.now(),
    }));
  }, [timedTaskId, timerSeconds]);

  // --- Load lists from storage on mount ---
  useEffect(() => {
    setTodoList(getTodoList());
    setDoneList(getDoneList());
    setTomorrowList(getTomorrowList());
  }, []);

  // --- Save lists to storage on change ---
  useEffect(() => { if (todoList) localStorage.setItem('todoList', JSON.stringify(todoList)); }, [todoList]);
  useEffect(() => { if (doneList) localStorage.setItem('doneList', JSON.stringify(doneList)); }, [doneList]);
  useEffect(() => { if (tomorrowList) localStorage.setItem('tomorrowList', JSON.stringify(tomorrowList)); }, [tomorrowList]);

  // --- Timer logic: start/stop interval ---
  useEffect(() => {
    if (timedTaskId) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timedTaskId]);

  // --- Goal linking state ---
  const [goals] = useState(() => getGoals().filter(g => !g.completed));
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>('');
  const [editingGoalId, setEditingGoalId] = useState<string>('');

  // --- Drag-and-drop state for To-Do list ---
  const {
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragAndDropList((fromIdx, toIdx) => {
    const newList = [...todoList];
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setTodoList(newList);
    localStorage.setItem('todoList', JSON.stringify(newList));
  });

  // --- Add new task (optionally links to a goal/sub-goal) ---
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const goalId = newTaskGoalId;
    let subGoalId = '';
    if (goalId) {
      const updatedGoal = addSubGoal(goalId, newTaskText.trim());
      if (updatedGoal) {
        const subGoal = updatedGoal.subGoals[updatedGoal.subGoals.length - 1];
        subGoalId = subGoal.id;
        window.dispatchEvent(new Event('goalsUpdated'));
      }
    }
    addTask({
      text: newTaskText.trim(),
      estimatedTime: newTaskEst.trim(),
      completed: false,
      listType: 'todo',
      goalId: goalId || undefined,
      subGoalId: subGoalId || undefined,
    });
    setTodoList([...getTodoList()]);
    setNewTaskText('');
    setNewTaskEst('');
    setNewTaskGoalId('');
  };

  // --- Edit task (optionally updates linked sub-goal) ---
  const startEdit = (task: TodoTask) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
    setEditingEst(task.estimatedTime);
  };
  const saveEdit = (task: TodoTask) => {
    const updated: TodoTask = { ...task, text: editingText.trim(), estimatedTime: editingEst.trim() };
    updateTask(updated);
    // If linked to a sub-goal, update its text too
    if (task.goalId && task.subGoalId) {
      updateSubGoalText(task.goalId, task.subGoalId, editingText.trim());
    }
    if (task.listType === 'todo') setTodoList([...getTodoList()]);
    if (task.listType === 'done') setDoneList([...getDoneList()]);
    if (task.listType === 'tomorrow') setTomorrowList([...getTomorrowList()]);
    setEditingTaskId(null);
    setEditingText('');
    setEditingEst('');
  };
  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
    setEditingEst('');
  };
  const completeTask = (task: TodoTask) => {
    stopTimer();
    const now = new Date().toISOString();
    const updated: TodoTask = { ...task, completed: true, completedAt: now, actualTime: task.actualTime || timerSeconds, listType: 'done' };
    updateTask(updated);
    moveTask(task.id, 'todo', 'done');
    setTodoList([...getTodoList()]);
    setDoneList([...getDoneList()]);
    setTimedTaskId(null);
    setTimerSeconds(0);
    // If this is an auto-added (Routine) task linked to a habit, mark the habit complete for today
    if (task.source === 'Routine' && task.habitId) {
      const today = new Date().toISOString().slice(0, 10);
      markHabitComplete(task.habitId, today);
    }
    // If linked to a sub-goal, mark it complete
    if (task.goalId && task.subGoalId) {
      updateSubGoal(task.goalId, task.subGoalId, true);
    }
  };
  const pushToTomorrow = (task: TodoTask) => {
    moveTask(task.id, 'todo', 'tomorrow');
    setTodoList([...getTodoList()]);
    setTomorrowList([...getTomorrowList()]);
  };
  const moveToToday = (task: TodoTask) => {
    moveTask(task.id, 'tomorrow', 'todo');
    setTomorrowList([...getTomorrowList()]);
    setTodoList([...getTodoList()]);
  };

  // --- Timer controls for each task ---
  const startTimer = (task: TodoTask) => {
    setTimedTaskId(task.id);
    setTimerSeconds(task.actualTime || 0);
  };
  const stopTimer = () => {
    if (timedTaskId) {
      const task = todoList.find(t => t.id === timedTaskId);
      if (task) {
        updateTask({ ...task, actualTime: timerSeconds });
        setTodoList([...getTodoList()]);
      }
    }
    setTimedTaskId(null);
    setTimerSeconds(0);
  };

  // --- Info modal content for best practices ---
  const [showInfoModal, setShowInfoModal] = useState(false);
  const infoContent = `
    <h4>To-Do List Best Practices</h4>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <h5>Key Principles</h5>
    <ul>
      <li>Break tasks into small steps</li>
      <li>Prioritize important tasks</li>
      <li>Review and update daily</li>
      <li>Celebrate completed tasks</li>
    </ul>
    <h5>Recommended Reading</h5>
    <ul>
      <li>"Getting Things Done" by David Allen</li>
    </ul>
  `;

  // Add handler for deleting all done tasks
  const handleDeleteAllDone = () => {
    setDoneList([]);
    localStorage.setItem('doneList', JSON.stringify([]));
  };

  // --- Delete task and update state ---
  const handleDeleteTask = (task: TodoTask) => {
    deleteTask(task.id, task.listType);
    if (task.listType === 'todo') setTodoList([...getTodoList()]);
    if (task.listType === 'done') setDoneList([...getDoneList()]);
    if (task.listType === 'tomorrow') setTomorrowList([...getTomorrowList()]);
  };

  // Render
  return (
    <div>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">To-Do List</h2>
          <button className="btn btn-outline-info btn-sm" onClick={() => setShowInfoModal(true)} title="Learn more about To-Do Lists">
            <i className="bi bi-info-circle"></i>
          </button>
        </div>
        {showInfoModal && (
          <>
            <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
            <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-scrollable modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">To-Do List Guide</h5>
                    <button type="button" className="btn-close" onClick={() => setShowInfoModal(false)} aria-label="Close"></button>
                  </div>
                  <div className="modal-body" dangerouslySetInnerHTML={{ __html: infoContent }} />
                </div>
              </div>
            </div>
          </>
        )}
        {/* Global Timer Bar */}
        <div className="mb-4 p-3 bg-light rounded shadow-sm d-flex align-items-center justify-content-between">
          <div>
            <strong>Timer:</strong> {timedTaskId ? todoList.find(t => t.id === timedTaskId)?.text : 'No task running'}
          </div>
          <div className="fs-3 fw-bold">{formatTime(timerSeconds)}</div>
          <div>
            {timedTaskId ? (
              <button className="btn btn-warning me-2" onClick={stopTimer}>Stop</button>
            ) : null}
          </div>
        </div>
        {/* Add New Task */}
        <div className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Est. min (optional)"
            value={newTaskEst}
            onChange={e => setNewTaskEst(e.target.value)}
          />
          <button className="btn btn-outline-secondary" type="button" title="Link to Goal as Sub-goal">
            <i className="bi bi-link-45deg"></i>
            <select
              className="form-select form-select-sm ms-2"
              style={{ width: 150, display: 'inline-block' }}
              value={newTaskGoalId}
              onChange={e => setNewTaskGoalId(e.target.value)}
            >
              <option value="">No Goal</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </button>
          <button className="btn btn-primary" onClick={handleAddTask}>Add</button>
        </div>
        {/* To-Do List */}
        <ul className="list-group mb-4">
          {todoList.map((task, idx) => (
            <li
              key={task.id}
              className={`list-group-item d-flex align-items-center justify-content-between todo-draggable todo-row${dragOverIndex === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              style={{ transition: 'background 0.2s' }}
            >
              {editingTaskId === task.id ? (
                <div className="d-flex align-items-center flex-grow-1 gap-2" style={{ minWidth: 0 }}>
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={{ minWidth: 0, flex: 1 }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingEst}
                    onChange={e => setEditingEst(e.target.value)}
                    placeholder="Est. min"
                    style={{ width: 80 }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <button className="btn btn-primary btn-sm me-1" onClick={() => saveEdit(task)}>Save</button>
                  <button className="btn btn-secondary btn-sm me-1" onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <div className="d-flex align-items-center flex-grow-1 gap-2" style={{ minWidth: 0 }}>
                  <span className="me-2" style={{ cursor: 'grab', fontSize: 18 }} title="Drag to reorder">☰</span>
                  <span className="me-2 flex-grow-1">{task.text}</span>
                  {task.source === 'Routine' && (
                    <span className="badge bg-info text-dark ms-2" title="Auto-added from Habit">Routine</span>
                  )}
                  {task.source === 'Goal' && (
                    <span className="badge bg-primary text-light ms-2" title="Added from Goal">Goal</span>
                  )}
                  <span className="me-2 text-muted small">Est: {task.estimatedTime || '--'}</span>
                  <span className="me-2 text-muted small">Actual: {task.actualTime ? formatTime(task.actualTime) : '--'}</span>
                </div>
              )}
              <div className="d-flex align-items-center ms-auto gap-2">
                {editingTaskId === task.id ? null : (
                  <>
                    <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => startEdit(task)} title="Edit">&#9998;</button>
                    <button className="btn btn-outline-danger btn-sm me-1" onClick={() => handleDeleteTask(task)} title="Delete">&times;</button>
                    <button className="btn btn-outline-info btn-sm me-1" onClick={() => pushToTomorrow(task)} title="Push to Tomorrow">&rarr;</button>
                    {timedTaskId === task.id ? (
                      <button className="btn btn-warning btn-sm me-1" onClick={stopTimer}>Stop</button>
                    ) : (
                      <button className="btn btn-success btn-sm me-1" onClick={() => startTimer(task)} disabled={!!timedTaskId}>Start</button>
                    )}
                    <button className="btn p-0 me-2" style={{background: 'none', border: 'none'}} onClick={() => completeTask(task)} title="Mark as done">
                      <GreenCheckmark size={24} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {/* Done List */}
        <h4>Done</h4>
        <button className="btn btn-danger btn-sm mb-2" onClick={handleDeleteAllDone} title="Delete all completed tasks">
          <i className="bi bi-trash"></i> Delete All
        </button>
        <ul className="list-group mb-4">
          {doneList.map(task => (
            <li key={task.id} className="list-group-item d-flex align-items-center justify-content-between">
              {editingTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={{ minWidth: 0, flex: 1 }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingEst}
                    onChange={e => setEditingEst(e.target.value)}
                    placeholder="Est. min"
                    style={{ width: 80 }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <button className="btn btn-primary btn-sm me-1" onClick={() => saveEdit(task)}>Save</button>
                  <button className="btn btn-secondary btn-sm me-1" onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="me-2 flex-grow-1">{task.text}</span>
                  <span className="me-2 text-muted small">Est: {task.estimatedTime || '--'}</span>
                  <span className="me-2 text-muted small">Actual: {task.actualTime ? formatTime(task.actualTime) : '--'}</span>
                </>
              )}
              <div className="d-flex align-items-center ms-auto gap-2">
                {editingTaskId === task.id ? null : (
                  <>
                    <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => startEdit(task)} title="Edit">&#9998;</button>
                    <button className="btn btn-outline-danger btn-sm me-1" onClick={() => handleDeleteTask(task)} title="Delete">&times;</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {/* Tomorrow List */}
        <h4>Tomorrow</h4>
        <ul className="list-group mb-4">
          {tomorrowList.map(task => (
            <li key={task.id} className="list-group-item d-flex align-items-center justify-content-between">
              {editingTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={{ minWidth: 0, flex: 1 }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm me-2"
                    value={editingEst}
                    onChange={e => setEditingEst(e.target.value)}
                    placeholder="Est. min"
                    style={{ width: 80 }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <button className="btn btn-primary btn-sm me-1" onClick={() => saveEdit(task)}>Save</button>
                  <button className="btn btn-secondary btn-sm me-1" onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="me-2 flex-grow-1">{task.text}</span>
                  <span className="me-2 text-muted small">Est: {task.estimatedTime || '--'}</span>
                </>
              )}
              <div className="d-flex align-items-center ms-auto gap-2">
                {editingTaskId === task.id ? null : (
                  <>
                    <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => startEdit(task)} title="Edit">&#9998;</button>
                    <button className="btn btn-outline-danger btn-sm me-1" onClick={() => handleDeleteTask(task)} title="Delete">&times;</button>
                    <button className="btn btn-outline-primary btn-sm me-1" onClick={() => moveToToday(task)} title="Move to Today">&larr;</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
      .todo-row {
        justify-content: space-between;
        flex-wrap: wrap;
      }
      @media (max-width: 767px) {
        .todo-row {
          flex-direction: column;
          align-items: stretch;
        }
      }
      `}</style>
    </div>
  );
};

export default TodoList; 