/** Durable dispatcher state (persisted on the GitHub issue). */
export type DispatchStatus =
  | 'selected'
  | 'launching'
  | 'running'
  | 'awaiting_review'
  | 'failed'
  | 'done'
  | 'reconcile_needed';

export type DispatchState = {
  version: 1;
  issueNumber: number;
  status: DispatchStatus;
  agentId: string | null;
  runId: string | null;
  prUrl: string | null;
  launchedAt: string | null;
  lastCheckedAt: string;
  failureReason: string | null;
  dryRun: boolean;
};

export type GhIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  html_url: string;
};

export type GhPull = {
  number: number;
  html_url: string;
  state: string;
  draft: boolean;
  merged_at: string | null;
  body: string | null;
  title: string;
};

export type DispatcherConfig = {
  repo: string; // owner/name
  repoUrl: string;
  githubToken: string;
  cursorApiKey: string | null;
  dryRun: boolean;
  dispatchEnabled: boolean;
  startingRef: string;
  now?: () => Date;
};

export type SelectResult =
  | { kind: 'none'; reason: string }
  | { kind: 'blocked'; reason: string; blockingIssue?: number }
  | { kind: 'pick'; issue: GhIssue };
