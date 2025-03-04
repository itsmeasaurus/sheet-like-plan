import React, { useState, useRef, useEffect } from 'react';
import TimelineHeader from './TimelineHeader';
import TaskRow from './TaskRow';
import AddTaskForm from './AddTaskForm';
import ActionsPanel from './ActionsPanel';

export type Task = {
  id: string;
  name: string;
  status: 'In progress' | 'Not started' | 'Completed' | 'Failed';
};

// Type for cell stage
export type CellStage = 'planning' | 'completed' | 'failed' | null;

// Type for selected cell
type SelectedCell = {
  taskId: string;
  month: string;
  day: number;
  stage?: CellStage;
};

// Type for cell data
type CellData = {
  taskId: string;
  month: string;
  day: number;
  stage: CellStage;
};

const TaskTimeline = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'AWS Learning', status: 'In progress' },
    { id: '2', name: 'NodeJS Review & Testing', status: 'Not started' },
    { id: '3', name: 'Typescript', status: 'Not started' },
    { id: '4', name: 'NextJS', status: 'Not started' },
    { id: '5', name: 'ReactJS', status: 'Not started' },
    { id: '6', name: 'Improving English', status: 'In progress' },
    { id: '7', name: 'Learning Thai', status: 'In progress' },
    { id: '8', name: 'Learning German', status: 'In progress' },
  ]);

  const [newTaskName, setNewTaskName] = useState('');
  const taskListRef = useRef<HTMLDivElement>(null);
  const timelineGridRef = useRef<HTMLDivElement>(null);
  
  // State for cell selection
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const [isCtrlKeyPressed, setIsCtrlKeyPressed] = useState(false);
  // Add state for selected month and day
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Add state for cell data and dropdown
  const [cellsData, setCellsData] = useState<CellData[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Add state for status popup
  const [statusPopup, setStatusPopup] = useState<{ taskId: string, x: number, y: number } | null>(null);
  // Add state for task deletion
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  // Add state for editable title and header
  const [title, setTitle] = useState<string>("Task Timeline");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState<string>("Skills To Learn");
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);

  // Add ref for the timeline wrapper
  const timelineWrapperRef = useRef<HTMLDivElement>(null);
  
  // Synchronize scrolling between task list and timeline grid
  useEffect(() => {
    const taskList = taskListRef.current;
    const timelineGrid = timelineGridRef.current;

    if (!taskList || !timelineGrid) return;

    const handleTaskListScroll = () => {
      if (timelineGrid) {
        timelineGrid.scrollTop = taskList.scrollTop;
      }
    };

    const handleTimelineGridScroll = () => {
      if (taskList) {
        taskList.scrollTop = timelineGrid.scrollTop;
      }
    };

    taskList.addEventListener('scroll', handleTaskListScroll);
    timelineGrid.addEventListener('scroll', handleTimelineGridScroll);

    return () => {
      taskList.removeEventListener('scroll', handleTaskListScroll);
      timelineGrid.removeEventListener('scroll', handleTimelineGridScroll);
    };
  }, []);

  // Handle click outside to clear selection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is on the dropdown or the Set Stage button
      const target = event.target as HTMLElement;
      const isDropdownClick = target.closest('.stage-dropdown') !== null;
      const isSetStageButtonClick = target.closest('.action-button') !== null;
      
      if (
        timelineWrapperRef.current && 
        !timelineWrapperRef.current.contains(event.target as Node) &&
        selectedCells.length > 0 &&
        !isDropdownClick && 
        !isSetStageButtonClick
      ) {
        // Clear selection when clicking outside the timeline and not on dropdown elements
        setSelectedCells([]);
        setIsDropdownOpen(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCells]);

  // Handle keyboard events for selection modifiers and ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(true);
      } else if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlKeyPressed(true);
      } else if (e.key === 'Escape') {
        // Clear selection when ESC key is pressed
        setSelectedCells([]);
        setIsDropdownOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftKeyPressed(false);
      } else if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Check if a cell is selected
  const isCellSelected = (taskId: string, month: string, day: number) => {
    return selectedCells.some(
      cell => cell.taskId === taskId && cell.month === month && cell.day === day
    );
  };

  // Handle mouse down on a cell
  const handleCellMouseDown = (taskId: string, month: string, day: number) => {
    const cell = { taskId, month, day };
    setIsSelecting(true);
    setSelectionStart(cell);
    
    // Set the selected month and day
    setSelectedMonth(month);
    setSelectedDay(day);

    // If Ctrl/Cmd key is pressed, add to selection
    if (isCtrlKeyPressed) {
      if (isCellSelected(taskId, month, day)) {
        // If already selected, remove it
        setSelectedCells(prev => prev.filter(
          c => !(c.taskId === taskId && c.month === month && c.day === day)
        ));
      } else {
        // Add to selection
        setSelectedCells(prev => [...prev, cell]);
      }
    } else if (isShiftKeyPressed && selectedCells.length > 0) {
      // If shift key is pressed, select range from last selected cell
      const lastSelected = selectedCells[selectedCells.length - 1];
      const newSelection = getSelectionRange(lastSelected, cell);
      setSelectedCells(prev => {
        // Combine previous selection with new range
        const combined = [...prev];
        newSelection.forEach(newCell => {
          if (!isCellSelected(newCell.taskId, newCell.month, newCell.day)) {
            combined.push(newCell);
          }
        });
        return combined;
      });
    } else {
      // Start new selection
      setSelectedCells([cell]);
    }
  };

  // Handle mouse enter on a cell during selection
  const handleCellMouseEnter = (taskId: string, month: string, day: number) => {
    if (isSelecting && selectionStart) {
      const currentCell = { taskId, month, day };
      const selectionRange = getSelectionRange(selectionStart, currentCell);
      
      if (!isCtrlKeyPressed && !isShiftKeyPressed) {
        // Replace selection with new range
        setSelectedCells(selectionRange);
      }
    }
  };

  // Handle mouse up to end selection
  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Get all cells in a selection range
  const getSelectionRange = (start: SelectedCell, end: SelectedCell): SelectedCell[] => {
    const result: SelectedCell[] = [];
    
    // Find task indices
    const startTaskIndex = tasks.findIndex(t => t.id === start.taskId);
    const endTaskIndex = tasks.findIndex(t => t.id === end.taskId);
    
    // Find month indices
    const startMonthIndex = months.findIndex(m => m.name === start.month);
    const endMonthIndex = months.findIndex(m => m.name === end.month);
    
    // Determine range boundaries
    const minTaskIndex = Math.min(startTaskIndex, endTaskIndex);
    const maxTaskIndex = Math.max(startTaskIndex, endTaskIndex);
    const minMonthIndex = Math.min(startMonthIndex, endMonthIndex);
    const maxMonthIndex = Math.max(startMonthIndex, endMonthIndex);
    const minDay = start.month === end.month ? Math.min(start.day, end.day) : 
                  (startMonthIndex < endMonthIndex ? start.day : end.day);
    const maxDay = start.month === end.month ? Math.max(start.day, end.day) : 
                  (startMonthIndex < endMonthIndex ? end.day : start.day);
    
    // Generate all cells in the range
    for (let taskIdx = minTaskIndex; taskIdx <= maxTaskIndex; taskIdx++) {
      const taskId = tasks[taskIdx].id;
      
      for (let monthIdx = minMonthIndex; monthIdx <= maxMonthIndex; monthIdx++) {
        const month = months[monthIdx].name;
        const monthDays = months[monthIdx].days;
        
        // Determine day range for this month
        let startDay = 1;
        let endDay = monthDays;
        
        if (monthIdx === minMonthIndex && month === start.month) {
          startDay = minDay;
        }
        
        if (monthIdx === maxMonthIndex && month === end.month) {
          endDay = maxDay;
        }
        
        for (let day = startDay; day <= endDay; day++) {
          result.push({ taskId, month, day });
        }
      }
    }
    
    return result;
  };

  const addTask = () => {
    if (newTaskName.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      status: 'Not started',
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    // Show confirmation dialog
    setTaskToDelete(taskId);
  };

  // Confirm task deletion
  const confirmDeleteTask = () => {
    if (taskToDelete) {
      // Remove the task
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete));
      
      // Clear any selected cells for this task
      setSelectedCells(prevSelected => prevSelected.filter(cell => cell.taskId !== taskToDelete));
      
      // Clear any cell data for this task
      setCellsData(prevCellData => prevCellData.filter(cell => cell.taskId !== taskToDelete));
      
      // Reset the task to delete
      setTaskToDelete(null);
    }
  };

  // Cancel task deletion
  const cancelDeleteTask = () => {
    setTaskToDelete(null);
  };

  // Handle title click to make it editable
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // Handle title blur to save changes
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  // Handle title key down to save on Enter
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  };

  // Handle header click to make it editable
  const handleHeaderClick = () => {
    setIsEditingHeader(true);
  };

  // Handle header change
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderText(e.target.value);
  };

  // Handle header blur to save changes
  const handleHeaderBlur = () => {
    setIsEditingHeader(false);
  };

  // Handle header key down to save on Enter
  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingHeader(false);
    }
  };

  // Define months for the timeline
  const months = [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 }
  ];

  // Helper function to determine if a day is a weekend (Saturday or Sunday)
  const isWeekend = (month: string, day: number): boolean => {
    // Get the current year
    const year = new Date().getFullYear();
    
    // Map month name to month number (0-indexed)
    const monthMap: { [key: string]: number } = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    // Create a date object for the given month and day
    const date = new Date(year, monthMap[month], day);
    
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Return true if it's Saturday (6) or Sunday (0)
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Get cell stage if it exists
  const getCellStage = (taskId: string, month: string, day: number): CellStage => {
    const cellData = cellsData.find(
      cell => cell.taskId === taskId && cell.month === month && cell.day === day
    );
    return cellData?.stage || null;
  };

  // Handle stage change for selected cells
  const handleStageChange = (stage: CellStage) => {
    // Update cell data for all selected cells
    const updatedCellsData = [...cellsData];
    
    selectedCells.forEach(selectedCell => {
      const { taskId, month, day } = selectedCell;
      
      // Check if cell data already exists
      const existingCellIndex = updatedCellsData.findIndex(
        cell => cell.taskId === taskId && cell.month === month && cell.day === day
      );
      
      if (stage === null) {
        // If clearing the stage, remove the cell data if it exists
        if (existingCellIndex >= 0) {
          updatedCellsData.splice(existingCellIndex, 1);
        }
      } else {
        // Otherwise update or add the stage
        if (existingCellIndex >= 0) {
          // Update existing cell data
          updatedCellsData[existingCellIndex].stage = stage;
        } else {
          // Add new cell data
          updatedCellsData.push({ taskId, month, day, stage });
        }
      }
    });
    
    setCellsData(updatedCellsData);
    setIsDropdownOpen(false);
    // We don't clear the selection, so cells remain selected after setting the stage
  };

  // Handle status cell click to show popup
  const handleStatusCellClick = (taskId: string, event: React.MouseEvent) => {
    // Get position for the popup
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Calculate position relative to the viewport
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    setStatusPopup({
      taskId,
      x: rect.left + scrollLeft,
      y: rect.bottom + scrollTop
    });
  };

  // Handle status update
  const handleStatusUpdate = (taskId: string, newStatus: 'In progress' | 'Not started' | 'Completed' | 'Failed') => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    setStatusPopup(null);
  };

  // Navigate to today's date
  const navigateToToday = () => {
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentDay = today.getDate();
    
    // Set the selected month and day to today
    setSelectedMonth(currentMonth);
    setSelectedDay(currentDay);
    
    // Find the element for today's date and scroll to it
    setTimeout(() => {
      const todayElement = document.querySelector(`.month-day-header[data-month="${currentMonth}"][data-day="${currentDay}"]`);
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }, 100);
  };

  // Close status popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusPopup && !(event.target as Element).closest('.status-popup')) {
        setStatusPopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusPopup]);

  return (
    <div className="task-timeline">
      <div className="timeline-header-container">
        {isEditingTitle ? (
          <input
            type="text"
            className="editable-title"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <h2 className="timeline-title" onClick={handleTitleClick}>
            {title}
          </h2>
        )}
        
        <div className="header-actions">
          {/* Today button */}
          <button 
            className="today-button"
            onClick={navigateToToday}
          >
            Today
          </button>
          
          {/* Floating Action Button and Dropdown - Always visible but disabled when no selection */}
          <div className="floating-action-container">
            <button 
              className={`action-button ${selectedCells.length === 0 ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedCells.length > 0) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              disabled={selectedCells.length === 0}
            >
              Set Stage
            </button>
            
            {isDropdownOpen && (
              <div 
                className="stage-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="stage-option planning-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageChange('planning');
                  }}
                >
                  Planning Stage
                </div>
                <div 
                  className="stage-option completed-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageChange('completed');
                  }}
                >
                  Completed Stage
                </div>
                <div 
                  className="stage-option failed-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageChange('failed');
                  }}
                >
                  Failed Stage
                </div>
                <div 
                  className="stage-option clear-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageChange(null);
                  }}
                >
                  Clear Stage
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="timeline-wrapper" ref={timelineWrapperRef}>
        <div className="fixed-columns">
          <div className="column-headers">
            {isEditingHeader ? (
              <input
                type="text"
                className="editable-header"
                value={headerText}
                onChange={handleHeaderChange}
                onBlur={handleHeaderBlur}
                onKeyDown={handleHeaderKeyDown}
                autoFocus
                style={{ textAlign: 'center' }}
              />
            ) : (
              <div className="task-header" onClick={handleHeaderClick}>
                {headerText}
              </div>
            )}
            <div className="status-header">Status</div>
          </div>
          <div className="task-list" ref={taskListRef}>
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="delete-task-button" onClick={() => handleDeleteTask(task.id)}>×</div>
                <div className="task-name">{task.name}</div>
                <div 
                  className={`task-status status-${task.status.toLowerCase().replace(' ', '-')}`}
                  onClick={(e) => handleStatusCellClick(task.id, e)}
                >
                  {task.status}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div 
          className="scrollable-timeline"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="month-headers">
            {months.map((month, monthIndex) => (
              <React.Fragment key={monthIndex}>
                {Array.from({ length: month.days }, (_, i) => i + 1).map(day => {
                  const isWeekendDay = isWeekend(month.name, day);
                  return (
                    <div 
                      key={`${month.name}-${day}`} 
                      className={`month-day-header ${day === 1 ? 'first-of-month' : ''} ${
                        month.name === selectedMonth && day === selectedDay ? 'selected-header' : ''
                      } ${isWeekendDay ? 'weekend' : ''}`}
                      data-month={month.name}
                      data-day={day}
                    >
                      {day}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="timeline-grid" ref={timelineGridRef}>
            {/* Day numbers row */}
            <div className="day-numbers-row">
              {months.map((month) => (
                Array.from({ length: month.days }, (_, i) => i + 1).map(day => {
                  const isWeekendDay = isWeekend(month.name, day);
                  return (
                    <div 
                      key={`${month.name}-${day}`} 
                      className={`day-number ${isWeekendDay ? 'weekend' : ''}`}
                    >
                      {day}
                    </div>
                  );
                })
              ))}
            </div>
            
            {tasks.map(task => (
              <div key={task.id} className="timeline-row">
                {months.map((month, monthIndex) => (
                  <div 
                    key={monthIndex} 
                    className="month-cells"
                    data-month={month.name}
                  >
                    {Array.from({ length: month.days }, (_, i) => i + 1).map(day => {
                      const isSelected = isCellSelected(task.id, month.name, day);
                      const cellStage = getCellStage(task.id, month.name, day);
                      const stageClass = cellStage ? `stage-${cellStage}` : '';
                      const isWeekendDay = isWeekend(month.name, day);
                      
                      return (
                        <div 
                          key={day} 
                          className={`timeline-cell ${isSelected ? 'selected' : ''} ${stageClass} ${isWeekendDay ? 'weekend' : ''}`}
                          onMouseDown={() => handleCellMouseDown(task.id, month.name, day)}
                          onMouseEnter={() => handleCellMouseEnter(task.id, month.name, day)}
                        >
                          <div className="cell-content"></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <AddTaskForm 
        newTaskName={newTaskName} 
        setNewTaskName={setNewTaskName} 
        addTask={addTask} 
      />

      <ActionsPanel 
        tasks={tasks}
        cellsData={cellsData}
        months={months}
      />

      {/* Status Popup */}
      {statusPopup && (
        <div 
          className="status-popup"
          style={{
            position: 'absolute',
            left: `${statusPopup.x}px`,
            top: `${statusPopup.y}px`,
            zIndex: 1000
          }}
        >
          <div 
            className="status-option in-progress-option"
            onClick={() => handleStatusUpdate(statusPopup.taskId, 'In progress')}
          >
            In progress
          </div>
          <div 
            className="status-option not-started-option"
            onClick={() => handleStatusUpdate(statusPopup.taskId, 'Not started')}
          >
            Not started
          </div>
          <div 
            className="status-option completed-option"
            onClick={() => handleStatusUpdate(statusPopup.taskId, 'Completed')}
          >
            Completed
          </div>
          <div 
            className="status-option failed-option"
            onClick={() => handleStatusUpdate(statusPopup.taskId, 'Failed')}
          >
            Failed
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Dialog */}
      {taskToDelete && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <div className="confirmation-dialog-header">
              <h3>Delete Task</h3>
            </div>
            <div className="confirmation-dialog-content">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>
            <div className="confirmation-dialog-footer">
              <button className="cancel-button" onClick={cancelDeleteTask}>Cancel</button>
              <button className="delete-button" onClick={confirmDeleteTask}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimeline; 