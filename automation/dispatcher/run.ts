import { createCursorClient, CursorApiError } from './cursor-api.js';
import { createGitHubClient } from './github-api.js';
import { buildAgentPrompt, idempotentAgentId } from './prompt.js';
import { findActiveIssues, selectNextIssue } from './select-next-issue.js';
import {
  findStateInComments,
  freshState,
  serializeState,
} from './state.js';
import type { DispatchState, DispatcherConfig, GhIssue } from './types.js';

const TERMINAL_OK = new Set(['FINISHED', 'COMPLETED', 'SUCCESS']);
const TERMINAL_FAIL = new Set(['FAILED', 'ERROR', 'CANCELLED', 'CANCELED']);

export type RunLog = (msg: string) => void;

export async function runDispatcher(
  config: DispatcherConfig,
  log: RunLog = console.log,
): Promise<{ ok: boolean; summary: string }> {
  const now = () => (config.now ? config.now() : new Date());
  const gh = createGitHubClient(config.repo, config.githubToken);

  if (!config.dispatchEnabled && !config.dryRun) {
    return {
      ok: true,
      summary: 'DISPATCH_ENABLED=false and not dry-run — idle',
    };
  }

  const issues = await gh.listOpenIssues();
  const closed = await gh.listClosedIssueNumbers();
  const pulls = await gh.listOpenPulls();
  const active = findActiveIssues(issues);

  // Reconcile any agent-running issues first
  for (const num of active) {
    const issue = issues.find((i) => i.number === num);
    if (!issue) continue;
    if (issue.labels.includes('agent-running')) {
      const result = await reconcileRunning(config, gh, issue, now, log);
      if (result === 'still_active') {
        return {
          ok: true,
          summary: `Waiting on active agent for #${num}`,
        };
      }
    }
    if (issue.labels.includes('agent-review')) {
      return {
        ok: true,
        summary: `Serial queue blocked: #${num} awaiting human PR review/merge`,
      };
    }
  }

  const pick = selectNextIssue({
    issues,
    openPulls: pulls,
    closedIssueNumbers: closed,
    activeIssueNumbers: findActiveIssues(await gh.listOpenIssues()),
  });

  if (pick.kind === 'none' || pick.kind === 'blocked') {
    const summary =
      pick.kind === 'none' ? pick.reason : `${pick.reason}`;
    log(summary);
    return { ok: true, summary };
  }

  const issue = pick.issue;
  log(`Selected #${issue.number}: ${issue.title}`);

  if (config.dryRun || !config.dispatchEnabled) {
    log(
      `[DRY_RUN] Would launch Cursor agent for #${issue.number} (DISPATCH_ENABLED=${config.dispatchEnabled})`,
    );
    return {
      ok: true,
      summary: `DRY_RUN selected #${issue.number}; no agent launched`,
    };
  }

  if (!config.cursorApiKey) {
    return { ok: false, summary: 'CURSOR_API_KEY missing for live launch' };
  }

  return launchLive(config, gh, issue, now, log);
}

async function reconcileRunning(
  config: DispatcherConfig,
  gh: ReturnType<typeof createGitHubClient>,
  issue: GhIssue,
  now: () => Date,
  log: RunLog,
): Promise<'still_active' | 'terminal'> {
  const comments = await gh.listIssueComments(issue.number);
  const found = findStateInComments(comments);
  if (!found?.state.agentId || !found.state.runId) {
    log(`#${issue.number}: agent-running without durable ids → reconcile_needed`);
    await persistState(gh, issue.number, found?.commentId ?? null, {
      ...(found?.state ?? freshState(issue.number, config.dryRun, now())),
      status: 'reconcile_needed',
      failureReason: 'Missing agentId/runId while agent-running',
      lastCheckedAt: now().toISOString(),
    });
    await gh.addLabels(issue.number, ['needs-human', 'agent-failed']);
    await gh.removeLabel(issue.number, 'agent-running');
    return 'terminal';
  }

  if (config.dryRun || !config.cursorApiKey) {
    log(`#${issue.number}: dry-run skip Cursor poll`);
    return 'still_active';
  }

  const cursor = createCursorClient(config.cursorApiKey);
  try {
    const run = await cursor.getRun(found.state.agentId, found.state.runId);
    const status = (run.status || '').toUpperCase();
    log(`#${issue.number}: Cursor run ${found.state.runId} status=${status}`);

    let prUrl =
      run.git?.branches?.map((b) => b.prUrl).find(Boolean) ?? found.state.prUrl;

    // Fallback: Cursor often finishes with a pushed branch but empty prUrl.
    if (!prUrl && TERMINAL_OK.has(status)) {
      const pulls = await gh.listOpenPulls();
      const linked = pulls.find((p) =>
        new RegExp(
          `\\b(?:closes?|fixes?|resolves?)\\s+#${issue.number}\\b|#${issue.number}\\b`,
          'i',
        ).test(`${p.title}\n${p.body ?? ''}`),
      );
      const byBranch = pulls.find(
        (p) =>
          !!p.headRef &&
          new RegExp(`(?:feat|fix|chore|cursor)/.*${issue.number}`, 'i').test(
            p.headRef,
          ),
      );
      prUrl = linked?.html_url ?? byBranch?.html_url ?? null;
      if (!prUrl) {
        const loose = pulls.find((p) => p.title.includes(`#${issue.number}`));
        prUrl = loose?.html_url ?? null;
      }
      if (!prUrl) {
        log(
          `#${issue.number}: no PR in Cursor payload — check remote branch feat/${issue.number}-* and open PR manually`,
        );
      }
    }

    if (TERMINAL_OK.has(status)) {
      const next: DispatchState = {
        ...found.state,
        status: 'awaiting_review',
        prUrl: prUrl ?? null,
        lastCheckedAt: now().toISOString(),
        failureReason: prUrl
          ? null
          : 'Run finished without PR URL — check cursor/* or feat/<n>-* branch on GitHub',
      };
      await persistState(gh, issue.number, found.commentId, next);
      await gh.removeLabel(issue.number, 'agent-running');
      await gh.removeLabel(issue.number, 'agent-ready');
      await gh.addLabels(issue.number, ['agent-review']);
      if (!prUrl) {
        await gh.addLabels(issue.number, ['needs-human']);
      }
      await gh.createIssueComment(
        issue.number,
        prUrl
          ? `Dispatcher: agent finished. PR: ${prUrl} — awaiting human merge.`
          : `Dispatcher: agent finished but no PR URL. Look for branch \`feat/${issue.number}-*\` / \`cursor/*\` and open a PR (Closes #${issue.number}).`,
      );
      return 'terminal';
    }

    if (TERMINAL_FAIL.has(status)) {
      const next: DispatchState = {
        ...found.state,
        status: 'failed',
        lastCheckedAt: now().toISOString(),
        failureReason: `Cursor run status ${status}`,
      };
      await persistState(gh, issue.number, found.commentId, next);
      await gh.removeLabel(issue.number, 'agent-running');
      await gh.addLabels(issue.number, ['agent-failed', 'needs-human']);
      await gh.createIssueComment(
        issue.number,
        `Dispatcher: agent run failed (${status}). No automatic retry.`,
      );
      return 'terminal';
    }

    await persistState(gh, issue.number, found.commentId, {
      ...found.state,
      status: 'running',
      prUrl: prUrl ?? found.state.prUrl,
      lastCheckedAt: now().toISOString(),
    });
    return 'still_active';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`#${issue.number}: poll error ${msg}`);
    if (err instanceof CursorApiError && err.status === 401) {
      await gh.addLabels(issue.number, ['needs-human']);
    }
    // Do not launch another agent
    return 'still_active';
  }
}

async function launchLive(
  config: DispatcherConfig,
  gh: ReturnType<typeof createGitHubClient>,
  issue: GhIssue,
  now: () => Date,
  log: RunLog,
): Promise<{ ok: boolean; summary: string }> {
  const comments = await gh.listIssueComments(issue.number);
  const existing = findStateInComments(comments);
  if (existing?.state.agentId && existing.state.status === 'running') {
    return {
      ok: true,
      summary: `#${issue.number} already has running agent — skip duplicate launch`,
    };
  }
  if (existing?.state.status === 'reconcile_needed') {
    return {
      ok: false,
      summary: `#${issue.number} reconcile_needed — human must clear before relaunch`,
    };
  }

  const launchedAt = now().toISOString();
  const agentId = idempotentAgentId(issue.number, launchedAt);
  const promptText = buildAgentPrompt(issue, config.repoUrl);
  const cursor = createCursorClient(config.cursorApiKey!);

  await gh.addLabels(issue.number, ['agent-running']);
  await gh.removeLabel(issue.number, 'agent-ready');

  let state = freshState(issue.number, false, now());
  state = {
    ...state,
    status: 'launching',
    agentId,
    launchedAt,
  };
  const commentId = await persistState(gh, issue.number, existing?.commentId ?? null, state);

  try {
    const created = await cursor.createAgent({
      promptText,
      repoUrl: config.repoUrl,
      startingRef: config.startingRef,
      agentId,
    });
    state = {
      ...state,
      status: 'running',
      agentId: created.agentId,
      runId: created.runId,
      lastCheckedAt: now().toISOString(),
    };
    await persistState(gh, issue.number, commentId, state);
    await gh.createIssueComment(
      issue.number,
      `Dispatcher: launched Cursor agent \`${created.agentId}\` run \`${created.runId}\`.`,
    );
    log(`Launched agent ${created.agentId}`);
    return { ok: true, summary: `Launched agent for #${issue.number}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Ambiguous launch: if we might have created, do not retry — reconcile
    const ambiguous =
      err instanceof CursorApiError &&
      (err.status === 409 || err.status >= 500 || err.message.includes('missing agent/run'));

    state = {
      ...state,
      status: ambiguous ? 'reconcile_needed' : 'failed',
      failureReason: msg.slice(0, 500),
      lastCheckedAt: now().toISOString(),
    };
    await persistState(gh, issue.number, commentId, state);
    await gh.removeLabel(issue.number, 'agent-running');
    await gh.addLabels(issue.number, [
      ambiguous ? 'needs-human' : 'agent-failed',
      'needs-human',
    ]);
    await gh.createIssueComment(
      issue.number,
      `Dispatcher: launch failed. ${ambiguous ? 'Reconcile required (do not auto-retry).' : ''} ${msg}`,
    );
    return { ok: false, summary: `Launch failed for #${issue.number}: ${msg}` };
  }
}

async function persistState(
  gh: ReturnType<typeof createGitHubClient>,
  issueNumber: number,
  commentId: number | null,
  state: DispatchState,
): Promise<number> {
  const body = [
    '### Momentum dispatcher state',
    '',
    '_Machine-readable. Do not edit manually._',
    '',
    serializeState(state),
  ].join('\n');
  if (commentId) {
    await gh.updateIssueComment(commentId, body);
    return commentId;
  }
  return gh.createIssueComment(issueNumber, body);
}
