import { chunkInclusiveDateRange } from '../../../../../src/domain/garmin';
import { GARMIN_BASE_URL, GARMIN_USER_AGENT } from './garminAuth';

export class GarminClientError extends Error {
  statusCode: number | null;
  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = 'GarminClientError';
    this.statusCode = statusCode;
  }
}

function summarizeBody(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 100) || '(пусто)';
}

async function garminGet(
  accessToken: string,
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<unknown> {
  const url = new URL(`${GARMIN_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': GARMIN_USER_AGENT,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new GarminClientError(
      res.status === 401
        ? 'Сессия Garmin истекла — повтори синхронизацию'
        : `${path} → HTTP ${res.status}: ${summarizeBody(text)}`,
      res.status,
    );
  }
  if (!text.trim() || text.trim() === 'null') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new GarminClientError(`${path}: не-JSON ответ`);
  }
}

export type ChunkedFetchResult = {
  payloads: unknown[];
  warnings: string[];
};

async function settleChunk(
  label: string,
  fn: () => Promise<unknown>,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `${label}: ${msg}` };
  }
}

/** Garmin steps/stress stats reject ranges longer than ~28 days. Soft-fail per chunk. */
export async function fetchDailyStepsChunked(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<ChunkedFetchResult> {
  const chunks = chunkInclusiveDateRange(startDate, endDate, 28);
  const payloads: unknown[] = [];
  const warnings: string[] = [];
  for (const c of chunks) {
    const settled = await settleChunk(`Шаги ${c.startDate}…${c.endDate}`, () =>
      garminGet(
        accessToken,
        `/usersummary-service/stats/steps/daily/${c.startDate}/${c.endDate}`,
      ),
    );
    if (!settled.ok) {
      warnings.push(settled.error);
      continue;
    }
    const payload = settled.value;
    if (Array.isArray(payload)) payloads.push(...payload);
    else if (payload != null) payloads.push(payload);
  }
  if (payloads.length === 0 && warnings.length > 0) {
    throw new GarminClientError(warnings[0]!, 400);
  }
  return { payloads, warnings };
}

export async function fetchWeightRangeChunked(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<ChunkedFetchResult> {
  const chunks = chunkInclusiveDateRange(startDate, endDate, 90);
  const payloads: unknown[] = [];
  const warnings: string[] = [];
  for (const c of chunks) {
    const settled = await settleChunk(`Вес ${c.startDate}…${c.endDate}`, () =>
      garminGet(accessToken, `/weight-service/weight/range/${c.startDate}/${c.endDate}`, {
        includeAll: true,
      }),
    );
    if (!settled.ok) {
      warnings.push(settled.error);
      continue;
    }
    if (settled.value != null) payloads.push(settled.value);
  }
  if (payloads.length === 0 && warnings.length > 0) {
    throw new GarminClientError(warnings[0]!, 400);
  }
  return { payloads, warnings };
}

/** Fallback for steps when stats endpoint is empty/unavailable. Soft-fail per chunk. */
/** Sleep summaries — soft-fail per chunk (same 28d window as steps). */
export async function fetchDailySleepSummariesChunked(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<ChunkedFetchResult> {
  const chunks = chunkInclusiveDateRange(startDate, endDate, 28);
  const payloads: unknown[] = [];
  const warnings: string[] = [];
  for (const c of chunks) {
    const settled = await settleChunk(`Сон ${c.startDate}…${c.endDate}`, () =>
      garminGet(accessToken, '/sleep-service/sleep/dailySleepSummariesByDate', {
        startDate: c.startDate,
        endDate: c.endDate,
      }),
    );
    if (!settled.ok) {
      warnings.push(settled.error);
      continue;
    }
    if (settled.value != null) payloads.push(settled.value);
  }
  if (payloads.length === 0 && warnings.length > 0) {
    throw new GarminClientError(warnings[0]!, 400);
  }
  return { payloads, warnings };
}

export async function fetchDailySummariesChunked(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<ChunkedFetchResult> {
  const chunks = chunkInclusiveDateRange(startDate, endDate, 28);
  const payloads: unknown[] = [];
  const warnings: string[] = [];
  for (const c of chunks) {
    const settled = await settleChunk(`Daily ${c.startDate}…${c.endDate}`, () =>
      garminGet(accessToken, '/usersummary-service/v2/dailysummaries', {
        startDate: c.startDate,
        endDate: c.endDate,
      }),
    );
    if (!settled.ok) {
      warnings.push(settled.error);
      continue;
    }
    if (settled.value != null) payloads.push(settled.value);
  }
  if (payloads.length === 0 && warnings.length > 0) {
    throw new GarminClientError(warnings[0]!, 400);
  }
  return { payloads, warnings };
}

export async function fetchActivitiesPage(
  accessToken: string,
  args: {
    start: number;
    limit: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<unknown> {
  const params: Record<string, string | number> = {
    start: args.start,
    limit: args.limit,
  };
  if (args.startDate) params.startDate = args.startDate;
  if (args.endDate) params.endDate = args.endDate;
  return garminGet(accessToken, '/activitylist-service/activities/search/activities', params);
}

/**
 * Paginate activities. Prefer unbounded search for full history (no date filter),
 * then fall back to dated window if needed by caller.
 */
export async function fetchAllActivities(
  accessToken: string,
  opts?: {
    startDate?: string;
    endDate?: string;
    pageSize?: number;
    maxPages?: number;
  },
): Promise<unknown[]> {
  const pageSize = opts?.pageSize ?? 100;
  const maxPages = opts?.maxPages ?? 100;
  const all: unknown[] = [];
  for (let page = 0; page < maxPages; page++) {
    const payload = await fetchActivitiesPage(accessToken, {
      start: page * pageSize,
      limit: pageSize,
      startDate: opts?.startDate,
      endDate: opts?.endDate,
    });
    const chunk = Array.isArray(payload) ? payload : [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

/** Summary DTO (metrics without chart/polyline). */
export function fetchActivitySummary(accessToken: string, activityId: string): Promise<unknown> {
  return garminGet(accessToken, `/activity-service/activity/${activityId}`);
}

/** Details include chart samples + geoPolylineDTO. */
export function fetchActivityDetails(
  accessToken: string,
  activityId: string,
): Promise<unknown> {
  return garminGet(accessToken, `/activity-service/activity/${activityId}/details`, {
    maxChartSize: 2000,
    maxPolylineSize: 4000,
  });
}

export function fetchActivityMapDetails(
  accessToken: string,
  activityId: string,
): Promise<unknown> {
  return garminGet(accessToken, `/activity-service/activity/${activityId}/mapdetails`, {
    maxPolylineSize: 4000,
  });
}

/**
 * Prefer /details (charts + polyline). Fall back to summary + mapdetails.
 */
export async function fetchActivityDetailBundle(
  accessToken: string,
  activityId: string,
): Promise<unknown> {
  try {
    return await fetchActivityDetails(accessToken, activityId);
  } catch {
    const summary = await fetchActivitySummary(accessToken, activityId);
    try {
      const map = await fetchActivityMapDetails(accessToken, activityId);
      if (summary && typeof summary === 'object' && map && typeof map === 'object') {
        return { ...(summary as object), ...(map as object) };
      }
      return map ?? summary;
    } catch {
      return summary;
    }
  }
}

/** Small concurrency pool for detail enrichment. */
export async function fetchActivityDetailsBatched(
  accessToken: string,
  activityIds: string[],
  concurrency = 3,
): Promise<Map<string, unknown>> {
  const out = new Map<string, unknown>();
  let i = 0;
  async function worker() {
    while (i < activityIds.length) {
      const idx = i++;
      const id = activityIds[idx]!;
      try {
        out.set(id, await fetchActivityDetailBundle(accessToken, id));
      } catch {
        // Keep list-row metrics if detail fails.
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, activityIds.length)) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return out;
}
