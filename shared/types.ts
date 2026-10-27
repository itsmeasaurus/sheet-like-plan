export type IsoDate = string; // 'YYYY-MM-DD'
export type Stage = 'planning' | 'completed' | 'failed';
export type TaskStatus = 'Not started' | 'In progress' | 'Completed' | 'Failed';
export type DayFilter = 'all' | 'weekdays' | 'weekends';

export const STAGES: readonly Stage[] = ['planning', 'completed', 'failed'];
export const TASK_STATUSES: readonly TaskStatus[] = ['Not started', 'In progress', 'Completed', 'Failed'];

export type Plan = { id: string; title: string; header: string; year: number };
export type Task = { id: string; name: string; status: TaskStatus };
export type Cell = { taskId: string; date: IsoDate; stage: Stage };
export type CellRef = { taskId: string; date: IsoDate };
export type PlanSnapshot = { plan: Plan; tasks: Task[]; cells: Cell[]; revision: number };

// The shape the "Download Data → JSON" button produces, plus the title/header the old version kept in localStorage
export type LegacyExport = {
  tasks: { id: string; name: string; status: TaskStatus }[];
  cellData: { taskId: string; month: string; day: number; stage: Stage }[];
  title?: string;
  headerText?: string;
};
