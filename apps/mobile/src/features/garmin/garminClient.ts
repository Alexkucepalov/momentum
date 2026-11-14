import { chunkInclusiveDateRange } from "../../../../../src/domain/garmin";
import {
  requestText,
  RequestCancelledError,
  RequestTimeoutError,
} from "../../integrations/requestText";
import { GARMIN_BASE_URL, GARMIN_USER_AGENT } from "./garminAuth";

export class GarminClientError extends Error {
  constructor(
    message: string,
    public statusCode: number | null = null,
  ) {
    super(message);
    this.name = "GarminClientError";
  }
}
const fatal = (e: unknown) =>
  e instanceof RequestCancelledError ||
  e instanceof RequestTimeoutError ||
  (e instanceof GarminClientError && e.statusCode === 401);
async function garminGet(
  accessToken: string,
  path: string,
  params?: Record<string, string | number | boolean>,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = new URL(`${GARMIN_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params ?? {}))
    url.searchParams.set(k, String(v));
  const { response: res, text } = await requestText(
    url.toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": GARMIN_USER_AGENT,
      },
    },
    { signal },
  );
  if (!res.ok)
    throw new GarminClientError(
      res.status === 401
        ? "Сессия Garmin истекла — повтори синхронизацию"
        : `${path} → HTTP ${res.status}. Повтори синхронизацию позже.`,
      res.status,
    );
  if (!text.trim() || text.trim() === "null") return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new GarminClientError(`${path}: не-JSON ответ`);
  }
}
export type ChunkedFetchResult = { payloads: unknown[]; warnings: string[] };
async function chunks(
  token: string,
  start: string,
  end: string,
  days: number,
  label: string,
  request: (
    from: string,
    to: string,
  ) => { path: string; params?: Record<string, string | boolean> },
  signal?: AbortSignal,
  flatten = false,
): Promise<ChunkedFetchResult> {
  const payloads: unknown[] = [],
    warnings: string[] = [];
  for (const c of chunkInclusiveDateRange(start, end, days)) {
    const { path, params } = request(c.startDate, c.endDate);
    try {
      const value = await garminGet(token, path, params, signal);
      if (flatten && Array.isArray(value)) payloads.push(...value);
      else if (value != null) payloads.push(value);
    } catch (e) {
      if (fatal(e)) throw e;
      warnings.push(
        `${label} ${c.startDate}…${c.endDate}: ${e instanceof Error ? e.message : "Не удалось загрузить"}`,
      );
    }
  }
  if (!payloads.length && warnings.length)
    throw new GarminClientError(warnings[0], 400);
  return { payloads, warnings };
}
export function fetchDailyStepsChunked(
  token: string,
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<ChunkedFetchResult> {
  return chunks(
    token,
    start,
    end,
    28,
    "Шаги",
    (from, to) => ({
      path: `/usersummary-service/stats/steps/daily/${from}/${to}`,
    }),
    signal,
    true,
  );
}
export function fetchWeightRangeChunked(
  token: string,
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<ChunkedFetchResult> {
  return chunks(
    token,
    start,
    end,
    90,
    "Вес",
    (from, to) => ({
      path: `/weight-service/weight/range/${from}/${to}`,
      params: { includeAll: true },
    }),
    signal,
  );
}
export function fetchDailySleepSummariesChunked(
  token: string,
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<ChunkedFetchResult> {
  return chunks(
    token,
    start,
    end,
    14,
    "Сон",
    (startDate, endDate) => ({
      path: "/sleep-service/sleep/dailySleepSummariesByDate",
      params: { startDate, endDate },
    }),
    signal,
  );
}
export function fetchDailySummariesChunked(
  token: string,
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<ChunkedFetchResult> {
  return chunks(
    token,
    start,
    end,
    28,
    "Дневная активность",
    (startDate, endDate) => ({
      path: "/usersummary-service/v2/dailysummaries",
      params: { startDate, endDate },
    }),
    signal,
  );
}
export function fetchActivitiesPage(
  token: string,
  args: {
    start: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    signal?: AbortSignal;
  },
): Promise<unknown> {
  const params: Record<string, string | number> = {
    start: args.start,
    limit: args.limit,
  };
  if (args.startDate) params.startDate = args.startDate;
  if (args.endDate) params.endDate = args.endDate;
  return garminGet(
    token,
    "/activitylist-service/activities/search/activities",
    params,
    args.signal,
  );
}
export async function fetchAllActivities(
  token: string,
  opts?: {
    startDate?: string;
    endDate?: string;
    pageSize?: number;
    maxPages?: number;
    signal?: AbortSignal;
  },
): Promise<unknown[]> {
  const pageSize = opts?.pageSize ?? 100,
    maxPages = opts?.maxPages ?? 100,
    all: unknown[] = [];
  for (let page = 0; page < maxPages; page++) {
    const payload = await fetchActivitiesPage(token, {
      start: page * pageSize,
      limit: pageSize,
      startDate: opts?.startDate,
      endDate: opts?.endDate,
      signal: opts?.signal,
    });
    const rows = Array.isArray(payload) ? payload : [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}
export function fetchActivitySummary(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return garminGet(
    token,
    `/activity-service/activity/${id}`,
    undefined,
    signal,
  );
}
export function fetchActivityDetails(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return garminGet(
    token,
    `/activity-service/activity/${id}/details`,
    { maxChartSize: 2000, maxPolylineSize: 4000 },
    signal,
  );
}
export function fetchActivityMapDetails(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return garminGet(
    token,
    `/activity-service/activity/${id}/mapdetails`,
    { maxPolylineSize: 4000 },
    signal,
  );
}
export async function fetchActivityDetailBundle(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    return await fetchActivityDetails(token, id, signal);
  } catch (e) {
    if (fatal(e)) throw e;
    const summary = await fetchActivitySummary(token, id, signal);
    try {
      const map = await fetchActivityMapDetails(token, id, signal);
      return summary &&
        typeof summary === "object" &&
        map &&
        typeof map === "object"
        ? { ...summary, ...map }
        : (map ?? summary);
    } catch (e) {
      if (fatal(e)) throw e;
      return summary;
    }
  }
}
export async function fetchActivityDetailsBatched(
  token: string,
  ids: string[],
  concurrency = 3,
  signal?: AbortSignal,
): Promise<Map<string, unknown>> {
  const out = new Map<string, unknown>(),
    controller = new AbortController();
  let i = 0;
  const cancel = () => controller.abort();
  if (signal?.aborted) throw new RequestCancelledError();
  signal?.addEventListener("abort", cancel, { once: true });
  async function worker() {
    while (i < ids.length) {
      if (controller.signal.aborted) throw new RequestCancelledError();
      const id = ids[i++]!;
      try {
        out.set(
          id,
          await fetchActivityDetailBundle(token, id, controller.signal),
        );
      } catch (e) {
        if (fatal(e)) {
          controller.abort();
          throw e;
        }
      }
    }
  }
  try {
    await Promise.all(
      Array.from(
        { length: Math.min(concurrency, Math.max(1, ids.length)) },
        worker,
      ),
    );
    return out;
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
