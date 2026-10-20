import type { PantryLocation } from '../storage/types';

/**
 * Soft default location for purchase → pantry. User can change after confirm.
 * Never invents quantity — only a storage guess from the display name.
 */
export function suggestPantryLocation(displayName: string): PantryLocation {
  const n = displayName.trim().toLowerCase();
  if (!n) return 'pantry';

  if (
    /морозил|заморож|лёд|лед|морожен|dumpling|пельмен|наггетс|филе.*зам|зам\./i.test(n)
  ) {
    return 'freezer';
  }

  if (
    /молок|кефир|йогурт|творог|сыр|сметан|яйц|масло слив|ряженк|простокваш|сливк|колбас|ветчин|сосиск|курица|индейк|говяд|свинин|рыба|лосос|форель|фарш|салат|огур|помидор|томат|зелен|укроп|петруш|свекл|морков|капуст|яблок|банан|груш|ягод|виноград|арбуз|дыня|сок|напиток|питьев/i.test(
      n,
    )
  ) {
    return 'fridge';
  }

  return 'pantry';
}
