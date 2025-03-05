import React, { useState, useEffect } from 'react';
import { Task, CellStage, CellData } from './TaskTimeline';

// Define chart types
type ChartType = 'bar' | 'pie' | 'line';

interface AnalysisPanelProps {
  tasks: Task[];
  cellsData: CellData[];
  months: { name: string; days: number }[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ tasks, cellsData, months }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Calculate analysis data whenever tasks or cellsData changes
  useEffect(() => {
    generateAnalysisData();
  }, [tasks, cellsData, chartType]);

  const generateAnalysisData = () => {
    // Skip if no tasks
    if (tasks.length === 0) {
      setAnalysisData(null);
      return;
    }

    // Calculate statistics based on the data
    const taskStats = tasks.map(task => {
      const taskCells = cellsData.filter(cell => cell.taskId === task.id);
      const planningCells = taskCells.filter(cell => cell.stage === 'planning').length;
      const completedCells = taskCells.filter(cell => cell.stage === 'completed').length;
      const failedCells = taskCells.filter(cell => cell.stage === 'failed').length;
      const totalCells = planningCells + completedCells + failedCells;
      
      return {
        taskId: task.id,
        taskName: task.name,
        planningCells,
        completedCells,
        failedCells,
        totalCells,
        completionRate: totalCells > 0 ? (completedCells / totalCells) * 100 : 0,
        failureRate: totalCells > 0 ? (failedCells / totalCells) * 100 : 0
      };
    });

    // Calculate monthly statistics
    const monthlyStats = months.map(month => {
      const monthCells = cellsData.filter(cell => cell.month === month.name);
      const planningCells = monthCells.filter(cell => cell.stage === 'planning').length;
      const completedCells = monthCells.filter(cell => cell.stage === 'completed').length;
      const failedCells = monthCells.filter(cell => cell.stage === 'failed').length;
      
      return {
        month: month.name,
        planningCells,
        completedCells,
        failedCells,
        totalCells: planningCells + completedCells + failedCells
      };
    });

    setAnalysisData({ taskStats, monthlyStats });
  };

  // Render the appropriate chart based on chartType
  const renderChart = () => {
    if (!analysisData) {
      return <div className="no-data-message">No data available for analysis</div>;
    }

    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  // Render a bar chart showing task completion rates
  const renderBarChart = () => {
    const { taskStats } = analysisData;
    const maxValue = Math.max(...taskStats.map((stat: any) => stat.totalCells || 0), 1);

    return (
      <div className="chart bar-chart">
        <div className="chart-title">Task Progress</div>
        <div className="chart-container">
          {taskStats.map((stat: any) => (
            <div key={stat.taskId} className="chart-item">
              <div className="task-label">{stat.taskName}</div>
              <div className="bar-container">
                <div 
                  className="bar planning-bar" 
                  style={{ 
                    width: `${(stat.planningCells / maxValue) * 100}%`,
                    backgroundColor: '#3d7eb8'
                  }}
                  title={`Planning: ${stat.planningCells}`}
                ></div>
                <div 
                  className="bar completed-bar" 
                  style={{ 
                    width: `${(stat.completedCells / maxValue) * 100}%`,
                    backgroundColor: '#328a49'
                  }}
                  title={`Completed: ${stat.completedCells}`}
                ></div>
                <div 
                  className="bar failed-bar" 
                  style={{ 
                    width: `${(stat.failedCells / maxValue) * 100}%`,
                    backgroundColor: '#7b5750'
                  }}
                  title={`Failed: ${stat.failedCells}`}
                ></div>
              </div>
              <div className="stats-summary">
                <span className="completion-rate">{stat.completionRate.toFixed(1)}% completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a pie chart showing overall distribution
  const renderPieChart = () => {
    // Calculate totals across all tasks
    const totalPlanning = analysisData.taskStats.reduce((sum: number, stat: any) => sum + stat.planningCells, 0);
    const totalCompleted = analysisData.taskStats.reduce((sum: number, stat: any) => sum + stat.completedCells, 0);
    const totalFailed = analysisData.taskStats.reduce((sum: number, stat: any) => sum + stat.failedCells, 0);
    const total = totalPlanning + totalCompleted + totalFailed;

    // Calculate percentages and angles for the pie chart
    const planningPercentage = total > 0 ? (totalPlanning / total) * 100 : 0;
    const completedPercentage = total > 0 ? (totalCompleted / total) * 100 : 0;
    const failedPercentage = total > 0 ? (totalFailed / total) * 100 : 0;

    const planningAngle = (planningPercentage / 100) * 360;
    const completedAngle = (completedPercentage / 100) * 360;
    const failedAngle = (failedPercentage / 100) * 360;

    return (
      <div className="chart pie-chart">
        <div className="chart-title">Overall Progress Distribution</div>
        <div className="pie-container">
          <div className="pie" style={{
            background: `conic-gradient(
              #3d7eb8 0deg ${planningAngle}deg, 
              #328a49 ${planningAngle}deg ${planningAngle + completedAngle}deg, 
              #7b5750 ${planningAngle + completedAngle}deg 360deg
            )`
          }}></div>
          <div className="pie-legend">
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#3d7eb8' }}></div>
              <span>Planning: {planningPercentage.toFixed(1)}%</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#328a49' }}></div>
              <span>Completed: {completedPercentage.toFixed(1)}%</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#7b5750' }}></div>
              <span>Failed: {failedPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render a line chart showing monthly progress
  const renderLineChart = () => {
    const { monthlyStats } = analysisData;
    const maxValue = Math.max(...monthlyStats.map((stat: any) => stat.totalCells || 0), 1);

    return (
      <div className="chart line-chart">
        <div className="chart-title">Monthly Progress</div>
        <div className="line-chart-container">
          <div className="chart-y-axis">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="y-axis-label">
                {Math.round((maxValue / 4) * (4 - i))}
              </div>
            ))}
          </div>
          <div className="line-chart-content">
            {monthlyStats.map((stat: any, index: number) => (
              <div key={stat.month} className="month-column">
                <div className="data-points">
                  <div 
                    className="data-point planning-point" 
                    style={{ bottom: `${(stat.planningCells / maxValue) * 100}%` }}
                    title={`Planning: ${stat.planningCells}`}
                  ></div>
                  <div 
                    className="data-point completed-point" 
                    style={{ bottom: `${(stat.completedCells / maxValue) * 100}%` }}
                    title={`Completed: ${stat.completedCells}`}
                  ></div>
                  <div 
                    className="data-point failed-point" 
                    style={{ bottom: `${(stat.failedCells / maxValue) * 100}%` }}
                    title={`Failed: ${stat.failedCells}`}
                  ></div>
                </div>
                <div className="x-axis-label">{stat.month.substring(0, 3)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="line-chart-legend">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#3d7eb8' }}></div>
            <span>Planning</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#328a49' }}></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#7b5750' }}></div>
            <span>Failed</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-panel">
      <h3 className="analysis-title">Analysis</h3>
      <div className="chart-controls">
        <button 
          className={`chart-type-button ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </button>
        <button 
          className={`chart-type-button ${chartType === 'pie' ? 'active' : ''}`}
          onClick={() => setChartType('pie')}
        >
          Pie Chart
        </button>
        <button 
          className={`chart-type-button ${chartType === 'line' ? 'active' : ''}`}
          onClick={() => setChartType('line')}
        >
          Line Chart
        </button>
      </div>
      <div className="chart-area">
        {renderChart()}
      </div>
    </div>
  );
};

export default AnalysisPanel; 