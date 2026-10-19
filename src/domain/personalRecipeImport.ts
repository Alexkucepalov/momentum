import type { Nutrition } from './nutrition';
import type { FoodProduct } from '../storage/types';

/** Wire format from docs/fixtures/personal-recipes-expanded.json */
export type PersonalRecipeImportFile = {
  format: string;
  recipes: PersonalRecipeImportRaw[];
};

export type PersonalRecipeImportRaw = {
  id: string;
  title: string;
  category?: string | null;
  record_status?: string | null;
  source_context?: string | null;
  ingredients: Array<{
    name: string;
    quantity: number | null;
    unit: string | null;
    note?: string | null;
    nutrition_per_100g?: {
      energyKcal?: number | null;
      proteinG?: number | null;
      fatG?: number | null;
      carbG?: number | null;
    } | null;
  }>;
  instructions?: string[] | null;
  cooked_yield_g?: number | null;
  notes?: string[] | null;
  needs_confirmation?: string[] | null;
  verified_by_user?: boolean | null;
};

export type PersonalRecipePreview = {
  importKey: string;
  stableRecipeId: string;
  title: string;
  status: string;
  verifiedByUser: boolean;
  sourceContext: string | null;
  ingredientCount: number;
  knownGramCount: number;
  missingQuantityCount: number;
  missingQuantityNames: string[];
  provisionalYieldG: number | null;
  yieldIsProvisional: boolean;
  /** Recommended default selection for review UI. */
  suggested: boolean;
  warnings: string[];
};

export type PersonalRecipeDraft = {
  importKey: string;
  stableRecipeId: string;
  name: string;
  cookedYieldG: number;
  description: string;
  instructions: string | null;
  ingredients: Array<{
    productId: string | null;
    displayName: string;
    rawGrams: number;
    nutritionPer100g: Nutrition;
  }>;
};

export function stablePersonalRecipeId(importKey: string): string {
  return `import:${importKey}`;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9%.\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Safe local match: exact / starts-with / contains on product name or seed aliases via name only. */
export function matchProductId(
  ingredientName: string,
  products: FoodProduct[],
): string | null {
  const q = normalizeName(ingredientName);
  if (!q) return null;
  const active = products.filter((p) => p.deletedAt == null);
  const exact = active.filter((p) => normalizeName(p.name) === q);
  if (exact.length === 1) return exact[0]!.id;
  const starts = active.filter((p) => normalizeName(p.name).startsWith(q) || q.startsWith(normalizeName(p.name)));
  if (starts.length === 1) return starts[0]!.id;
  const contains = active.filter((p) => {
    const n = normalizeName(p.name);
    return n.includes(q) || q.includes(n);
  });
  if (contains.length === 1) return contains[0]!.id;
  return null;
}

function gramsFromIngredient(ing: PersonalRecipeImportRaw['ingredients'][number]): number | null {
  if (ing.quantity == null || !Number.isFinite(ing.quantity) || ing.quantity < 0) return null;
  const unit = (ing.unit ?? '').toLowerCase();
  if (unit === 'g' || unit === 'гр' || unit === 'грамм') return ing.quantity;
  // ml ≈ g only for logging mass placeholder — still unknown density; keep as note instead.
  return null;
}

function nutritionFromRaw(
  ing: PersonalRecipeImportRaw['ingredients'][number],
  matched: FoodProduct | null,
): Nutrition {
  const n = ing.nutrition_per_100g;
  if (n && (n.energyKcal != null || n.proteinG != null || n.fatG != null || n.carbG != null)) {
    return {
      kcal: n.energyKcal ?? null,
      protein: n.proteinG ?? null,
      fat: n.fatG ?? null,
      carbs: n.carbG ?? null,
    };
  }
  // Linked catalog product — use known values (not invented).
  if (matched) {
    return {
      kcal: matched.energyKcal,
      protein: matched.proteinG,
      fat: matched.fatG,
      carbs: matched.carbG,
    };
  }
  return { kcal: null, protein: null, fat: null, carbs: null };
}

export function loadPersonalRecipeImportFile(raw: unknown): PersonalRecipeImportFile {
  if (!raw || typeof raw !== 'object') throw new Error('Ожидался объект импорта рецептов');
  const obj = raw as Record<string, unknown>;
  if (obj.format !== 'momentum.recipe_import.v1') {
    throw new Error('Неверный format — нужен momentum.recipe_import.v1');
  }
  if (!Array.isArray(obj.recipes)) throw new Error('Нет списка recipes');
  return obj as unknown as PersonalRecipeImportFile;
}

export function previewPersonalRecipes(file: PersonalRecipeImportFile): PersonalRecipePreview[] {
  return file.recipes.map((r) => {
    const missingNames: string[] = [];
    let knownGramCount = 0;
    let gramSum = 0;
    for (const ing of r.ingredients ?? []) {
      const g = gramsFromIngredient(ing);
      if (g == null) {
        missingNames.push(ing.name);
      } else {
        knownGramCount += 1;
        gramSum += g;
      }
    }
    const yieldGiven =
      r.cooked_yield_g != null && Number.isFinite(r.cooked_yield_g) && r.cooked_yield_g > 0
        ? r.cooked_yield_g
        : null;
    const provisionalYieldG = yieldGiven ?? (gramSum > 0 ? Math.round(gramSum) : null);
    const status = r.record_status ?? 'unknown';
    const verified = !!r.verified_by_user;
    const suggested =
      verified || status === 'user_prepared' || status === 'discussed';
    const warnings: string[] = [];
    if (missingNames.length) {
      warnings.push(`Нет точных грамм: ${missingNames.length} поз.`);
    }
    if (yieldGiven == null && provisionalYieldG != null) {
      warnings.push('Выход не задан — будет сумма известных масс (проверь)');
    }
    if (provisionalYieldG == null) {
      warnings.push('Нет ни выхода, ни грамм — импорт недоступен без ручной правки');
    }
    if (!verified && status.startsWith('assistant')) {
      warnings.push('Предложение ассистента — не подтверждено приготовление');
    }
    return {
      importKey: r.id,
      stableRecipeId: stablePersonalRecipeId(r.id),
      title: r.title,
      status,
      verifiedByUser: verified,
      sourceContext: r.source_context ?? null,
      ingredientCount: (r.ingredients ?? []).length,
      knownGramCount,
      missingQuantityCount: missingNames.length,
      missingQuantityNames: missingNames,
      provisionalYieldG,
      yieldIsProvisional: yieldGiven == null && provisionalYieldG != null,
      suggested,
      warnings,
    };
  });
}

/**
 * Build a saveable draft. Skips unknown gram lines into notes (never stores 0 for unknown).
 * Returns null if cannot save without inventing yield.
 */
export function buildPersonalRecipeDraft(
  raw: PersonalRecipeImportRaw,
  products: FoodProduct[],
): PersonalRecipeDraft | null {
  const known: PersonalRecipeDraft['ingredients'] = [];
  const unresolved: string[] = [];

  for (const ing of raw.ingredients ?? []) {
    const g = gramsFromIngredient(ing);
    if (g == null) {
      const unit = ing.unit ? ` ${ing.quantity ?? '?'} ${ing.unit}` : '';
      const note = ing.note ? ` — ${ing.note}` : '';
      unresolved.push(`${ing.name}${unit}${note}`);
      continue;
    }
    const productId = matchProductId(ing.name, products);
    const matched = productId ? products.find((p) => p.id === productId) ?? null : null;
    known.push({
      productId,
      displayName: ing.name,
      rawGrams: g,
      nutritionPer100g: nutritionFromRaw(ing, matched),
    });
  }

  const yieldGiven =
    raw.cooked_yield_g != null && Number.isFinite(raw.cooked_yield_g) && raw.cooked_yield_g > 0
      ? raw.cooked_yield_g
      : null;
  const gramSum = known.reduce((s, i) => s + i.rawGrams, 0);
  const cookedYieldG = yieldGiven ?? (gramSum > 0 ? Math.round(gramSum) : null);
  if (cookedYieldG == null) return null;

  const descParts: string[] = [];
  if (raw.category) descParts.push(`Категория: ${raw.category}`);
  if (raw.record_status) descParts.push(`Статус: ${raw.record_status}`);
  if (raw.source_context) descParts.push(raw.source_context);
  if (yieldGiven == null) {
    descParts.push(
      `Выход не был указан — временно ${cookedYieldG} г (сумма известных масс). Уточни после взвешивания.`,
    );
  }
  if (unresolved.length) {
    descParts.push('Без точных грамм (не подставляли 0):');
    for (const u of unresolved) descParts.push(`· ${u}`);
  }
  if (raw.notes?.length) {
    descParts.push('Заметки:');
    for (const n of raw.notes) descParts.push(`· ${n}`);
  }
  if (raw.needs_confirmation?.length) {
    descParts.push('Нужно подтвердить:');
    for (const n of raw.needs_confirmation) descParts.push(`· ${n}`);
  }

  const instructions = (raw.instructions ?? []).filter(Boolean).join('\n') || null;

  // Need at least one known ingredient OR we still allow empty ings if we had yield — but createRecipe needs ings or manual nutrition.
  if (known.length === 0) {
    // Cannot invent nutrition — refuse.
    return null;
  }

  return {
    importKey: raw.id,
    stableRecipeId: stablePersonalRecipeId(raw.id),
    name: raw.title.trim(),
    cookedYieldG,
    description: descParts.join('\n'),
    instructions,
    ingredients: known,
  };
}
