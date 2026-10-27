import { MONTH_NAMES, parseIsoDate } from './dates.js';
import type { Cell, PlanSnapshot, Stage } from './types.js';

type StageCounts = { planningCells: number; completedCells: number; failedCells: number; totalCells: number };

export type TaskStat = StageCounts & {
  taskId: string;
  taskName: string;
  completionRate: number;
  failureRate: number;
};

export type MonthStat = StageCounts & { month: string };

export type PlanStats = { taskStats: TaskStat[]; monthlyStats: MonthStat[] };

function countStages(cells: Cell[]): StageCounts {
  const count = (stage: Stage) => cells.filter(cell => cell.stage === stage).length;
  const planningCells = count('planning');
  const completedCells = count('completed');
  const failedCells = count('failed');
  return { planningCells, completedCells, failedCells, totalCells: planningCells + completedCells + failedCells };
}

export function computeStats({ tasks, cells }: PlanSnapshot): PlanStats {
  const taskStats = tasks.map(task => {
    const counts = countStages(cells.filter(cell => cell.taskId === task.id));
    return {
      taskId: task.id,
      taskName: task.name,
      ...counts,
      completionRate: counts.totalCells > 0 ? (counts.completedCells / counts.totalCells) * 100 : 0,
      failureRate: counts.totalCells > 0 ? (counts.failedCells / counts.totalCells) * 100 : 0,
    };
  });

  const monthlyStats = MONTH_NAMES.map((month, monthIndex) => ({
    month,
    ...countStages(cells.filter(cell => parseIsoDate(cell.date).monthIndex === monthIndex)),
  }));

  return { taskStats, monthlyStats };
}
