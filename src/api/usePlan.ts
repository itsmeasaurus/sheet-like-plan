import { useCallback, useEffect, useRef, useState } from 'react';
import type { CellRef, LegacyExport, PlanSnapshot, Stage, TaskStatus } from '../../shared/types.js';

export function usePlan() {
  const [snapshot, setSnapshot] = useState<PlanSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef(-1);

  // Every endpoint answers with the whole plan; ignore answers older than what we already show.
  // Resolves to whether the request succeeded; failures are reported through `error`.
  const request = useCallback(async (method: string, path = '', body?: unknown): Promise<boolean> => {
    try {
      const res = await fetch(`/api/plan${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      if (data.revision >= revisionRef.current) {
        revisionRef.current = data.revision;
        setSnapshot(data);
      }
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, []);

  // The server announces each new revision, including edits Claude makes through MCP
  useEffect(() => {
    void request('GET');
    const events = new EventSource('/api/events');
    events.onmessage = event => {
      if (JSON.parse(event.data).revision > revisionRef.current) void request('GET');
    };
    return () => events.close();
  }, [request]);

  return {
    snapshot,
    error,
    updatePlan: (patch: { title?: string; header?: string }) => request('PATCH', '', patch),
    addTask: (name: string) => request('POST', '/tasks', { name }),
    updateTask: (taskId: string, patch: { name?: string; status?: TaskStatus }) =>
      request('PATCH', `/tasks/${encodeURIComponent(taskId)}`, patch),
    deleteTask: (taskId: string) => request('DELETE', `/tasks/${encodeURIComponent(taskId)}`),
    setCells: (cells: CellRef[], stage: Stage | null) => request('PUT', '/cells', { cells, stage }),
    importLegacy: (data: LegacyExport) => request('POST', '/import', data),
  };
}
