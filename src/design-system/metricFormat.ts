/**
 * Format metric display values. Unknown must never become "0".
 */
export function formatMetricValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number' && Number.isNaN(value)) return '—';
  return String(value);
}
