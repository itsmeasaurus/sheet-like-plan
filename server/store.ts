import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { MONTH_NAMES, daysInMonth, parseIsoDate, toIsoDate } from '../shared/dates.js';
import type { Cell, CellRef, LegacyExport, Plan, PlanSnapshot, Stage, Task, TaskStatus } from '../shared/types.js';

export class NotFoundError extends Error {}
export class InvalidInputError extends Error {}

export type PlanStore = {
  defaultPlan(): Plan;
  getSnapshot(planId: string): PlanSnapshot;
  updatePlan(planId: string, patch: { title?: string; header?: string }): void;
  addTask(planId: string, input: { name: string; status?: TaskStatus }): Task;
  updateTask(planId: string, taskId: string, patch: { name?: string; status?: TaskStatus }): void;
  deleteTask(planId: string, taskId: string): void;
  setCells(planId: string, cells: CellRef[], stage: Stage | null): number;
  importLegacy(planId: string, data: LegacyExport): void;
  revision(): number;
  close(): void;
};

// Each entry upgrades the schema by one version; never edit an entry once released, append a new one
const MIGRATIONS: ((db: Database.Database) => void)[] = [
  db => {
    db.exec(`
      CREATE TABLE plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        header TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Not started', 'In progress', 'Completed', 'Failed')),
        position INTEGER NOT NULL
      );
      CREATE INDEX tasks_plan ON tasks(plan_id, position);
      CREATE TABLE cells (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        stage TEXT NOT NULL CHECK (stage IN ('planning', 'completed', 'failed')),
        PRIMARY KEY (task_id, date)
      ) WITHOUT ROWID;
      CREATE TABLE meta (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL);
      INSERT INTO meta (id, revision) VALUES (1, 0);
    `);
    db.prepare('INSERT INTO plans (id, title, header, year) VALUES (?, ?, ?, ?)')
      .run(randomUUID(), 'Task Timeline', 'Skills To Learn', new Date().getFullYear());
  },
];

function migrate(db: Database.Database): void {
  // IMMEDIATE takes the write lock up front, so the web server and an MCP process starting together can't both migrate
  db.transaction(() => {
    const version = db.pragma('user_version', { simple: true }) as number;
    for (let v = version; v < MIGRATIONS.length; v++) MIGRATIONS[v](db);
    db.pragma(`user_version = ${MIGRATIONS.length}`);
  }).immediate();
}

export function openStore(dbPath: string): PlanStore {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  migrate(db);

  // Every write goes through here, so the revision the UI watches for live updates can't be forgotten
  const write = <T>(fn: () => T): T =>
    db.transaction(() => {
      const result = fn();
      db.prepare('UPDATE meta SET revision = revision + 1').run();
      return result;
    }).immediate();

  const getPlan = (planId: string): Plan => {
    const plan = db.prepare('SELECT id, title, header, year FROM plans WHERE id = ?').get(planId) as Plan | undefined;
    if (!plan) throw new NotFoundError(`No plan with id ${planId}`);
    return plan;
  };

  const taskIdsOf = (planId: string): Set<string> =>
    new Set(db.prepare('SELECT id FROM tasks WHERE plan_id = ?').pluck().all(planId) as string[]);

  const requireTask = (planId: string, taskId: string): void => {
    if (!taskIdsOf(planId).has(taskId)) throw new NotFoundError(`No task with id ${taskId}`);
  };

  const insertTask = (planId: string, name: string, status: TaskStatus): Task => {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO tasks (id, plan_id, name, status, position)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE plan_id = ?))
    `).run(id, planId, name, status, planId);
    return { id, name, status };
  };

  const upsertCell = db.prepare(`
    INSERT INTO cells (task_id, date, stage) VALUES (?, ?, ?)
    ON CONFLICT (task_id, date) DO UPDATE SET stage = excluded.stage WHERE stage != excluded.stage
  `);
  const deleteCell = db.prepare('DELETE FROM cells WHERE task_id = ? AND date = ?');

  return {
    defaultPlan: () =>
      db.prepare('SELECT id, title, header, year FROM plans ORDER BY created_at, rowid LIMIT 1').get() as Plan,

    getSnapshot: planId =>
      db.transaction(() => ({
        plan: getPlan(planId),
        tasks: db.prepare('SELECT id, name, status FROM tasks WHERE plan_id = ? ORDER BY position').all(planId) as Task[],
        cells: db.prepare(`
          SELECT c.task_id AS taskId, c.date, c.stage FROM cells c
          JOIN tasks t ON t.id = c.task_id WHERE t.plan_id = ? ORDER BY c.task_id, c.date
        `).all(planId) as Cell[],
        revision: db.prepare('SELECT revision FROM meta').pluck().get() as number,
      }))(),

    updatePlan: (planId, patch) =>
      write(() => {
        const plan = getPlan(planId);
        db.prepare('UPDATE plans SET title = ?, header = ? WHERE id = ?')
          .run(patch.title ?? plan.title, patch.header ?? plan.header, planId);
      }),

    addTask: (planId, { name, status = 'Not started' }) =>
      write(() => {
        getPlan(planId);
        return insertTask(planId, name, status);
      }),

    updateTask: (planId, taskId, patch) =>
      write(() => {
        requireTask(planId, taskId);
        if (patch.name !== undefined) db.prepare('UPDATE tasks SET name = ? WHERE id = ?').run(patch.name, taskId);
        if (patch.status !== undefined) db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(patch.status, taskId);
      }),

    deleteTask: (planId, taskId) =>
      write(() => {
        requireTask(planId, taskId);
        db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
      }),

    setCells: (planId, cells, stage) =>
      write(() => {
        const plan = getPlan(planId);
        const taskIds = taskIdsOf(planId);
        let changed = 0;
        for (const { taskId, date } of cells) {
          if (!taskIds.has(taskId)) throw new NotFoundError(`No task with id ${taskId}`);
          if (parseIsoDate(date).year !== plan.year) {
            throw new InvalidInputError(`${date} is outside this plan's year (${plan.year})`);
          }
          changed += (stage === null ? deleteCell.run(taskId, date) : upsertCell.run(taskId, date, stage)).changes;
        }
        return changed;
      }),

    importLegacy: (planId, data) =>
      write(() => {
        const plan = getPlan(planId);
        if (data.title !== undefined || data.headerText !== undefined) {
          db.prepare('UPDATE plans SET title = ?, header = ? WHERE id = ?')
            .run(data.title ?? plan.title, data.headerText ?? plan.header, planId);
        }
        const newIds = new Map(data.tasks.map(task => [task.id, insertTask(planId, task.name, task.status).id]));
        for (const cell of data.cellData) {
          const taskId = newIds.get(cell.taskId);
          const monthIndex = MONTH_NAMES.indexOf(cell.month as (typeof MONTH_NAMES)[number]);
          // Old data has no year: skip cells of unknown tasks and days that don't exist in this plan's year
          if (!taskId || monthIndex === -1 || cell.day > daysInMonth(plan.year, monthIndex)) continue;
          upsertCell.run(taskId, toIsoDate(plan.year, monthIndex, cell.day), cell.stage);
        }
      }),

    revision: () => db.prepare('SELECT revision FROM meta').pluck().get() as number,

    close: () => db.close(),
  };
}
