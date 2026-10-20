import type { GhIssue, GhPull } from './types.js';

export type GhComment = { id: number; body: string };

export type GitHubClient = {
  listOpenIssues: () => Promise<GhIssue[]>;
  listClosedIssueNumbers: () => Promise<Set<number>>;
  listOpenPulls: () => Promise<GhPull[]>;
  listIssueComments: (issueNumber: number) => Promise<GhComment[]>;
  createIssueComment: (issueNumber: number, body: string) => Promise<number>;
  updateIssueComment: (commentId: number, body: string) => Promise<void>;
  addLabels: (issueNumber: number, labels: string[]) => Promise<void>;
  removeLabel: (issueNumber: number, label: string) => Promise<void>;
};

function mapIssue(raw: {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  labels: Array<string | { name: string }>;
}): GhIssue {
  return {
    number: raw.number,
    title: raw.title,
    body: raw.body,
    state: raw.state,
    html_url: raw.html_url,
    labels: raw.labels.map((l) => (typeof l === 'string' ? l : l.name)),
  };
}

export function createGitHubClient(
  repo: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): GitHubClient {
  const base = `https://api.github.com/repos/${repo}`;

  async function gh<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    async listOpenIssues() {
      const rows = await gh<
        Array<{
          number: number;
          title: string;
          body: string | null;
          state: string;
          html_url: string;
          labels: Array<string | { name: string }>;
          pull_request?: unknown;
        }>
      >('GET', '/issues?state=open&per_page=100');
      return rows.filter((r) => !r.pull_request).map(mapIssue);
    },

    async listClosedIssueNumbers() {
      const rows = await gh<Array<{ number: number; pull_request?: unknown }>>(
        'GET',
        '/issues?state=closed&per_page=100',
      );
      return new Set(rows.filter((r) => !r.pull_request).map((r) => r.number));
    },

    async listOpenPulls() {
      const rows = await gh<
        Array<{
          number: number;
          html_url: string;
          state: string;
          draft: boolean;
          merged_at: string | null;
          body: string | null;
          title: string;
          head?: { ref?: string };
        }>
      >('GET', '/pulls?state=open&per_page=100');
      return rows.map((p) => ({
        number: p.number,
        html_url: p.html_url,
        state: p.state,
        draft: p.draft,
        merged_at: p.merged_at,
        body: p.body,
        title: p.title,
        headRef: p.head?.ref ?? null,
      }));
    },

    async listIssueComments(issueNumber) {
      const rows = await gh<Array<{ id: number; body: string }>>(
        'GET',
        `/issues/${issueNumber}/comments?per_page=100`,
      );
      return rows;
    },

    async createIssueComment(issueNumber, body) {
      const row = await gh<{ id: number }>('POST', `/issues/${issueNumber}/comments`, { body });
      return row.id;
    },

    async updateIssueComment(commentId, body) {
      await gh('PATCH', `/issues/comments/${commentId}`, { body });
    },

    async addLabels(issueNumber, labels) {
      await gh('POST', `/issues/${issueNumber}/labels`, { labels });
    },

    async removeLabel(issueNumber, label) {
      try {
        await gh('DELETE', `/issues/${issueNumber}/labels/${encodeURIComponent(label)}`);
      } catch {
        // label may already be absent
      }
    },
  };
}
