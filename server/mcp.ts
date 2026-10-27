// Started by Claude Desktop as: docker exec -i sheet-like-plan node dist-server/server/mcp.js
// stdout carries the MCP protocol, so anything else must be logged to stderr.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { daysBetween, expandRange } from '../shared/dates.js';
import { computeStats } from '../shared/stats.js';
import type { Cell, PlanSnapshot } from '../shared/types.js';
import { dayFilter, isoDate, planText, stage, taskName, taskStatus } from './schemas.js';
import { InvalidInputError, NotFoundError, openStore, type PlanStore } from './store.js';

// Turns a task's cells into lines like "2026-03-02 to 2026-03-06: completed" to keep tool output short
function describeCells(cells: Cell[]): string[] {
  const lines: string[] = [];
  let start = cells[0];
  for (let i = 1; i <= cells.length; i++) {
    const prev = cells[i - 1];
    const cell = cells[i];
    if (cell && cell.stage === prev.stage && daysBetween(prev.date, cell.date) === 1) continue;
    lines.push(`${start.date === prev.date ? start.date : `${start.date} to ${prev.date}`}: ${prev.stage}`);
    start = cell;
  }
  return lines;
}

function describePlan({ plan, tasks, cells }: PlanSnapshot): string {
  const lines = [`Plan "${plan.title}" for ${plan.year} (task column header: "${plan.header}")`];
  if (tasks.length === 0) lines.push('No tasks yet.');
  for (const task of tasks) {
    lines.push('', `Task "${task.name}" (id: ${task.id}) - status: ${task.status}`);
    const taskCells = cells.filter(cell => cell.taskId === task.id);
    lines.push(...(taskCells.length ? describeCells(taskCells).map(line => `  ${line}`) : ['  no days marked']));
  }
  return lines.join('\n');
}

function describeStats(snapshot: PlanSnapshot): string {
  const { taskStats, monthlyStats } = computeStats(snapshot);
  const counts = (s: { planningCells: number; completedCells: number; failedCells: number }) =>
    `${s.planningCells} planning, ${s.completedCells} completed, ${s.failedCells} failed`;
  return [
    'By task:',
    ...taskStats.map(s => `  ${s.taskName}: ${counts(s)} (${s.completionRate.toFixed(1)}% completed)`),
    'By month:',
    ...monthlyStats.filter(s => s.totalCells > 0).map(s => `  ${s.month}: ${counts(s)}`),
  ].join('\n');
}

function registerTools(server: McpServer, store: PlanStore): void {
  const planId = () => store.defaultPlan().id;
  const taskNameOf = (taskId: string) =>
    store.getSnapshot(planId()).tasks.find(task => task.id === taskId)?.name ?? taskId;

  // Mistakes the model can fix (unknown id, date outside the plan's year) come back as tool errors, not crashes
  const run = (fn: () => string): CallToolResult => {
    try {
      return { content: [{ type: 'text', text: fn() }] };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof InvalidInputError) {
        return { isError: true, content: [{ type: 'text', text: err.message }] };
      }
      throw err;
    }
  };

  server.registerTool('get_plan', {
    title: 'Get plan',
    description: 'Show the plan: its title and year, every task with its id and status, and which days are marked planning, completed or failed. Call this first to learn task ids.',
    annotations: { readOnlyHint: true },
  }, () => run(() => describePlan(store.getSnapshot(planId()))));

  server.registerTool('get_summary', {
    title: 'Get progress summary',
    description: 'Count planning, completed and failed days per task and per month, with each task\'s completion rate. Same numbers as the Analysis panel in the app.',
    annotations: { readOnlyHint: true },
  }, () => run(() => describeStats(store.getSnapshot(planId()))));

  server.registerTool('update_plan', {
    title: 'Rename plan',
    description: 'Change the plan title and/or the header shown above the task column.',
    inputSchema: { title: planText.optional(), header: planText.optional() },
    annotations: { destructiveHint: false, idempotentHint: true },
  }, patch => run(() => {
    store.updatePlan(planId(), patch);
    return 'Plan updated.';
  }));

  server.registerTool('add_task', {
    title: 'Add task',
    description: 'Add a task (a row in the plan). Returns the new task id.',
    inputSchema: { name: taskName, status: taskStatus.optional() },
    annotations: { destructiveHint: false },
  }, input => run(() => {
    const task = store.addTask(planId(), input);
    return `Added task "${task.name}" (id: ${task.id}) with status ${task.status}.`;
  }));

  server.registerTool('update_task', {
    title: 'Update task',
    description: 'Rename a task and/or change its overall status.',
    inputSchema: { task_id: z.string(), name: taskName.optional(), status: taskStatus.optional() },
    annotations: { destructiveHint: false, idempotentHint: true },
  }, ({ task_id, ...patch }) => run(() => {
    store.updateTask(planId(), task_id, patch);
    return `Updated task "${taskNameOf(task_id)}".`;
  }));

  server.registerTool('delete_task', {
    title: 'Delete task',
    description: 'Permanently delete a task and all of its marked days.',
    inputSchema: { task_id: z.string() },
    annotations: { destructiveHint: true },
  }, ({ task_id }) => run(() => {
    const name = taskNameOf(task_id);
    store.deleteTask(planId(), task_id);
    return `Deleted task "${name}".`;
  }));

  server.registerTool('set_cells', {
    title: 'Mark days',
    description: 'Mark every day from `from` to `to` (inclusive, YYYY-MM-DD, within the plan\'s year) for one task as planning, completed or failed, or "clear" to unmark them. Use `days` to limit it to weekdays or weekends.',
    inputSchema: {
      task_id: z.string(),
      from: isoDate,
      to: isoDate,
      stage: z.union([stage, z.literal('clear')]),
      days: dayFilter.default('all'),
    },
    annotations: { idempotentHint: true },
  }, ({ task_id, from, to, stage, days }) => run(() => {
    const dates = expandRange(from, to, days);
    const kind = { all: 'days', weekdays: 'weekdays', weekends: 'weekend days' }[days];
    if (dates.length === 0) throw new InvalidInputError(`There are no ${kind} between ${from} and ${to}.`);
    const changed = store.setCells(planId(), dates.map(date => ({ taskId: task_id, date })), stage === 'clear' ? null : stage);
    const action = stage === 'clear' ? 'Cleared' : `Marked as ${stage}`;
    const unchanged = dates.length - changed;
    return `${action}: ${changed} ${changed === 1 ? kind.slice(0, -1) : kind} for "${taskNameOf(task_id)}"${unchanged ? ` (${unchanged} already were)` : ''}.`;
  }));
}

const store = openStore(process.env.DB_PATH ?? 'data/plan.db');
const server = new McpServer({ name: 'sheet-like-plan', version: '1.0.0' });
registerTools(server, store);
await server.connect(new StdioServerTransport());
