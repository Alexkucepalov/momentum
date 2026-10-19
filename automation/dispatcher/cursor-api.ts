/**
 * Minimal Cursor Cloud Agents API v1 client.
 * Auth: Basic with API key as username (empty password), per Cursor docs.
 * @see https://cursor.com/docs/cloud-agent/api/endpoints
 */

export type CreateAgentResponse = {
  agent?: { id?: string };
  run?: { id?: string; status?: string };
  id?: string; // some shapes
};

export type RunStatusResponse = {
  id: string;
  agentId?: string;
  status: string;
  text?: string;
  git?: {
    branches?: Array<{ repoUrl?: string; branch?: string; prUrl?: string }>;
  };
};

export class CursorApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'CursorApiError';
  }
}

export type CursorClient = {
  createAgent: (input: {
    promptText: string;
    repoUrl: string;
    startingRef: string;
    agentId?: string;
  }) => Promise<{ agentId: string; runId: string; status: string }>;
  getRun: (agentId: string, runId: string) => Promise<RunStatusResponse>;
  getAgent: (agentId: string) => Promise<{ id: string; status: string; latestRunId?: string }>;
};

export function createCursorClient(apiKey: string, fetchImpl: typeof fetch = fetch): CursorClient {
  const auth = Buffer.from(`${apiKey}:`).toString('base64');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetchImpl(`https://api.cursor.com${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new CursorApiError(
        `Cursor API ${method} ${path} → ${res.status}`,
        res.status,
        text.slice(0, 2000),
        retryable,
      );
    }
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  return {
    async createAgent({ promptText, repoUrl, startingRef, agentId }) {
      const payload: Record<string, unknown> = {
        prompt: { text: promptText },
        repos: [{ url: repoUrl, startingRef }],
        workOnCurrentBranch: false,
        autoCreatePR: true,
        skipReviewerRequest: true,
      };
      if (agentId) payload.agentId = agentId;

      const data = await request<CreateAgentResponse>('POST', '/v1/agents', payload);
      const resolvedAgentId = data.agent?.id ?? data.id;
      const runId = data.run?.id;
      if (!resolvedAgentId || !runId) {
        throw new CursorApiError(
          'Cursor createAgent response missing agent/run id — reconcile before retry',
          502,
          JSON.stringify(data).slice(0, 2000),
          false,
        );
      }
      return {
        agentId: resolvedAgentId,
        runId,
        status: data.run?.status ?? 'CREATING',
      };
    },

    async getRun(agentId, runId) {
      return request<RunStatusResponse>('GET', `/v1/agents/${agentId}/runs/${runId}`);
    },

    async getAgent(agentId) {
      return request<{ id: string; status: string; latestRunId?: string }>(
        'GET',
        `/v1/agents/${agentId}`,
      );
    },
  };
}
