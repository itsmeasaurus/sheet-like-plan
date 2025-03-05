import React, { useState } from 'react';
import { Task, CellData } from './TaskTimeline';
import AnalysisPanel from './AnalysisPanel';

interface ActionsPanelProps {
  tasks: Task[];
  cellsData: CellData[];
  months: { name: string; days: number }[];
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({ tasks, cellsData, months }) => {
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);

  return (
    <div className="actions-panel">
      <h3 className="actions-title">Actions</h3>
      <div className="actions-buttons">
        <button 
          className="action-button download-button"
          onClick={() => setIsDownloadPopupOpen(true)}
        >
          Download Data
        </button>
      </div>

      {isDownloadPopupOpen && (
        <DownloadPopup 
          tasks={tasks}
          cellsData={cellsData}
          months={months}
          onClose={() => setIsDownloadPopupOpen(false)}
        />
      )}
      
      {/* Add the Analysis Panel */}
      <AnalysisPanel 
        tasks={tasks}
        cellsData={cellsData}
        months={months}
      />
    </div>
  );
};

interface DownloadPopupProps {
  tasks: Task[];
  cellsData: CellData[];
  months: { name: string; days: number }[];
  onClose: () => void;
}

const DownloadPopup: React.FC<DownloadPopupProps> = ({ tasks, cellsData, months, onClose }) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [fileFormat, setFileFormat] = useState<'json' | 'csv'>('json');
  const [selectAllMonths, setSelectAllMonths] = useState(false);
  const [selectAllTasks, setSelectAllTasks] = useState(false);

  // Handle month selection
  const handleMonthChange = (monthName: string) => {
    if (selectedMonths.includes(monthName)) {
      setSelectedMonths(selectedMonths.filter(m => m !== monthName));
      setSelectAllMonths(false);
    } else {
      setSelectedMonths([...selectedMonths, monthName]);
      if (selectedMonths.length + 1 === months.length) {
        setSelectAllMonths(true);
      }
    }
  };

  // Handle task selection
  const handleTaskChange = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
      setSelectAllTasks(false);
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
      if (selectedTasks.length + 1 === tasks.length) {
        setSelectAllTasks(true);
      }
    }
  };

  // Handle select all months
  const handleSelectAllMonths = () => {
    if (selectAllMonths) {
      setSelectedMonths([]);
      setSelectAllMonths(false);
    } else {
      setSelectedMonths(months.map(month => month.name));
      setSelectAllMonths(true);
    }
  };

  // Handle select all tasks
  const handleSelectAllTasks = () => {
    if (selectAllTasks) {
      setSelectedTasks([]);
      setSelectAllTasks(false);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
      setSelectAllTasks(true);
    }
  };

  // Generate and download the data
  const handleDownload = () => {
    // Filter data based on selections
    const filteredTasks = tasks.filter(task => 
      selectedTasks.length === 0 || selectedTasks.includes(task.id)
    );

    // Get selected months or all months if none selected
    const monthsToInclude = selectedMonths.length > 0 
      ? months.filter(month => selectedMonths.includes(month.name)) 
      : months;

    // Generate file content based on format
    let fileContent = '';
    let fileName = '';
    let fileType = '';

    if (fileFormat === 'json') {
      fileName = `task-timeline-export-${new Date().toISOString().slice(0, 10)}.json`;
      // Prepare the data object for JSON format
      const dataToExport = {
        tasks: filteredTasks,
        cellData: cellsData.filter(cell => 
          (selectedTasks.length === 0 || selectedTasks.includes(cell.taskId)) &&
          (selectedMonths.length === 0 || selectedMonths.includes(cell.month))
        )
      };
      
      fileContent = JSON.stringify(dataToExport, null, 2);
      fileType = 'application/json';
    } else {
      // CSV format
      fileName = `Task_Timeline_Export - ${new Date().toISOString().slice(0, 10)}.csv`;
      // First row: Skills To Learn header and empty cells, then Status, then months with days
      fileContent = 'Skills To Learn,,,Status';
      
      // Add all months and days headers
      monthsToInclude.forEach(month => {
        // Add the month name spanning its days
        fileContent += `,${month.name}`;
        // Add empty cells for the rest of the days in the month
        for (let i = 1; i < month.days; i++) {
          fileContent += ',';
        }
      });
      fileContent += '\n';
      
      // Second row: Empty cells for the first columns, then day numbers
      fileContent += ',,,,';
      
      // Add day numbers for each month
      monthsToInclude.forEach(month => {
        for (let day = 1; day <= month.days; day++) {
          fileContent += day + ',';
        }
      });
      fileContent = fileContent.slice(0, -1); // Remove trailing comma
      fileContent += '\n';
      
      // Task rows
      filteredTasks.forEach(task => {
        // Task name and status
        fileContent += `${task.name},,,${task.status}`;
        
        // Add cell data for each day
        monthsToInclude.forEach(month => {
          for (let day = 1; day <= month.days; day++) {
            // Find if there's cell data for this task, month, and day
            const cellData = cellsData.find(
              cell => cell.taskId === task.id && cell.month === month.name && cell.day === day
            );
            
            // Add appropriate marker based on cell stage
            if (cellData) {
              switch(cellData.stage) {
                case 'planning':
                  fileContent += ',P'; // P for Planning
                  break;
                case 'completed':
                  fileContent += ',X'; // X for Completed
                  break;
                case 'failed':
                  fileContent += ',F'; // F for Failed
                  break;
                default:
                  fileContent += ',';
              }
            } else {
              fileContent += ','; // Empty cell
            }
          }
        });
        
        fileContent += '\n';
      });
      
      fileType = 'text/csv';
    }

    // Create and trigger download
    const blob = new Blob([fileContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close the popup
    onClose();
  };

  return (
    <div className="download-popup-overlay">
      <div className="download-popup">
        <div className="download-popup-header">
          <h3>Download Data</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="download-popup-content">
          <div className="download-section">
            <h4>Select Months</h4>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="select-all-months" 
                checked={selectAllMonths}
                onChange={handleSelectAllMonths}
              />
              <label htmlFor="select-all-months">Select All Months</label>
            </div>
            <div className="checkbox-grid">
              {months.map(month => (
                <div key={month.name} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id={`month-${month.name}`}
                    checked={selectedMonths.includes(month.name)}
                    onChange={() => handleMonthChange(month.name)}
                  />
                  <label htmlFor={`month-${month.name}`}>{month.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="download-section">
            <h4>Select Tasks</h4>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="select-all-tasks" 
                checked={selectAllTasks}
                onChange={handleSelectAllTasks}
              />
              <label htmlFor="select-all-tasks">Select All Tasks</label>
            </div>
            <div className="checkbox-list">
              {tasks.map(task => (
                <div key={task.id} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id={`task-${task.id}`}
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => handleTaskChange(task.id)}
                  />
                  <label htmlFor={`task-${task.id}`}>{task.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="download-section">
            <h4>File Format</h4>
            <div className="radio-group">
              <div className="radio-item">
                <input 
                  type="radio" 
                  id="format-json" 
                  name="file-format"
                  value="json"
                  checked={fileFormat === 'json'}
                  onChange={() => setFileFormat('json')}
                />
                <label htmlFor="format-json">JSON</label>
              </div>
              <div className="radio-item">
                <input 
                  type="radio" 
                  id="format-csv" 
                  name="file-format"
                  value="csv"
                  checked={fileFormat === 'csv'}
                  onChange={() => setFileFormat('csv')}
                />
                <label htmlFor="format-csv">CSV</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="download-popup-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button 
            className="download-button"
            onClick={handleDownload}
            disabled={selectedTasks.length === 0 && selectedMonths.length === 0}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionsPanel; 