# Sheet-Like Plan

A spreadsheet-inspired task planner that lets you visually map tasks across a full calendar year. Built for people who think in grids, not Gantt charts.

> Plan your year like you'd plan a spreadsheet — click cells, set stages, and see everything at a glance.

<!-- Add a screenshot or GIF here once available -->
<!-- ![Screenshot](./docs/screenshot.png) -->

## Why This Exists

Most task planners force you into rigid workflows — drag-and-drop timelines, nested subtask trees, or kanban columns that don't map well to "I need to see my whole year in one view."

Sheet-Like Plan takes a different approach: a **calendar grid where each cell is a day** and each row is a task. Click a cell to mark what happened that day — planning, completed, or failed. That's it. No ceremony, no overhead.

## Features

- **Full-year calendar grid** — All 12 months visible in a horizontally scrollable timeline
- **Cell stages** — Mark any day as `Planning`, `Completed`, or `Failed` with a single click
- **Multi-select** — Select ranges of cells with Shift+Click or cherry-pick with Ctrl/Cmd+Click
- **Quick Set** — Bulk-fill stages across selected months (all days, weekdays only, or weekends only)
- **Editable titles** — Click the plan title or header text to rename inline
- **Task status tracking** — Each task has an overall status: Not Started, In Progress, Completed, or Failed
- **Analytics dashboard** — Bar, pie, and line charts showing progress across tasks and months
- **Export** — Download your data as JSON or CSV, with optional month/task filtering
- **Persistent storage** — Everything saves to a SQLite database inside the Docker container
- **Claude Desktop integration** — Ask Claude to add tasks, mark days, or summarize your progress, and watch the grid update live
- **Today button** — Jump to today's column instantly

## Keyboard Shortcuts & Interactions

The UX is designed around keyboard-and-mouse fluency — the same patterns you already know from spreadsheet apps.

| Action | Shortcut |
|---|---|
| Select a cell | Click |
| Range select | Shift + Click |
| Multi-select (toggle) | Ctrl/Cmd + Click |
| Drag select | Click + Drag |
| Clear selection | Escape |
| Confirm inline edit | Enter |
| Add a task | Type name + Enter |

### Selection Model

Selection works exactly like Google Sheets or Excel:

- **Click** a cell to select it and open the stage picker
- **Shift+Click** to extend the selection from your last click to the new cell, filling the entire range
- **Ctrl/Cmd+Click** to toggle individual cells in and out of the selection without losing existing picks
- **Click+Drag** across cells to select a contiguous range
- **Escape** to clear everything and close any open dropdowns

This lets you rapidly mark up large blocks of time (e.g., shift-click to select an entire month, then set all cells to "Completed") or surgically pick individual days.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Custom CSS (grid-based layout) |
| Server | Node.js + Hono |
| Persistence | SQLite (better-sqlite3) on a Docker volume |
| Claude integration | MCP server over stdio (`@modelcontextprotocol/sdk`) |
| Charts | Canvas-based (built-in) |
| Linting | ESLint + TypeScript ESLint |

Everything runs locally in one Docker container on your computer. Nothing is sent anywhere.

## Getting Started

You need [Docker](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/itsmeasaurus/sheet-like-plan.git
cd sheet-like-plan
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The app is only reachable from your own computer.

Your data lives in a Docker volume, so it survives restarts and upgrades. Compose puts the folder name in front of the volume's name, so if you cloned into `sheet-like-plan` it shows up in `docker volume ls` as `sheet-like-plan_sheet-like-plan-data`. Running `docker compose down` keeps the volume; only `docker compose down -v` deletes your data.

To upgrade after pulling new code, run `docker compose up -d --build` again.

### Coming from the old browser-only version?

Open the app in the same browser you used before. If your plan is empty and that browser still has the old data, a banner offers to import it.

## Using with Claude Desktop

Sheet-Like Plan includes an [MCP](https://modelcontextprotocol.io) server, so Claude Desktop can read and edit your plan.

1. Make sure the container is running (`docker compose up -d`).
2. Find the full path to `docker` by running `which docker` in a terminal (for example `/usr/local/bin/docker`). Claude Desktop often can't find `docker` by name when it's opened from the Dock, so use the full path.
3. In Claude Desktop, open **Settings → Developer → Edit Config**. This opens `claude_desktop_config.json`.
4. Add the server, using your path from step 2, and save. If the file already has an `mcpServers` section, add the `"sheet-like-plan"` entry inside it instead of replacing the file.

   ```json
   {
     "mcpServers": {
       "sheet-like-plan": {
         "command": "/usr/local/bin/docker",
         "args": ["exec", "-i", "sheet-like-plan", "node", "dist-server/server/mcp.js"]
       }
     }
   }
   ```

5. Quit Claude Desktop completely and reopen it. The first time Claude uses a tool, it asks for your permission.

Then try: *"Add a task called Gym and mark every weekday in November as planning."* If the app is open in your browser, the grid updates within a second.

| Tool | What it does |
|---|---|
| `get_plan` | Shows the plan, every task with its id and status, and the marked days |
| `get_summary` | Planning / completed / failed counts per task and per month |
| `add_task` | Adds a task |
| `update_task` | Renames a task or changes its status |
| `delete_task` | Deletes a task and its marked days |
| `set_cells` | Marks a date range (all days, weekdays or weekends) as planning, completed or failed, or clears it |
| `update_plan` | Changes the plan title or the task column header |

**Troubleshooting**

- The server shows as failed, with an error like *"spawn docker ENOENT"* in the logs: Claude Desktop can't find `docker`. Check that `"command"` is the full path printed by `which docker`.
- *"No such container"*: the container isn't running. Start it with `docker compose up -d`, then restart Claude Desktop.
- `docker compose up` fails with *"port is already allocated"*: something else is using port 3000 (often an older container). Find it with `docker ps`, stop it, and run `docker compose up -d` again. Or change the left side of `"127.0.0.1:3000:3000"` in `docker-compose.yml` to another port, such as `"127.0.0.1:3001:3000"`, and open that port instead.
- Dates: a plan covers one calendar year, and Claude can only mark days inside that year.

## Local Development

Requires Node.js 22.14 or newer (the SQLite driver needs it).

```bash
npm install
npm run dev
```

This starts Vite at [http://localhost:5173](http://localhost:5173) and the API server at port 3000, which Vite proxies `/api` to. The development database is `data/plan.db`.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
shared/                     Code used by both the browser and the server
├── types.ts                Plan, Task, Cell types
├── dates.ts                Date math (weekends, ranges, leap years)
└── stats.ts                Progress statistics (Analysis panel and Claude)
server/
├── store.ts                SQLite schema and every read/write
├── schemas.ts              Input validation
├── http.ts                 Web server: the app, REST API, live updates
└── mcp.ts                  MCP server for Claude Desktop
src/
├── App.tsx                 Main app shell
├── App.css                 All application styles
├── api/
│   └── usePlan.ts          Loads the plan, saves changes, listens for live updates
└── components/
    ├── TaskTimeline.tsx    Core timeline grid + selection logic
    ├── AddTaskForm.tsx     New task input
    ├── ImportBanner.tsx    One-time import from the old browser-only version
    ├── ActionsPanel.tsx    Export and bulk actions
    └── AnalysisPanel.tsx   Charts and analytics dashboard
```

## UX Philosophy

**Familiar patterns over novel UI.** The grid, selection model, and keyboard shortcuts deliberately mirror spreadsheet conventions. If you've used Excel, you already know how to use this app.

**Minimal friction.** Adding a task is typing a name and pressing Enter. Marking a day is clicking a cell. There are no modals to configure, no forms to fill out.

**Visual density.** The calendar grid shows an entire year of data in a single scrollable view. Weekend columns are subtly highlighted, and color-coded stages make patterns immediately visible — you can spot gaps, streaks, and blockers at a glance.

**Data stays with you.** Everything lives in a SQLite file on your own computer. Export to JSON or CSV whenever you need to take your data elsewhere. No accounts, no cloud.

## License

ISC
