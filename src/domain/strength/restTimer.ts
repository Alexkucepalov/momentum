/** A wall-clock deadline keeps rest correct across backgrounding and delayed JS ticks. */
export function restSecondsRemaining(deadlineMs: number, nowMs: number): number {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
