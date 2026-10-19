import type { FoodProduct } from '../storage/types';

/**
 * Bundled everyday foods for offline name search (not barcode-only).
 *
 * Nutrition is **reference per 100 g** from public food-composition style tables
 * (USDA FoodData Central / типовые справочники), rounded for logging convenience.
 * Not medical advice. User may edit; edits flip source to `user`.
 * Never invents values at runtime — only this curated list.
 */

export type CommonFoodSeed = {
  /** Stable id — must stay fixed across app versions. */
  id: string;
  name: string;
  /** Extra search tokens (RU synonyms, colloquial). */
  aliases: string[];
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

const TS = '2026-10-19T00:00:00.000Z';

/** ~50 staples people log every week. */
export const COMMON_FOOD_CATALOG: readonly CommonFoodSeed[] = [
  // Белки
  { id: 'seed:egg', name: 'Яйцо куриное', aliases: ['яйца', 'яйцо'], energyKcal: 157, proteinG: 12.6, fatG: 10.6, carbG: 1.1 },
  { id: 'seed:chicken-breast', name: 'Куриная грудка', aliases: ['курица', 'грудка', 'филе куриное'], energyKcal: 165, proteinG: 31, fatG: 3.6, carbG: 0 },
  { id: 'seed:chicken-thigh', name: 'Куриное бедро без кожи', aliases: ['бедро куриное'], energyKcal: 179, proteinG: 24.8, fatG: 8.2, carbG: 0 },
  { id: 'seed:turkey', name: 'Индейка филе', aliases: ['индейка'], energyKcal: 135, proteinG: 29, fatG: 2, carbG: 0 },
  { id: 'seed:beef', name: 'Говядина постная', aliases: ['говядина', 'мясо'], energyKcal: 171, proteinG: 26, fatG: 7, carbG: 0 },
  { id: 'seed:pork', name: 'Свинина постная', aliases: ['свинина'], energyKcal: 201, proteinG: 22, fatG: 12, carbG: 0 },
  { id: 'seed:salmon', name: 'Лосось', aliases: ['сёмга', 'семга', 'рыба'], energyKcal: 208, proteinG: 20, fatG: 13, carbG: 0 },
  { id: 'seed:tuna', name: 'Тунец консервированный в собственном соку', aliases: ['тунец'], energyKcal: 116, proteinG: 26, fatG: 1, carbG: 0 },
  { id: 'seed:cod', name: 'Треска', aliases: ['треска', 'белая рыба'], energyKcal: 82, proteinG: 18, fatG: 0.7, carbG: 0 },
  { id: 'seed:shrimp', name: 'Креветки варёные', aliases: ['креветки'], energyKcal: 99, proteinG: 24, fatG: 0.3, carbG: 0.2 },

  // Молочка
  { id: 'seed:milk-25', name: 'Молоко 2.5%', aliases: ['молоко'], energyKcal: 52, proteinG: 2.9, fatG: 2.5, carbG: 4.8 },
  { id: 'seed:kefir-25', name: 'Кефир 2.5%', aliases: ['кефир'], energyKcal: 50, proteinG: 3, fatG: 2.5, carbG: 4 },
  { id: 'seed:cottage-5', name: 'Творог 5%', aliases: ['творог'], energyKcal: 121, proteinG: 17, fatG: 5, carbG: 1.8 },
  { id: 'seed:cottage-0', name: 'Творог обезжиренный', aliases: ['творог 0', 'творог 0%'], energyKcal: 71, proteinG: 16.5, fatG: 0.2, carbG: 1.3 },
  { id: 'seed:greek-yogurt', name: 'Йогурт греческий 2%', aliases: ['йогурт', 'греческий'], energyKcal: 73, proteinG: 10, fatG: 2, carbG: 3.6 },
  { id: 'seed:sour-cream-15', name: 'Сметана 15%', aliases: ['сметана'], energyKcal: 158, proteinG: 2.6, fatG: 15, carbG: 3.6 },
  { id: 'seed:cheese-russian', name: 'Сыр российский', aliases: ['сыр'], energyKcal: 363, proteinG: 24, fatG: 29, carbG: 0.3 },
  { id: 'seed:butter', name: 'Масло сливочное', aliases: ['масло'], energyKcal: 748, proteinG: 0.5, fatG: 82.5, carbG: 0.8 },

  // Крупы / углеводы
  { id: 'seed:oats', name: 'Овсянка сухая', aliases: ['овсянка', 'геркулес', 'овсяные хлопья'], energyKcal: 389, proteinG: 16.9, fatG: 6.9, carbG: 66.3 },
  { id: 'seed:rice-cooked', name: 'Рис варёный', aliases: ['рис'], energyKcal: 130, proteinG: 2.7, fatG: 0.3, carbG: 28 },
  { id: 'seed:buckwheat-cooked', name: 'Гречка варёная', aliases: ['гречка', 'греча'], energyKcal: 110, proteinG: 4.2, fatG: 1.1, carbG: 21 },
  { id: 'seed:pasta-cooked', name: 'Макароны варёные', aliases: ['паста', 'макароны', 'спагетти'], energyKcal: 131, proteinG: 5, fatG: 1.1, carbG: 25 },
  { id: 'seed:potato-boiled', name: 'Картофель варёный', aliases: ['картошка', 'картофель'], energyKcal: 87, proteinG: 1.9, fatG: 0.1, carbG: 20 },
  { id: 'seed:bread-wheat', name: 'Хлеб пшеничный', aliases: ['хлеб', 'батон'], energyKcal: 265, proteinG: 9, fatG: 3.2, carbG: 49 },
  { id: 'seed:bread-rye', name: 'Хлеб ржаной', aliases: ['чёрный хлеб', 'бородинский'], energyKcal: 217, proteinG: 6.6, fatG: 1.2, carbG: 41 },
  { id: 'seed:tortilla', name: 'Тортилья пшеничная', aliases: ['лепёшка', 'тортилья'], energyKcal: 312, proteinG: 8.2, fatG: 7.1, carbG: 52 },

  // Овощи / фрукты
  { id: 'seed:cucumber', name: 'Огурец', aliases: ['огурцы'], energyKcal: 15, proteinG: 0.7, fatG: 0.1, carbG: 3.6 },
  { id: 'seed:tomato', name: 'Помидор', aliases: ['томат', 'помидоры'], energyKcal: 18, proteinG: 0.9, fatG: 0.2, carbG: 3.9 },
  { id: 'seed:cabbage', name: 'Капуста белокочанная', aliases: ['капуста'], energyKcal: 25, proteinG: 1.3, fatG: 0.1, carbG: 5.8 },
  { id: 'seed:carrot', name: 'Морковь', aliases: ['морковка'], energyKcal: 41, proteinG: 0.9, fatG: 0.2, carbG: 9.6 },
  { id: 'seed:onion', name: 'Лук репчатый', aliases: ['лук'], energyKcal: 40, proteinG: 1.1, fatG: 0.1, carbG: 9.3 },
  { id: 'seed:broccoli', name: 'Брокколи', aliases: [], energyKcal: 34, proteinG: 2.8, fatG: 0.4, carbG: 7 },
  { id: 'seed:banana', name: 'Банан', aliases: ['бананы'], energyKcal: 89, proteinG: 1.1, fatG: 0.3, carbG: 23 },
  { id: 'seed:apple', name: 'Яблоко', aliases: ['яблоки'], energyKcal: 52, proteinG: 0.3, fatG: 0.2, carbG: 14 },
  { id: 'seed:orange', name: 'Апельсин', aliases: [], energyKcal: 47, proteinG: 0.9, fatG: 0.1, carbG: 12 },
  { id: 'seed:berries-mix', name: 'Ягоды смешанные', aliases: ['черника', 'клубника', 'ягоды'], energyKcal: 43, proteinG: 0.7, fatG: 0.3, carbG: 10 },
  { id: 'seed:avocado', name: 'Авокадо', aliases: [], energyKcal: 160, proteinG: 2, fatG: 15, carbG: 9 },

  // Жиры / прочее
  { id: 'seed:oil-sunflower', name: 'Масло подсолнечное', aliases: ['растительное масло', 'масло раст'], energyKcal: 884, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:oil-olive', name: 'Масло оливковое', aliases: ['олива'], energyKcal: 884, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:peanut-butter', name: 'Арахисовая паста', aliases: ['паста арахисовая'], energyKcal: 588, proteinG: 25, fatG: 50, carbG: 20 },
  { id: 'seed:honey', name: 'Мёд', aliases: ['мед'], energyKcal: 304, proteinG: 0.3, fatG: 0, carbG: 82 },
  { id: 'seed:sugar', name: 'Сахар', aliases: [], energyKcal: 387, proteinG: 0, fatG: 0, carbG: 100 },
  { id: 'seed:dark-chocolate', name: 'Шоколад тёмный 70%', aliases: ['шоколад'], energyKcal: 598, proteinG: 7.8, fatG: 42.6, carbG: 45.9 },

  // Напитки / быстрый лог
  { id: 'seed:coffee-black', name: 'Кофе чёрный без сахара', aliases: ['кофе'], energyKcal: 2, proteinG: 0.1, fatG: 0, carbG: 0 },
  { id: 'seed:tea', name: 'Чай без сахара', aliases: ['чай'], energyKcal: 1, proteinG: 0, fatG: 0, carbG: 0 },
  { id: 'seed:water', name: 'Вода питьевая', aliases: ['вода'], energyKcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
] as const;

const BY_ID = new Map(COMMON_FOOD_CATALOG.map((f) => [f.id, f]));

export function commonFoodAliases(productId: string): string[] {
  return BY_ID.get(productId)?.aliases ?? [];
}

export function seedToFoodProduct(seed: CommonFoodSeed, nowIso = TS): FoodProduct {
  return {
    id: seed.id,
    name: seed.name,
    brand: 'Справочник',
    barcode: null,
    energyKcal: seed.energyKcal,
    proteinG: seed.proteinG,
    fatG: seed.fatG,
    carbG: seed.carbG,
    source: 'catalog',
    isFavorite: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  };
}

/**
 * Insert missing seed products. Does not revive soft-deleted ids.
 * Does not overwrite existing rows (user edits / OFF cache win).
 */
export function mergeCommonFoodCatalog(
  products: Map<string, FoodProduct>,
  nowIso: string = new Date().toISOString(),
): number {
  let added = 0;
  for (const seed of COMMON_FOOD_CATALOG) {
    if (products.has(seed.id)) continue;
    products.set(seed.id, seedToFoodProduct(seed, nowIso));
    added += 1;
  }
  return added;
}
