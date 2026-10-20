# Food Planner — data model & contracts

**Storage v1:** SQLite on device (offline-first). PostgreSQL entities below are **future sync shape**, not a requirement for Sprint 1.  
**Rule:** domain math in shared TypeScript; repositories persist; AI never writes final numbers.

## Domain modules (planned)

| Module | Responsibility |
|--------|----------------|
| `remainingMacros.ts` | targets − known daily totals; preserve null |
| `scoreEatNow.ts` | rank candidates by fit to remaining + filters |
| `scaleRecipePortion.ts` | grams ↔ KBJU; batch yield |
| `aggregateShopping.ts` | merge ingredients by normalized key + unit |
| `estimateBasketCost.ts` | sum known prices only; flag stale |
| `amortizeFoodCost.ts` | purchase vs eaten cost (Sprint 5) |

All functions: pure, deterministic, unit-tested; reject NaN / negative grams.

## SQLite entities (v1+)

### pantry_items

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| display_name | text | |
| product_id | text null | FK food_products |
| location | text | `fridge` \| `freezer` \| `pantry` |
| quantity_g | real null | mass; null if count-based |
| quantity_count | real null | e.g. eggs |
| unit | text | `g` \| `ml` \| `pcs` |
| expires_on | text null | YYYY-MM-DD |
| source | text | `user` |
| updated_at | text | |
| deleted_at | text null | |

### cooked_batches

Leftover prepared recipe inventory.

| Column | Notes |
|--------|-------|
| id, recipe_id, cooked_at, remaining_g, initial_yield_g | remaining decreases on diary log of that recipe when linked |

### meal_plans / planned_meals

| meal_plans | planned_meals |
|------------|---------------|
| id, start_date, end_date, status `draft`\|`active`\|`archived`, budget_rub null, cook_sessions null, created_at | id, plan_id, date_local, meal_slot, recipe_id null, product_id null, display_name, grams, status `planned` (never auto food_entries) |

### shopping_lists / shopping_items

| lists | items |
|-------|-------|
| id, plan_id null, title, status | id, list_id, display_name, quantity, unit, pantry_covered bool, checked, price_rub null, price_as_of null, price_source `user`\|`receipt`\|`estimate` |

### product_prices (user)

| Column | Notes |
|--------|-------|
| product_key, store_id, price_rub, unit, observed_on, source | Never labeled «цена сегодня» without fresh source |

### food_budgets / food_expenses (Sprint 5)

Budgets: month `YYYY-MM`, limit_rub.  
Expenses: amount, category `groceries`\|`cafe`\|`office`\|`delivery`, spent_on, note.

## Remaining macros contract

```ts
type MacroRemaining = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  /** true if any target or total field needed for that macro is unknown */
  incomplete: boolean;
};

// remaining = target - total when BOTH known; else null for that field
```

## Eat Now candidate contract

```ts
type EatNowCandidate = {
  id: string;
  kind: 'recipe' | 'product' | 'cooked_batch' | 'combo';
  title: string;
  suggestedGrams: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  prepMinutes: number | null;
  filtersMatched: string[];
  fitScore: number | null; // null if cannot score (unknown macros)
  explanation: string; // short, editable if from AI
};
```

Ranking only when `fitScore !== null`. Exclude invented nutrition.

## Shopping aggregate contract

```ts
type ShoppingLine = {
  key: string; // normalized name + unit family
  displayName: string;
  quantity: number;
  unit: 'g' | 'ml' | 'pcs';
  coveredByPantry: number; // same unit
  needToBuy: number;
  priceRub: number | null;
  priceAsOf: string | null;
  priceSource: 'user' | 'receipt' | 'estimate' | null;
};
```

## Retailer adapters (Sprint 6 — stub only)

```ts
interface StoreCatalogAdapter {
  storeId: string;
  /** Always false until legal integration exists */
  supportsLivePrices: boolean;
  search?(query: string): Promise<never>; // throw NotAvailable
}
```

Stores: `pyaterochka`, `chizhik`, `krasnoe_beloe`, `metro`, `samokat`, `other`.  
**Forbidden:** scraping, credential stuffing, ToS bypass.

## PostgreSQL (future sync)

Mirror: `meal_plans`, `planned_meals`, `pantry_items`, `recipe_variants`, `store_products`, `product_prices`, `shopping_lists`, `shopping_items`, `food_expenses`, `food_budgets`, `meal_plan_drafts`.  
Sync ADR separate; local remains source of truth for offline.

## Migrations

- Additive SQLite migrations only after Issue approval
- No destructive migrations without human approval (`AGENTS.md`)

## Test plan (all planner Issues)

- [ ] `unknown ≠ 0` for remaining, prices, KBJU
- [ ] Negative / NaN grams rejected
- [ ] Offline: create plan → kill app → draft persists
- [ ] Planned meal does not appear in daily totals until logged
- [ ] Shopping merges duplicate ingredients
- [ ] Stale price copy never says «сегодня»
- [ ] a11y labels on Plan hub and Eat Now
- [ ] `npm run typecheck && npm test` / `npm run verify`
