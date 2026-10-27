import { z } from 'zod';
import { MONTH_NAMES, isValidIsoDate } from '../shared/dates.js';
import { STAGES, TASK_STATUSES } from '../shared/types.js';

export const stage = z.enum(STAGES);
export const taskStatus = z.enum(TASK_STATUSES);
export const dayFilter = z.enum(['all', 'weekdays', 'weekends']);
export const isoDate = z.string().refine(isValidIsoDate, 'Expected a real date in YYYY-MM-DD form');
export const taskName = z.string().trim().min(1).max(200);
export const planText = z.string().trim().min(1).max(200);

export const updatePlanBody = z.object({ title: planText.optional(), header: planText.optional() });
export const addTaskBody = z.object({ name: taskName, status: taskStatus.optional() });
export const updateTaskBody = z.object({ name: taskName.optional(), status: taskStatus.optional() });

export const setCellsBody = z.object({
  cells: z.array(z.object({ taskId: z.string(), date: isoDate })).max(10_000),
  stage: stage.nullable(),
});

export const legacyExport = z.object({
  tasks: z.array(z.object({ id: z.string(), name: taskName, status: taskStatus })),
  cellData: z.array(z.object({
    taskId: z.string(),
    month: z.enum(MONTH_NAMES),
    day: z.number().int().min(1).max(31),
    stage,
  })),
  title: planText.optional(),
  headerText: planText.optional(),
});
