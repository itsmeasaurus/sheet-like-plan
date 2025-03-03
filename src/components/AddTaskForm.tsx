import React from 'react';

interface AddTaskFormProps {
  newTaskName: string;
  setNewTaskName: (name: string) => void;
  addTask: () => void;
}

const AddTaskForm = ({ newTaskName, setNewTaskName, addTask }: AddTaskFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div className="add-task-form">
      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add new task..."
          className="task-input"
        />
        <button type="submit" className="add-task-btn">Add Task</button>
      </form>
    </div>
  );
};

export default AddTaskForm; 