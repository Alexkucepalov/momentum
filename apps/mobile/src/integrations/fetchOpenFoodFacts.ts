import { Platform } from 'react-native';

import {
  barcodeLookupCandidates,
  isPlausibleBarcode,
} from '../../../../src/integrations/barcodeNormalize';
import { normalizeOffProduct, type OffLookupResult } from '../../../../src/integrations/openFoodFacts';

/**
 * Do NOT set User-Agent via fetch headers (forbidden in RN/Chromium).
 * Prefer XMLHttpRequest: native xhr.timeout works on Android/iOS Expo Go;
 * fetch+AbortSignal previously canceled healthy requests.
 */
const PER_URL_MS = 16000;
const OVERALL_MS = 18000;

type AttemptOk = { ok: true; result: OffLookupResult; url: string };
type AttemptFail = { ok: false; error: string; url: string };
type Attempt = AttemptOk | AttemptFail;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJsonXhr(url: string, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.timeout = timeoutMs;
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`HTTP ${xhr.status}`));
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText) as unknown);
        } catch {
          reject(new Error('invalid json'));
        }
      };
      xhr.onerror = () => reject(new Error('network'));
      xhr.ontimeout = () => reject(new Error('timeout'));
      xhr.send();
    } catch (e) {
      reject(e instanceof Error ? e : new Error('xhr failed'));
    }
  });
}

/** Soft-timeout fetch fallback when XHR is unavailable (web edge cases). */
async function fetchJsonFetch(url: string, timeoutMs: number): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  // Native: XHR (reliable timeout). Web: fetch (CORS). Never chain both — doubles wait.
  if (Platform.OS === 'web') {
    return fetchJsonFetch(url, timeoutMs);
  }
  return fetchJsonXhr(url, timeoutMs);
}

async function tryUrl(code: string, url: string): Promise<Attempt> {
  try {
    const json = await fetchJson(url, PER_URL_MS);
    return { ok: true, result: normalizeOffProduct(code, json), url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed';
    return { ok: false, error: msg, url };
  }
}

/** Race world / ru / fr — same DB, different edges for CIS mobile carriers. */
function urlsForCode(code: string): string[] {
  const encoded = encodeURIComponent(code);
  const world = `https://world.openfoodfacts.org/api/v0/product/${encoded}.json`;
  const ru = `https://ru.openfoodfacts.org/api/v0/product/${encoded}.json`;
  const fr = `https://fr.openfoodfacts.org/api/v0/product/${encoded}.json`;
  return /^46[0-9]/.test(code) ? [ru, world, fr] : [world, ru, fr];
}

function withAttribution(result: Extract<OffLookupResult, { status: 'ok' }>, url: string) {
  return {
    ...result,
    attribution: url.includes('ru.openfoodfacts')
      ? 'Open Food Facts (Россия)'
      : 'Open Food Facts',
  };
}

function raceHosts(code: string): Promise<OffLookupResult> {
  const urls = urlsForCode(code);

  return new Promise((resolve, reject) => {
    let pending = urls.length;
    let done = false;
    let lastIncomplete: OffLookupResult | null = null;
    let sawNotFound = false;
    const errors: string[] = [];

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(overallTimer);
      fn();
    };

    const overallTimer = setTimeout(() => {
      finish(() => {
        if (lastIncomplete) {
          resolve(lastIncomplete);
          return;
        }
        if (sawNotFound) {
          resolve({ status: 'not_found', barcode: code });
          return;
        }
        reject(new Error(networkHint(errors)));
      });
    }, OVERALL_MS);

    for (const url of urls) {
      void tryUrl(code, url).then((attempt) => {
        if (done) return;

        if (!attempt.ok) {
          errors.push(attempt.error);
          pending -= 1;
          if (pending === 0) {
            finish(() => reject(new Error(networkHint(errors))));
          }
          return;
        }

        if (attempt.result.status === 'ok') {
          const ok = attempt.result;
          finish(() => resolve(withAttribution(ok, attempt.url)));
          return;
        }

        if (attempt.result.status === 'incomplete') {
          lastIncomplete = attempt.result;
        } else if (attempt.result.status === 'not_found') {
          sawNotFound = true;
        } else {
          errors.push('unusable payload');
        }

        pending -= 1;
        if (pending === 0) {
          finish(() => {
            if (lastIncomplete) {
              resolve(lastIncomplete);
              return;
            }
            if (sawNotFound) {
              resolve({ status: 'not_found', barcode: code });
              return;
            }
            reject(new Error(networkHint(errors)));
          });
        }
      });
    }
  });
}

function networkHint(errors: string[]): string {
  const hint =
    Platform.OS === 'web'
      ? 'На web каталог может блокироваться CORS — открой в Expo Go на телефоне.'
      : 'Оператор или сеть не пускает к Open Food Facts. Попробуй Wi‑Fi или добавь офлайн.';
  const detail = [...new Set(errors)].slice(0, 3).join('; ') || 'timeout';
  return `${hint} (${detail})`;
}

export async function fetchOpenFoodFacts(barcode: string): Promise<OffLookupResult> {
  const candidates = barcodeLookupCandidates(barcode);
  if (candidates.length === 0 || !candidates.some(isPlausibleBarcode)) {
    const cleaned = barcode.replace(/\D/g, '');
    return { status: 'incomplete', barcode: cleaned, reason: 'Штрихкод: 8–14 цифр' };
  }

  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  const primary = ordered[0]!;

  try {
    return await raceHosts(primary);
  } catch (firstErr) {
    if (ordered.length < 2) throw firstErr;
    await sleep(50);
    try {
      return await Promise.race([
        raceHosts(ordered[1]!),
        sleep(OVERALL_MS).then(() => {
          throw firstErr instanceof Error ? firstErr : new Error(String(firstErr));
        }),
      ]);
    } catch {
      throw firstErr;
    }
  }
}
