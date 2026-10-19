import type { DispatchState } from './types.js';

export const STATE_MARKER_START = '<!-- momentum-dispatcher-state:v1';
export const STATE_MARKER_END = '-->';

export function serializeState(state: DispatchState): string {
  const json = JSON.stringify(state);
  return `${STATE_MARKER_START}\n${json}\n${STATE_MARKER_END}`;
}

export function parseStateFromComment(body: string): DispatchState | null {
  const start = body.indexOf(STATE_MARKER_START);
  if (start < 0) return null;
  const after = start + STATE_MARKER_START.length;
  const end = body.indexOf(STATE_MARKER_END, after);
  if (end < 0) return null;
  const raw = body.slice(after, end).trim();
  try {
    const parsed = JSON.parse(raw) as DispatchState;
    if (parsed?.version !== 1 || typeof parsed.issueNumber !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function findStateInComments(
  comments: Array<{ id: number; body: string }>,
): { commentId: number; state: DispatchState } | null {
  for (const c of comments) {
    const state = parseStateFromComment(c.body);
    if (state) return { commentId: c.id, state };
  }
  return null;
}

export function freshState(
  issueNumber: number,
  dryRun: boolean,
  now: Date,
): DispatchState {
  return {
    version: 1,
    issueNumber,
    status: 'selected',
    agentId: null,
    runId: null,
    prUrl: null,
    launchedAt: null,
    lastCheckedAt: now.toISOString(),
    failureReason: null,
    dryRun,
  };
}
