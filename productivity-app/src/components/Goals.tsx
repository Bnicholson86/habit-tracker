// Goals.tsx
// Main Goals component for the productivity app.
// Handles goal and sub-goal CRUD, progress, completion, feedback, drag-and-drop, and integration with To-Do list.

import React, { useState, useEffect, useMemo } from 'react';
import type { Goal } from '../utils/goalsLocalStorage';
import { 
  getGoals, addGoal, deleteGoal, updateGoal, 
  addSubGoal, updateSubGoal, deleteSubGoal, 
  toggleGoalCompletion, updateGoalTitle, updateSubGoalText, toggleGoalAutoProgress
} from '../utils/goalsLocalStorage';
import AddGoalForm from './goals/AddGoalForm';
import GoalItem from './goals/GoalItem';
// We will create these components in the next steps
// import AddGoalForm from './AddGoalForm'; 
// import GoalItem from './goals/GoalItem';

const Goals: React.FC = () => {
  // --- State ---
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const infoContent = `
    <h4>Goal Setting Best Practices</h4>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <h5>Key Principles</h5>
    <ul>
      <li>Set SMART goals</li>
      <li>Break goals into sub-goals</li>
      <li>Track progress regularly</li>
      <li>Adjust as needed</li>
    </ul>
    <h5>Recommended Reading</h5>
    <ul>
      <li>"Atomic Habits" by James Clear</li>
      <li>"Your Best Year Ever" by Michael Hyatt</li>
    </ul>
  `;

  // --- Load and sync goals from localStorage, listen for updates ---
  useEffect(() => {
    setGoals(getGoals());
    const handler = () => setGoals(getGoals());
    window.addEventListener('goalsUpdated', handler);
    return () => window.removeEventListener('goalsUpdated', handler);
  }, []);

  // --- Memoized filters for active and completed goals ---
  const activeGoals = useMemo(() => goals.filter(goal => !goal.completed), [goals]);
  const completedGoals = useMemo(() => goals.filter(goal => goal.completed).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()), [goals]);

  // --- Main Goal Handlers ---
  const handleAddGoal = (title: string, rewardMotivation?: string) => {
    const newGoal = addGoal(title, rewardMotivation);
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = deleteGoal(goalId);
    setGoals(updatedGoals);
    // If the deleted goal was completed, it will be removed from completedGoals by the filter
  };

  const handleUpdateGoalProgress = (goalId: string, progress: number) => {
    const currentGoal = goals.find(g => g.id === goalId);
    if (currentGoal && !currentGoal.completed) { // Progress update only for active goals
      const updatedGoalData = { ...currentGoal, progress };
      const updatedGoals = updateGoal(updatedGoalData);
      setGoals(updatedGoals);
    }
  };

  const handleToggleGoalCompletion = (goalId: string, feedbackText: string) => {
    const updatedGoal = toggleGoalCompletion(goalId, true, feedbackText); // Mark as completed
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => (g.id === goalId ? updatedGoal : g)));
    }
  };
  
  // --- Restore Completed Goal Handler ---
  const handleRestoreGoal = (goalId: string) => {
    const updatedGoal = toggleGoalCompletion(goalId, false);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => (g.id === goalId ? updatedGoal : g)));
    }
  };

  // --- Edit Handlers ---
  const handleEditGoalTitle = (goalId: string, newTitle: string) => {
    const updatedGoal = updateGoalTitle(goalId, newTitle);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  // --- Auto Progress Handler ---
  const handleToggleAutoProgress = (goalId: string, auto: boolean) => {
    const updatedGoal = toggleGoalAutoProgress(goalId, auto);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  // --- Sub-Goal Handlers (should only apply to active goals) ---
  const handleAddSubGoal = (goalId: string, text: string) => {
    const updatedGoal = addSubGoal(goalId, text);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  const handleToggleSubGoal = (goalId: string, subGoalId: string, completed: boolean) => {
    const updatedGoal = updateSubGoal(goalId, subGoalId, completed);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  const handleDeleteSubGoal = (goalId: string, subGoalId: string) => {
    const updatedGoal = deleteSubGoal(goalId, subGoalId);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  const handleEditSubGoalText = (goalId: string, subGoalId: string, newText: string, estimatedTime?: number) => {
    const updatedGoal = updateSubGoalText(goalId, subGoalId, newText, estimatedTime);
    if (updatedGoal) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
    }
  };

  return (
    <>
      <div className="container mt-4 goals-main-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Goals</h2>
          <button className="btn btn-outline-info btn-sm" onClick={() => setShowInfoModal(true)} title="Learn more about Goal Setting">
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
                    <h5 className="modal-title">Goal Setting Guide</h5>
                    <button type="button" className="btn-close" onClick={() => setShowInfoModal(false)} aria-label="Close"></button>
                  </div>
                  <div className="modal-body" dangerouslySetInnerHTML={{ __html: infoContent }} />
                </div>
              </div>
            </div>
          </>
        )}
        
        <AddGoalForm onAddGoal={handleAddGoal} />

        <h4 className="mt-4">Active Goals</h4>
        {activeGoals.length === 0 && <p className="mt-3">No active goals. Add one or complete existing ones!</p>}
        <ul className="list-group mt-3">
          {activeGoals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              onDeleteGoal={handleDeleteGoal} 
              onUpdateGoalProgress={handleUpdateGoalProgress}
              onAddSubGoal={handleAddSubGoal}
              onToggleSubGoal={handleToggleSubGoal}
              onDeleteSubGoal={handleDeleteSubGoal}
              onToggleComplete={handleToggleGoalCompletion}
              onEditGoalTitle={handleEditGoalTitle}
              onEditSubGoalText={handleEditSubGoalText}
              onToggleAutoProgress={handleToggleAutoProgress}
            />
          ))}
        </ul>

        {completedGoals.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-3">Completed Goal Log</h4>
            <ul className="list-group">
              {completedGoals.map(goal => (
                <li key={goal.id} className="list-group-item list-group-item-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="text-muted" style={{textDecoration: 'line-through'}}>{goal.title}</h5>
                      {goal.completedAt && <small className="text-muted ms-2">Completed: {new Date(goal.completedAt).toLocaleDateString()}</small>}
                      {goal.feedback && <p className="small mt-1 mb-0 fst-italic">Feedback: {goal.feedback}</p>}
                    </div>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleRestoreGoal(goal.id)}
                      title="Restore to Active Goals"
                    >
                      &#8634;
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <style>{`
        .goals-main-container {
          max-width: 900px;
        }
        @media (max-width: 767px) {
          .goals-main-container {
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
};

export default Goals; 