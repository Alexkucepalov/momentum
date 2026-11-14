import {
  requestText,
  RequestCancelledError,
} from "../../integrations/requestText";
import { getLocalDataWipeEpoch } from "../../../../../src/domain/localDataWipeEpoch";
import {
  jwtExpiresAtEpoch,
  normalizeGarminApiKey,
  shouldRefreshBearerToken,
} from "../../../../../src/domain/garmin";
import {
  clearBearerCache,
  getBearerCache,
  getGarminApiKey,
  setBearerCache,
  type BearerCache,
} from "./secureKeyStore";

export const GARMIN_BASE_URL = "https://personal.connectapi.garmin.com";
const TOKEN_PATH =
  "/personalapitoken-service/personal-api/personal-api-key/token";
/** Garmin clients send a UA; some gateways reject bare RN fetch without it. */
export const GARMIN_USER_AGENT = "nf-fit/0.1 (Garmin Personal API; Android)";

export class GarminAuthError extends Error {
  statusCode: number | null;
  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "GarminAuthError";
    this.statusCode = statusCode;
  }
}

/** Non-cryptographic fingerprint for bearer-cache invalidation when the key changes. */
export function fingerprintApiKey(apiKey: string): string {
  const s = `${GARMIN_BASE_URL}\0${apiKey}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `fp:${s.length}:${h}`;
}

/**
 * Exchange Personal API key for bearer JWT (or reuse SecureStore cache).
 * Never logs the key or token.
 */
export async function obtainGarminBearerToken(opts?: {
  forceRefresh?: boolean;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<{ accessToken: string; expiresAt: number }> {
  if (opts?.signal?.aborted) throw new RequestCancelledError();
  const epoch = getLocalDataWipeEpoch();
  const apiKey = normalizeGarminApiKey(
    opts?.apiKey ?? (await getGarminApiKey()) ?? "",
  );
  if (!apiKey) {
    throw new GarminAuthError("Garmin API key не сохранён");
  }
  if (apiKey.length < 16) {
    throw new GarminAuthError(
      "Ключ слишком короткий — вставь полный Personal API Key",
    );
  }

  const fingerprint = fingerprintApiKey(apiKey);
  if (!opts?.forceRefresh) {
    const cached = await getBearerCache();
    if (
      cached &&
      cached.fingerprint === fingerprint &&
      !shouldRefreshBearerToken(cached.expiresAt)
    ) {
      if (epoch !== getLocalDataWipeEpoch() || opts?.signal?.aborted)
        throw new RequestCancelledError();
      return { accessToken: cached.accessToken, expiresAt: cached.expiresAt };
    }
  }

  // Bodyless POST + UA: matches official clients; RN often omits Content-Length otherwise.
  const { response: res, text: bodyText } = await requestText(
    `${GARMIN_BASE_URL}${TOKEN_PATH}`,
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: `ApiKey ${apiKey}`,
        "User-Agent": GARMIN_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "",
    },
    { signal: opts?.signal },
  );
  if (!res.ok) {
    await clearBearerCache();
    if (res.status === 401 || res.status === 403) {
      throw new GarminAuthError(
        `Ключ отклонён Garmin (HTTP ${res.status}). Создай новый Personal API Key.`,
        res.status,
      );
    }
    if (res.status === 400) {
      throw new GarminAuthError(
        "Garmin не принял ключ (HTTP 400). Проверь, что скопирован именно Personal API Key целиком, без кавычек.",
        res.status,
      );
    }
    throw new GarminAuthError(
      `Ошибка токена Garmin (HTTP ${res.status}). Повтори синхронизацию позже.`,
      res.status,
    );
  }
  const accessToken = bodyText.trim();
  if (!accessToken) {
    throw new GarminAuthError("Garmin вернул пустой токен");
  }
  const expiresAt = jwtExpiresAtEpoch(accessToken);
  if (expiresAt == null) {
    throw new GarminAuthError(
      "Ответ Garmin не похож на JWT — возможно, вставлен не тот ключ",
    );
  }
  const cache: BearerCache = { fingerprint, accessToken, expiresAt };
  if (epoch !== getLocalDataWipeEpoch() || opts?.signal?.aborted)
    throw new RequestCancelledError();
  await setBearerCache(cache);
  if (epoch !== getLocalDataWipeEpoch()) {
    await clearBearerCache();
    throw new RequestCancelledError();
  }
  if (opts?.signal?.aborted) throw new RequestCancelledError();
  return { accessToken, expiresAt };
}

/** Save-time check: force new token exchange. */
export async function verifyGarminApiKey(
  apiKey: string,
  signal?: AbortSignal,
): Promise<void> {
  await obtainGarminBearerToken({ apiKey, forceRefresh: true, signal });
}
