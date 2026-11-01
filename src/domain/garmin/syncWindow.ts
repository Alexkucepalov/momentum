import { addUtcDays } from './dateChunks';
import type { SyncWindow } from './types';

/** Deep backfill for founder dogfood — Garmin Personal API history. */
export const FULL_SYNC_DAYS = 365 * 3;

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * full: last FULL_SYNC_DAYS through today (ignore prior cursor).
 * incremental: from lastSyncedTo (re-fetch that day) through today.
 */
export function computeSyncWindow(args: {
  todayLocal: string;
  lastSyncedTo: string | null;
  mode?: 'full' | 'incremental';
  now?: Date;
}): SyncWindow {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(args.todayLocal)
    ? args.todayLocal
    : toDateOnly(args.now ?? new Date());

  const mode = args.mode ?? (args.lastSyncedTo ? 'incremental' : 'full');

  if (mode === 'full' || !args.lastSyncedTo || !/^\d{4}-\d{2}-\d{2}$/.test(args.lastSyncedTo)) {
    return {
      startDate: addUtcDays(today, -(FULL_SYNC_DAYS - 1)),
      endDate: today,
      isInitial: true,
    };
  }

  let startDate = args.lastSyncedTo;
  if (startDate > today) startDate = today;
  return {
    startDate,
    endDate: today,
    isInitial: false,
  };
}

function base64UrlToUtf8(payload: string): string {
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const g = globalThis as {
    atob?: (s: string) => string;
    Buffer?: { from(s: string, enc: string): { toString(enc: string): string } };
  };
  if (typeof g.atob === 'function') return g.atob(b64);
  if (g.Buffer) return g.Buffer.from(b64, 'base64').toString('utf8');
  throw new Error('No base64 decoder');
}

export function jwtExpiresAtEpoch(accessToken: string): number | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const json = base64UrlToUtf8(parts[1]!);
    const obj = JSON.parse(json) as { exp?: unknown };
    if (typeof obj.exp !== 'number' || !Number.isFinite(obj.exp)) return null;
    return obj.exp;
  } catch {
    return null;
  }
}

export function shouldRefreshBearerToken(
  expiresAtEpoch: number,
  nowEpochSec = Math.floor(Date.now() / 1000),
): boolean {
  return expiresAtEpoch - nowEpochSec <= 60 * 60;
}
