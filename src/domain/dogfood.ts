/** Founder 14-day dogfood gate helpers — no shame metrics, just a calm day counter. */

export const DOGFOOD_DAYS = 14;

export type DogfoodStatus = {
  startedOn: string | null;
  /** 1-based day index; null if not started. Caps display logic in UI. */
  dayNumber: number | null;
  daysTotal: typeof DOGFOOD_DAYS;
  /** True when dayNumber >= daysTotal (gate length reached). */
  gateReached: boolean;
};

function parseUtcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Inclusive day count from startedOn → todayLocal (YYYY-MM-DD). */
export function daysInclusive(startedOn: string, todayLocal: string): number {
  const a = parseUtcDay(startedOn);
  const b = parseUtcDay(todayLocal);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.floor(b - a) + 1);
}

export function dogfoodStatus(
  startedOn: string | null | undefined,
  todayLocal: string,
): DogfoodStatus {
  if (!startedOn) {
    return {
      startedOn: null,
      dayNumber: null,
      daysTotal: DOGFOOD_DAYS,
      gateReached: false,
    };
  }
  const dayNumber = daysInclusive(startedOn, todayLocal);
  return {
    startedOn,
    dayNumber,
    daysTotal: DOGFOOD_DAYS,
    gateReached: dayNumber >= DOGFOOD_DAYS,
  };
}
