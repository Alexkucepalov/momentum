/**
 * Process-local epoch bumped on full user wipe.
 * In-flight Garmin sync captures the value at start and aborts writes if it changes.
 */
let epoch = 0;

export function getLocalDataWipeEpoch(): number {
  return epoch;
}

/** @returns new epoch after bump */
export function bumpLocalDataWipeEpoch(): number {
  epoch += 1;
  return epoch;
}
