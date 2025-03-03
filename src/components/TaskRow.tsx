import { useState } from 'react';
import { Task } from './TaskTimeline';

interface TaskRowProps {
  task: Task;
}

const TaskRow = ({ task }: TaskRowProps) => {
  // Define months for the first half of 2025
  const months = [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 }
  ];

  // Determine status class for styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'In progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return 'status-not-started';
    }
  };

  // Generate random marked days for visual demonstration
  const getRandomMarkedDays = (monthName: string) => {
    // This is just for visual demonstration - no real data
    const randomDays: number[] = [];
    
    if (task.status === 'In progress') {
      // For "In progress" tasks, add some random days
      const daysCount = Math.floor(Math.random() * 10) + 5; // 5-15 days
      for (let i = 0; i < daysCount; i++) {
        const day = Math.floor(Math.random() * 28) + 1; // Random day 1-28
        if (!randomDays.includes(day)) {
          randomDays.push(day);
        }
      }
    } else if (task.status === 'Completed') {
      // For "Completed" tasks, mark most days
      for (let i = 1; i <= 28; i++) {
        if (Math.random() > 0.3) { // 70% chance to be marked
          randomDays.push(i);
        }
      }
    }
    
    return randomDays;
  };

  // Check if a day should be marked
  const isDayMarked = (month: string, day: number) => {
    // For visual demonstration only
    const randomMarkedDays = getRandomMarkedDays(month);
    return randomMarkedDays.includes(day);
  };

  return (
    <div className="task-row">
      <div className="task-name">{task.name}</div>
      <div className={`task-status ${getStatusClass(task.status)}`}>
        {task.status}
      </div>
      <div className="months-timeline">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="month-cells">
            {Array.from(
              { length: month.days }, 
              (_, i) => i + 1
            ).map(day => (
              <div 
                key={`${month.name}-${day}`} 
                className={`timeline-cell ${isDayMarked(month.name, day) ? 'marked' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskRow; 