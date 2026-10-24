# ADR-009 — Plan surface cut + My products

| Field | Value |
|-------|--------|
| **Status** | Accepted |
| **Date** | 2026-10-24 |
| **Issue** | [#105](https://github.com/Alexkucepalov/momentum/issues/105) |

## Context

Food Planner / Food Intelligence added pantry, purchase import, shopping, budget, and store prefs. Founder dogfood: these surfaces add friction without daily value. Eat Now was framed as «добор КБЖУ» and depended on pantry coverage.

## Decision

1. **Remove from UI** (hub + stack entry + week CTAs): Запасы, Покупки, Бюджет, Импорт покупки, Магазины.
2. **Deep links** to removed routes redirect to `/plan` (no crash).
3. **Soft-retain** snapshot fields: `pantryItems`, `shopping*`, `productPrices`, `foodBudgets`, `foodExpenses`, `purchases`, `purchaseLines`, `storePreferences`, `MealPlan.budgetRub`. Export/restore unchanged; no schema wipe in this slice.
4. **Eat Now** stays: candidates from recipes, cooked batches, favorites/frequent/user products. No RemainingStrip, no `at_home` / `to_buy` filters, no pantry coverage badges (also drop badges on Recipes list).
5. **Replace receipt import** with **Мои продукты**: paste list of names → review → `createProduct` (`source: 'user'`, macros `null` unless user fills). Never invent kcal.
6. **Week menu** stays; detach shop CTA and budget composer field from UI (model may still hold `budgetRub` for restore).

## Consequences

- Closed loop purchase→pantry→budget is paused in product; domain/tests for those modules may remain until a later cleanup ADR.
- Eat Now quality depends on recipes + personal catalog, not fridge stock.
- Follow-up: optional hard-delete of unused tables after dogfood confirms no restore need.
