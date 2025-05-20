// GoalItem.tsx
// Renders a single Goal and its sub-goals for the productivity app.
// Handles sub-goal CRUD, drag-and-drop, editing, auto progress, and completion/feedback UI.

import React, { useState, useMemo } from 'react';
import type { Goal, SubGoal } from '../../utils/goalsLocalStorage'; // Adjusted path
// We'll need these later from goalsLocalStorage or passed as props from Goals.tsx
// import { addSubGoal, updateSubGoal, deleteSubGoal } from '../../utils/goalsLocalStorage';
import GreenCheckmark from './GreenCheckmark';
import { addTask } from '../../utils/todoLocalStorage';

interface GoalItemProps {
  goal: Goal;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, progress: number) => void;
  // Props for sub-goal operations to be added
  onAddSubGoal: (goalId: string, text: string) => void;
  onToggleSubGoal: (goalId: string, subGoalId: string, completed: boolean) => void;
  onDeleteSubGoal: (goalId: string, subGoalId: string) => void;
  onToggleComplete: (goalId: string, feedbackText: string) => void; // New prop for completing a goal
  onEditGoalTitle: (goalId: string, newTitle: string) => void;
  onEditSubGoalText: (goalId: string, subGoalId: string, newText: string, estimatedTime?: number) => void;
  onToggleAutoProgress: (goalId: string, auto: boolean) => void;
}

const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  onDeleteGoal,
  onUpdateGoalProgress,
  onAddSubGoal,
  onToggleSubGoal,
  onDeleteSubGoal,
  onToggleComplete,
  onEditGoalTitle,
  onEditSubGoalText,
  onToggleAutoProgress,
}) => {
  // --- State for editing, feedback, drag-and-drop, etc. ---
  const [newSubGoalText, setNewSubGoalText] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [editingSubGoalId, setEditingSubGoalId] = useState<string | null>(null);
  const [editedSubGoalText, setEditedSubGoalText] = useState('');
  const [editedSubGoalEst, setEditedSubGoalEst] = useState<number | ''>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [subGoals, setSubGoals] = useState(goal.subGoals);

  // --- Auto progress calculation (if enabled) ---
  const autoProgressValue = useMemo(() => {
    if (!goal.autoProgress) return goal.progress;
    if (goal.subGoals.length === 0) return 0;
    const completedCount = goal.subGoals.filter(sg => sg.completed).length;
    return Math.round((completedCount / goal.subGoals.length) * 100);
  }, [goal.autoProgress, goal.subGoals, goal.progress]);

  // --- Keep subGoals in sync with parent goal ---
  React.useEffect(() => { setSubGoals(goal.subGoals); }, [goal.subGoals]);

  // --- Add new sub-goal ---
  const handleAddSubGoal = () => {
    if (newSubGoalText.trim() === '') return;
    onAddSubGoal(goal.id, newSubGoalText.trim());
    setNewSubGoalText('');
  };

  // --- Complete goal: show feedback modal ---
  const handleCompleteClick = () => {
    setIsCompleting(true);
  };
  const handleSaveCompletion = () => {
    onToggleComplete(goal.id, feedbackText);
    setIsCompleting(false);
    setFeedbackText('');
  };
  const handleCancelCompletion = () => {
    setIsCompleting(false);
    setFeedbackText('');
  };

  // --- Edit main goal title ---
  const startEditTitle = () => {
    setEditedTitle(goal.title);
    setEditingTitle(true);
  };
  const saveEditTitle = () => {
    if (editedTitle.trim() && editedTitle !== goal.title) {
      onEditGoalTitle(goal.id, editedTitle.trim());
    }
    setEditingTitle(false);
  };
  const cancelEditTitle = () => {
    setEditingTitle(false);
    setEditedTitle(goal.title);
  };

  // --- Edit sub-goal text ---
  const startEditSubGoal = (subGoal: SubGoal) => {
    setEditingSubGoalId(subGoal.id);
    setEditedSubGoalText(subGoal.text);
    setEditedSubGoalEst(typeof subGoal.estimatedTime === 'number' ? subGoal.estimatedTime : '');
  };
  const saveEditSubGoal = (subGoal: SubGoal) => {
    if (editedSubGoalText.trim() && (editedSubGoalText !== subGoal.text || editedSubGoalEst !== subGoal.estimatedTime)) {
      onEditSubGoalText(goal.id, subGoal.id, editedSubGoalText.trim(), editedSubGoalEst === '' ? undefined : Number(editedSubGoalEst));
    }
    setEditingSubGoalId(null);
    setEditedSubGoalText('');
    setEditedSubGoalEst('');
  };
  const cancelEditSubGoal = () => {
    setEditingSubGoalId(null);
    setEditedSubGoalText('');
    setEditedSubGoalEst('');
  };

  // --- Drag-and-drop handlers for sub-goals ---
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (index: number) => setDragOverIndex(index);
  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newList = [...subGoals];
    const [moved] = newList.splice(draggedIndex, 1);
    newList.splice(index, 0, moved);
    setSubGoals(newList);
    // Optionally: trigger a parent update here if you want to persist order
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // --- Helper to update estimatedTime for a sub-goal ---
  const handleEstimatedTimeChange = (goalId: string, subGoalId: string, newText: string, estimatedTime?: number) => {
    onEditSubGoalText(goalId, subGoalId, newText, estimatedTime);
  };

  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between align-items-center mb-2">
        {editingTitle ? (
          <div className="input-group input-group-sm w-50">
            <input
              type="text"
              className="form-control"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEditTitle(); if (e.key === 'Escape') cancelEditTitle(); }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={saveEditTitle}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={cancelEditTitle}>Cancel</button>
          </div>
        ) : (
          <>
            <h5>{goal.title}</h5>
            {goal.rewardMotivation && (
              <div className="small text-muted fst-italic mb-2">Reward/Motivation: {goal.rewardMotivation}</div>
            )}
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={startEditTitle} title="Edit goal title">
              &#9998;
            </button>
          </>
        )}
        <div className="d-flex align-items-center gap-2">
          {!isCompleting && (
            <button onClick={handleCompleteClick} className="btn btn-success btn-lg p-0 d-inline-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }} title="Mark as complete">
              <GreenCheckmark size={28} />
            </button>
          )}
          <button onClick={() => onDeleteGoal(goal.id)} className="btn btn-danger btn-lg p-0 d-inline-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }} title="Delete goal">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 28, fontWeight: 'bold', lineHeight: 1 }}>
              ×
            </span>
          </button>
        </div>
      </div>

      {/* Auto Progress Toggle */}
      <div className="form-check form-switch mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          id={`auto-progress-${goal.id}`}
          checked={goal.autoProgress}
          onChange={e => onToggleAutoProgress(goal.id, e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`auto-progress-${goal.id}`}>
          Auto Progress
        </label>
      </div>

      {!isCompleting ? (
        <>
          <div className="mb-3">
            <label htmlFor={`progress-${goal.id}`} className="form-label small">
              Progress: {autoProgressValue}%
            </label>
            <input
              type="range"
              className="form-range"
              id={`progress-${goal.id}`}
              min="0"
              max="100"
              value={autoProgressValue}
              onChange={(e) => onUpdateGoalProgress(goal.id, parseInt(e.target.value))}
              disabled={goal.autoProgress}
            />
          </div>

          <h6>Sub-goals:</h6>
          {goal.subGoals.length === 0 && <p className="small text-muted">No sub-goals yet.</p>}
          <ul className="list-group list-group-flush mb-2">
            {subGoals.map((subGoal, idx) => (
              <li
                key={subGoal.id}
                className={`list-group-item d-flex align-items-center ps-0 subgoal-draggable subgoal-row${dragOverIndex === idx ? ' drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                style={{ transition: 'background 0.2s' }}
              >
                <div className="d-flex align-items-center flex-grow-1 gap-2" style={{ minWidth: 0 }}>
                  <span className="me-2" style={{ cursor: 'grab', fontSize: 18 }} title="Drag to reorder">☰</span>
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    id={`subgoal-${subGoal.id}`}
                    checked={subGoal.completed}
                    onChange={(e) => onToggleSubGoal(goal.id, subGoal.id, e.target.checked)}
                  />
                  {editingSubGoalId === subGoal.id ? (
                    <>
                      <input
                        type="text"
                        className="form-control form-control-sm me-2"
                        value={editedSubGoalText}
                        onChange={e => setEditedSubGoalText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditSubGoal(subGoal); if (e.key === 'Escape') cancelEditSubGoal(); }}
                        autoFocus
                        style={{width: 'auto', minWidth: 100}}
                      />
                      <input
                        type="number"
                        className="form-control form-control-sm me-2"
                        placeholder="min"
                        min={0}
                        value={editedSubGoalEst}
                        onChange={e => setEditedSubGoalEst(e.target.value === '' ? '' : Number(e.target.value))}
                        style={{width: 70}}
                      />
                      <button className="btn btn-primary btn-sm me-1" onClick={() => saveEditSubGoal(subGoal)}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEditSubGoal}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`subgoal-${subGoal.id}`} style={{ textDecoration: subGoal.completed ? 'line-through' : 'none', minWidth: 0, flex: 1 }}>
                        {subGoal.text}
                        {typeof subGoal.estimatedTime === 'number' && (
                          <span className="text-muted ms-2">({subGoal.estimatedTime} min)</span>
                        )}
                      </label>
                      <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => startEditSubGoal(subGoal)} title="Edit sub-goal">
                        &#9998;
                      </button>
                    </>
                  )}
                </div>
                <div className="d-flex align-items-center ms-auto gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    title="Add to Today's To-Do List"
                    onClick={() => {
                      addTask({
                        text: subGoal.text,
                        estimatedTime: subGoal.estimatedTime !== undefined ? String(subGoal.estimatedTime) : '',
                        completed: false,
                        listType: 'todo',
                        goalId: goal.id,
                        subGoalId: subGoal.id,
                        source: 'Goal',
                      });
                      window.dispatchEvent(new Event('todoListUpdated'));
                    }}
                  >
                    <i className="bi bi-link-45deg"></i>
                  </button>
                  <button onClick={() => onDeleteSubGoal(goal.id, subGoal.id)} className="btn btn-outline-secondary btn-sm py-0 px-1">
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="input-group input-group-sm mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Add new sub-goal..."
              value={newSubGoalText}
              onChange={(e) => setNewSubGoalText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubGoal();
                }
              }}
            />
            <button onClick={handleAddSubGoal} className="btn btn-outline-primary" type="button">
              Add Sub-goal
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 mb-3 p-2 border rounded">
          <h6>Complete Goal: {goal.title}</h6>
          <div className="mb-2">
            <textarea 
              className="form-control form-control-sm"
              rows={3}
              placeholder="Add feedback or notes for this completed goal (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          <button onClick={handleSaveCompletion} className="btn btn-primary btn-sm me-2">
            Save & Complete
          </button>
          <button onClick={handleCancelCompletion} className="btn btn-secondary btn-sm">
            Cancel
          </button>
        </div>
      )}
    </li>
  );
};

export default GoalItem;

<style>{`
.subgoal-row {
  justify-content: space-between;
  flex-wrap: wrap;
}
@media (max-width: 767px) {
  .subgoal-row {
    flex-direction: column;
    align-items: stretch;
  }
}
`}</style> 