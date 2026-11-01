import * as SecureStore from 'expo-secure-store';

import { normalizeGarminApiKey } from '../../../../../src/domain/garmin';

const API_KEY = 'momentum.garmin.personalApiKey';
const BEARER_CACHE = 'momentum.garmin.bearerCache';

export type BearerCache = {
  /** Opaque fingerprint of baseUrl + apiKey — not the key itself. */
  fingerprint: string;
  accessToken: string;
  expiresAt: number;
};

export async function getGarminApiKey(): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(API_KEY);
    const t = normalizeGarminApiKey(v ?? '');
    return t ? t : null;
  } catch {
    return null;
  }
}

export async function setGarminApiKey(apiKey: string): Promise<void> {
  const t = normalizeGarminApiKey(apiKey);
  if (!t) throw new Error('API key пустой');
  if (t.length < 16) throw new Error('Ключ слишком короткий — вставь полный Personal API Key');
  await SecureStore.setItemAsync(API_KEY, t);
  // Old bearer was for a different key.
  await SecureStore.deleteItemAsync(BEARER_CACHE).catch(() => undefined);
}

export async function clearGarminApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(BEARER_CACHE).catch(() => undefined);
}

export async function getBearerCache(): Promise<BearerCache | null> {
  try {
    const raw = await SecureStore.getItemAsync(BEARER_CACHE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BearerCache;
    if (
      typeof parsed.fingerprint !== 'string' ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setBearerCache(cache: BearerCache): Promise<void> {
  await SecureStore.setItemAsync(BEARER_CACHE, JSON.stringify(cache));
}

export async function clearBearerCache(): Promise<void> {
  await SecureStore.deleteItemAsync(BEARER_CACHE).catch(() => undefined);
}
