import React, { useState, useRef, useEffect } from 'react';
import TimelineHeader from './TimelineHeader';
import TaskRow from './TaskRow';
import AddTaskForm from './AddTaskForm';

export type Task = {
  id: string;
  name: string;
  status: 'In progress' | 'Not started' | 'Completed';
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
      if (
        timelineWrapperRef.current && 
        !timelineWrapperRef.current.contains(event.target as Node) &&
        selectedCells.length > 0
      ) {
        // Clear selection when clicking outside the timeline
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

  // Define months for the timeline
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
  };

  return (
    <div className="task-timeline">
      <div className="timeline-header-container">
        <h2 className="timeline-title">Task Timeline</h2>
        {/* Floating Action Button and Dropdown - Always visible but disabled when no selection */}
        <div className="floating-action-container">
          <button 
            className={`action-button ${selectedCells.length === 0 ? 'disabled' : ''}`}
            onClick={() => selectedCells.length > 0 && setIsDropdownOpen(!isDropdownOpen)}
            disabled={selectedCells.length === 0}
          >
            Set Stage
          </button>
          
          {isDropdownOpen && (
            <div className="stage-dropdown">
              <div 
                className="stage-option planning-option"
                onClick={() => handleStageChange('planning')}
              >
                Planning Stage
              </div>
              <div 
                className="stage-option completed-option"
                onClick={() => handleStageChange('completed')}
              >
                Completed Stage
              </div>
              <div 
                className="stage-option failed-option"
                onClick={() => handleStageChange('failed')}
              >
                Failed Stage
              </div>
              <div 
                className="stage-option clear-option"
                onClick={() => handleStageChange(null)}
              >
                Clear Stage
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="timeline-wrapper" ref={timelineWrapperRef}>
        <div className="fixed-columns">
          <div className="column-headers">
            <div className="task-header">Skills To Learn</div>
            <div className="status-header">Status</div>
          </div>
          <div className="task-list" ref={taskListRef}>
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-name">{task.name}</div>
                <div className={`task-status status-${task.status.toLowerCase().replace(' ', '-')}`}>
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
                {Array.from({ length: month.days }, (_, i) => i + 1).map(day => (
                  <div 
                    key={`${month.name}-${day}`} 
                    className={`month-day-header ${day === 1 ? 'first-of-month' : ''} ${
                      month.name === selectedMonth && day === selectedDay ? 'selected-header' : ''
                    }`}
                    data-month={month.name}
                  >
                    {day}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          <div className="timeline-grid" ref={timelineGridRef}>
            {/* Day numbers row */}
            <div className="day-numbers-row">
              {months.map((month) => (
                Array.from({ length: month.days }, (_, i) => i + 1).map(day => (
                  <div key={`${month.name}-${day}`} className="day-number">{day}</div>
                ))
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
                      
                      return (
                        <div 
                          key={day} 
                          className={`timeline-cell ${isSelected ? 'selected' : ''} ${stageClass}`}
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
    </div>
  );
};

export default TaskTimeline; 