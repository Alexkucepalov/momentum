import type { GhIssue, GhPull, SelectResult } from './types.js';

const ACCEPTANCE_RE =
  /(?:##\s*acceptance|acceptance\s*criteria|- \[[ xX]\])/i;

/** Parse Depends-on / blocked-by issue numbers from body. */
export function parseDependencies(body: string | null): number[] {
  if (!body) return [];
  const out = new Set<number>();
  const re =
    /(?:depends(?:\s*-?\s*on)?|blocked\s+by|requires|after)\s*:?\s*#(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

export function hasAcceptanceCriteria(body: string | null): boolean {
  if (!body || body.trim().length < 12) return false;
  return ACCEPTANCE_RE.test(body);
}

export function priorityRank(labels: string[]): number {
  if (labels.includes('p0')) return 0;
  if (labels.includes('p1')) return 1;
  return 2;
}

function openPrForIssue(issueNumber: number, pulls: GhPull[]): GhPull | null {
  const linkRe = new RegExp(
    `\\b(?:closes?|fixes?|resolves?)\\s+#${issueNumber}\\b|#${issueNumber}\\b`,
    'i',
  );
  for (const p of pulls) {
    if (p.state !== 'open') continue;
    const blob = `${p.title}\n${p.body ?? ''}`;
    if (linkRe.test(blob)) return p;
  }
  return null;
}

/**
 * Deterministic next-issue picker. Serial mode: any running/review/open agent PR blocks.
 */
export function selectNextIssue(opts: {
  issues: GhIssue[];
  openPulls: GhPull[];
  closedIssueNumbers: Set<number>;
  /** Issues currently agent-running or agent-review */
  activeIssueNumbers: number[];
}): SelectResult {
  const { issues, openPulls, closedIssueNumbers, activeIssueNumbers } = opts;

  if (activeIssueNumbers.length > 0) {
    return {
      kind: 'blocked',
      reason: `Serial queue: active issue(s) ${activeIssueNumbers.join(', ')}`,
      blockingIssue: activeIssueNumbers[0],
    };
  }

  // Any open PR that looks like an agent implementation also blocks serial queue
  const agentishOpen = openPulls.filter(
    (p) =>
      p.state === 'open' &&
      (/feat\/\d+-|fix\/\d+-|cursor\//i.test(p.title) ||
        /closes?\s+#\d+/i.test(`${p.title}\n${p.body ?? ''}`)),
  );
  // Only block if linked to an open agent-ready/agent-review issue — handled via active labels preferred.
  void agentishOpen;

  const candidates = issues
    .filter((i) => i.state === 'open')
    .filter((i) => i.labels.includes('agent-ready'))
    .filter((i) => !i.labels.includes('needs-human'))
    .filter((i) => !i.labels.includes('agent-running'))
    .filter((i) => !i.labels.includes('agent-review'))
    .filter((i) => !i.labels.includes('agent-failed'))
    .filter((i) => hasAcceptanceCriteria(i.body))
    .filter((i) => openPrForIssue(i.number, openPulls) == null)
    .filter((i) => {
      const deps = parseDependencies(i.body);
      return deps.every((d) => closedIssueNumbers.has(d));
    })
    .sort((a, b) => {
      const pr = priorityRank(a.labels) - priorityRank(b.labels);
      if (pr !== 0) return pr;
      return a.number - b.number;
    });

  if (candidates.length === 0) {
    return { kind: 'none', reason: 'No eligible agent-ready issues' };
  }

  return { kind: 'pick', issue: candidates[0]! };
}

export function findActiveIssues(issues: GhIssue[]): number[] {
  return issues
    .filter(
      (i) =>
        i.state === 'open' &&
        (i.labels.includes('agent-running') || i.labels.includes('agent-review')),
    )
    .map((i) => i.number)
    .sort((a, b) => a - b);
}
