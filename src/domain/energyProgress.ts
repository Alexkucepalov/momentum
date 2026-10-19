/**
 * Ratio 0..1 of food kcal vs personal energy target.
 * No target / unknown food → 0 (never invent a decorative fill).
 */
export function energyProgressRatio(
  foodKcal: number | null,
  energyTarget: number | null,
): number {
  if (energyTarget == null || !(energyTarget > 0) || foodKcal == null) return 0;
  if (!Number.isFinite(foodKcal) || foodKcal < 0) return 0;
  return Math.max(0, Math.min(1, foodKcal / energyTarget));
}
