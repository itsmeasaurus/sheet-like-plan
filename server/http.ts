import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ZodError } from 'zod';
import { addTaskBody, legacyExport, setCellsBody, updatePlanBody, updateTaskBody } from './schemas.js';
import { InvalidInputError, NotFoundError, openStore, type PlanStore } from './store.js';

// No login exists, so refuse requests addressed to any other hostname (blocks DNS-rebinding attacks from web pages)
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function createApp(store: PlanStore, staticDir: string): Hono {
  const app = new Hono();
  const planId = () => store.defaultPlan().id;
  const snapshot = () => store.getSnapshot(planId());

  app.use('*', async (c, next) => {
    const host = c.req.header('host')?.replace(/:\d+$/, '') ?? '';
    if (!ALLOWED_HOSTS.has(host)) return c.text('Forbidden host', 403);
    await next();
  });

  app.onError((err, c) => {
    if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
    if (err instanceof InvalidInputError || err instanceof SyntaxError) return c.json({ error: err.message }, 400);
    if (err instanceof ZodError) return c.json({ error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, 400);
    console.error(err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  app.get('/api/plan', c => c.json(snapshot()));

  app.patch('/api/plan', async c => {
    store.updatePlan(planId(), updatePlanBody.parse(await c.req.json()));
    return c.json(snapshot());
  });

  app.post('/api/plan/tasks', async c => {
    store.addTask(planId(), addTaskBody.parse(await c.req.json()));
    return c.json(snapshot());
  });

  app.patch('/api/plan/tasks/:taskId', async c => {
    store.updateTask(planId(), c.req.param('taskId'), updateTaskBody.parse(await c.req.json()));
    return c.json(snapshot());
  });

  app.delete('/api/plan/tasks/:taskId', c => {
    store.deleteTask(planId(), c.req.param('taskId'));
    return c.json(snapshot());
  });

  app.put('/api/plan/cells', async c => {
    const { cells, stage } = setCellsBody.parse(await c.req.json());
    store.setCells(planId(), cells, stage);
    return c.json(snapshot());
  });

  app.post('/api/plan/import', async c => {
    store.importLegacy(planId(), legacyExport.parse(await c.req.json()));
    return c.json(snapshot());
  });

  // Claude's edits arrive from a separate MCP process, so watch the shared revision counter instead of in-memory events
  app.get('/api/events', c =>
    streamSSE(c, async stream => {
      let sent = -1;
      while (!stream.aborted) {
        const revision = store.revision();
        if (revision !== sent) {
          await stream.writeSSE({ data: JSON.stringify({ revision }) });
          sent = revision;
        }
        await stream.sleep(1000);
      }
    }),
  );

  app.use('/*', serveStatic({ root: staticDir }));
  app.get('*', serveStatic({ root: staticDir, path: 'index.html' }));

  return app;
}

const store = openStore(process.env.DB_PATH ?? 'data/plan.db');
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? '127.0.0.1';

serve({ fetch: createApp(store, process.env.STATIC_DIR ?? 'dist').fetch, port, hostname }, () => {
  console.log(`Sheet-Like Plan running at http://localhost:${port}`);
});
