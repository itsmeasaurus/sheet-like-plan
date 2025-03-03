import { useState } from 'react';

const TimelineHeader = () => {
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

  return (
    <div className="timeline-header">
      <div className="task-column">Skills To Learn</div>
      <div className="status-column">Status</div>
      <div className="days-container">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="month-section">
            <div className="month-label">{month.name}</div>
            <div className="days-grid">
              {Array.from(
                { length: month.days }, 
                (_, i) => i + 1
              ).map(day => (
                <div key={`${month.name}-${day}`} className="day-cell">
                  {day}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineHeader; 