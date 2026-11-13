/**
 * Display helpers for sleep nights. Null stays unknown — never invent 0%.
 */

export function formatSleepClock(iso: string | null, timeZone?: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  try {
    return new Date(t).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(zone ? { timeZone: zone } : {}),
    });
  } catch {
    return new Date(t).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}

/** H:MM from seconds; null → null (caller shows «—»). */
export function formatSleepDuration(sec: number | null): string | null {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (m === 60) return `${h + 1}:00`;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** Hours with one decimal for metric cards. */
export function sleepHoursValue(sec: number | null): number | null {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return null;
  return Math.round((sec / 3600) * 10) / 10;
}

/**
 * Stage share of overnight sleep (deep+light+rem), or of sleepSec when stages incomplete.
 * Awake is excluded from the denominator when all three sleep stages are known.
 */
export function sleepStagePercent(
  partSec: number | null,
  stages: { deep: number | null; light: number | null; rem: number | null },
  sleepSec: number | null,
): number | null {
  if (partSec == null || !Number.isFinite(partSec) || partSec < 0) return null;
  const parts = [stages.deep, stages.light, stages.rem];
  const known = parts.filter((n): n is number => n != null && Number.isFinite(n) && n >= 0);
  let denom: number | null = null;
  if (known.length === 3) {
    denom = known.reduce((a, b) => a + b, 0);
  } else if (sleepSec != null && sleepSec > 0) {
    denom = sleepSec;
  }
  if (denom == null || denom <= 0) return null;
  return Math.round((partSec / denom) * 1000) / 10;
}

/** sleep / (sleep + awake) · 100. Null if either side unknown. */
export function sleepEfficiencyPercent(
  sleepSec: number | null,
  awakeSec: number | null,
): number | null {
  if (sleepSec == null || awakeSec == null) return null;
  if (!Number.isFinite(sleepSec) || !Number.isFinite(awakeSec) || sleepSec < 0 || awakeSec < 0) {
    return null;
  }
  const total = sleepSec + awakeSec;
  if (total <= 0) return null;
  return Math.round((sleepSec / total) * 1000) / 10;
}

export type SleepStageKey = 'deep' | 'light' | 'rem' | 'awake';

export type SleepStageRow = {
  key: SleepStageKey;
  labelRu: string;
  sec: number | null;
  durationLabel: string | null;
  percent: number | null;
  /** 0..1 for bar flex; 0 when unknown (do not fake width). */
  barShare: number;
};

export function buildSleepStageRows(night: {
  sleepSec: number | null;
  deepSec: number | null;
  lightSec: number | null;
  remSec: number | null;
  awakeSec: number | null;
}): SleepStageRow[] {
  const stages = {
    deep: night.deepSec,
    light: night.lightSec,
    rem: night.remSec,
  };
  const defs: Array<{ key: SleepStageKey; labelRu: string; sec: number | null }> = [
    { key: 'deep', labelRu: 'Глубокий', sec: night.deepSec },
    { key: 'light', labelRu: 'Лёгкий', sec: night.lightSec },
    { key: 'rem', labelRu: 'REM', sec: night.remSec },
    { key: 'awake', labelRu: 'Бодрствование', sec: night.awakeSec },
  ];

  const sleepParts = [night.deepSec, night.lightSec, night.remSec, night.awakeSec].filter(
    (n): n is number => n != null && n > 0,
  );
  const knownTotal = sleepParts.reduce((a, b) => a + b, 0);
  const overnightTotal = (night.sleepSec ?? 0) + (night.awakeSec ?? 0);
  const barDenom = Math.max(knownTotal, overnightTotal) || null;

  return defs.map((d) => {
    let percent: number | null;
    if (d.key === 'awake') {
      if (
        night.awakeSec != null &&
        night.sleepSec != null &&
        night.sleepSec + night.awakeSec > 0
      ) {
        percent =
          Math.round((night.awakeSec / (night.sleepSec + night.awakeSec)) * 1000) / 10;
      } else {
        percent = null;
      }
    } else {
      percent = sleepStagePercent(d.sec, stages, night.sleepSec);
    }
    const barShare =
      d.sec != null && barDenom != null && barDenom > 0 ? Math.min(1, d.sec / barDenom) : 0;
    return {
      key: d.key,
      labelRu: d.labelRu,
      sec: d.sec,
      durationLabel: formatSleepDuration(d.sec),
      percent,
      barShare,
    };
  });
}

/** Averages include recorded nights only; an unknown duration never becomes zero. */
export function sleepWeekSummary(nights: Array<{ sleepSec: number | null; sleepScore: number | null } | null>) {
  const durations = nights.flatMap(n => n?.sleepSec != null && Number.isFinite(n.sleepSec) && n.sleepSec >= 0 ? [n.sleepSec] : []);
  const scores = nights.flatMap(n => n?.sleepScore != null && Number.isFinite(n.sleepScore) && n.sleepScore >= 0 && n.sleepScore <= 100 ? [n.sleepScore] : []);
  return {
    knownCount: durations.length,
    averageSec: durations.length ? durations.reduce((sum, n) => sum + n, 0) / durations.length : null,
    averageScore: scores.length ? scores.reduce((sum, n) => sum + n, 0) / scores.length : null,
  };
}
