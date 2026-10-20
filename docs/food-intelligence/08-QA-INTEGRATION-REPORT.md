# FI Quality Sprint — Grocery-to-Meal integration report

**Date:** 2026-10-21 · **Issue:** #67 · **Branch:** `feat/67-fi-quality-sprint`  
**Scope:** slices 1–4 chain only. **Android dogfood: not executed → scenario not Pass.**

## Chain under test

Покупка (paste) → Запасы → Eat Now / Recipes coverage → Меню → Недостающее → Бюджет.

## Method

1. Synthetic pastes: `docs/fixtures/synthetic-purchases.json` (Пятёрочка, Чижик, METRO, Самокат).  
2. Integration tests: `tests/fi-grocery-to-meal.test.mjs`.  
3. Parser probe + defect fixes in `parsePurchasePaste` / `resolveExpenseAmountRub`.  
4. UX walkthrough: code-path review (no device Pass claimed).

## Grocery-to-Meal checklist (product)

| # | Step | Automated | Device |
|---|------|-----------|--------|
| 1 | Paste real-order text | Partial (synthetic) | Pending |
| 2 | Correct lines + confirm | Domain + UI exists | Pending |
| 3 | Items in pantry | Tests | Pending |
| 4 | Eat Now useful options | Coverage wired (#63) | Pending |
| 5 | Recipe missing ings | Tests | Pending |
| 6 | Multi-day menu | Tests | Pending |
| 7 | Shop without stock | Tests | Pending |
| 8 | Budget three metrics | Tests | Pending |

**0/8 device Pass.** CI green ≠ usable product.

## Defects found & disposition

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| D1 | Med | «Скидка …» parsed as food line (`\b` broken on Cyrillic) | Skip discount lines + warning |
| D2 | Med | `~0,85 кг` weight not parsed | Optional `~` in qty |
| D3 | Med | Bare `Итого:` became product «Итого:» | Meta total without amount |
| D4 | Med | `2 шт × 79` lost qty | Mult pattern; line total = unit×count for pcs |
| D5 | High | Partial line prices summed into expense (fake “complete” spend) | Expense only if `totalRub` set **or all** active lines priced |
| D6 | Low | Trailing `—` without price left junk in name | Strip orphan dash; keep qty |

## Invariants checked (automated)

- snapshot **v14**  
- re-import → duplicate error; pantry/expense counts unchanged  
- `unknown ≠ 0` for null prices / null expense / incomplete eaten cost  
- planned meals do not increase diary entry count  
- recipe macro edit after log does not change entry snapshot kcal  
- shop list persists only `needToBuy > 0`  
- budget projection label never contains «сегодня»

## Remaining product risks (not fixed here)

| Risk | Notes |
|------|-------|
| Exact name match only | «Хлеб» ≠ «Хлеб белый» — OK for honesty; UX may frustrate |
| Order `totalRub` includes fees | Самокат: pantry excludes delivery; expense uses order total (actual money) — document in UI |
| Eat Now usefulness | Needs device judgment with real pantry mix |
| Offline draft purchases | Preview is in-memory until confirm — OK for slice 1 |
| Persistence after kill | Needs Android smoke (`09-ANDROID-E2E-SMOKE.md`) |

## UX walkthrough (static)

| Transition | Status |
|------------|--------|
| План → Импорт покупки | Hub + stores CTA |
| Preview exclude / null price | Present |
| Confirm → flash pantry+₽ | Present |
| Recipes badge «N/M дома» | Only if pantry non-empty |
| Shop «только недостающее» | Default on |
| Budget three labels | Actual / projected / eaten |

Empty/error: empty paste, duplicate confirm, incomplete forecast — covered in copy/tests; device still required for a11y/keyboard.

## Commands

```bash
npm run verify
node --test tests/fi-grocery-to-meal.test.mjs
```

## Verdict

**Integration quality improved; product scenario not complete** until Android dogfood of the 8-step script passes on a physical device with the dogfood APK.
