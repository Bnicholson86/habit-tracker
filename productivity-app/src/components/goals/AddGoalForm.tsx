import React, { useState } from 'react';

interface AddGoalFormProps {
  onAddGoal: (title: string, rewardMotivation?: string) => void;
}

const AddGoalForm: React.FC<AddGoalFormProps> = ({ onAddGoal }) => {
  const [title, setTitle] = useState('');
  const [rewardMotivation, setRewardMotivation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '') return;
    onAddGoal(title.trim(), rewardMotivation.trim() || undefined);
    setTitle('');
    setRewardMotivation('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <div className="input-group mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Enter new goal title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Add Goal
        </button>
      </div>
      <input
        type="text"
        className="form-control"
        placeholder="Set a Reward or Motivation if this Goal is Completed."
        value={rewardMotivation}
        onChange={e => setRewardMotivation(e.target.value)}
      />
    </form>
  );
};

export default AddGoalForm; 