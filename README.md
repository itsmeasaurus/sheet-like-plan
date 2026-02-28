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
- **Persistent storage** — Everything saves to localStorage automatically
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
| Persistence | localStorage |
| Charts | Canvas-based (built-in) |
| Linting | ESLint + TypeScript ESLint |

Zero backend dependencies. Everything runs client-side in your browser.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/itsmeasaurus/sheet-like-plan.git
cd sheet-like-plan

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.tsx                 Main app shell
├── App.css                 All application styles
├── components/
│   ├── TaskTimeline.tsx    Core timeline grid + selection logic
│   ├── TaskRow.tsx         Individual task row rendering
│   ├── TimelineHeader.tsx  Month/day column headers
│   ├── AddTaskForm.tsx     New task input
│   ├── ActionsPanel.tsx    Export and bulk actions
│   └── AnalysisPanel.tsx   Charts and analytics dashboard
```

## UX Philosophy

**Familiar patterns over novel UI.** The grid, selection model, and keyboard shortcuts deliberately mirror spreadsheet conventions. If you've used Excel, you already know how to use this app.

**Minimal friction.** Adding a task is typing a name and pressing Enter. Marking a day is clicking a cell. There are no modals to configure, no forms to fill out.

**Visual density.** The calendar grid shows an entire year of data in a single scrollable view. Weekend columns are subtly highlighted, and color-coded stages make patterns immediately visible — you can spot gaps, streaks, and blockers at a glance.

**Data stays with you.** Everything persists in localStorage. Export to JSON or CSV whenever you need to take your data elsewhere. No accounts, no servers.

## License

ISC
