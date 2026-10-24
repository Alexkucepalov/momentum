# Quality & Test Coverage

**HEAD:** `1da2d0ac` · Audit 2026-10-24

---

## Layers

| Layer | What | Status |
|-------|------|--------|
| Unit / domain Node | **44** suite `.mjs` + `loadTsModules.mjs` helper | Primary safety net |
| `npm run verify` | typecheck + test + security + mobile tsc | Gate before PR |
| Expo web Visual Audit | 47 PNG + after/ | OBSERVED UX evidence |
| Maestro | `maestro/food-add-smoke.yaml` skeleton | Not Pass |
| Android device | #36–#38 open; APK `dogfood_gate: pending` | **Missing Pass** |
| E2E matrix | `docs/quality/E2E-TEST-MATRIX.md` | Spec > execution |

---

## Domain coverage (strong)

**44 suites** under `tests/` (FACT inventory from audit explore), including:

- `nutrition` / `nutrition-consistency` / `nutrition-flow-sprint2` — unknown≠0  
- `eat-now` / `eat-now-pool` — scorer + pool  
- `purchase-import` / `match-purchase-product` / `fi-grocery-to-meal` / `clean-ocr-purchase-text`  
- `shopping` / `shopping-reconcile` / `pantry` / `meal-plan`  
- `parse-recipe-text` / `recipe-detail` / `recipe-pantry-coverage` / `cook-again`  
- `food-budget` / `budget-projection`  
- `weight-delete` / `weight-trend` / `repeat-meal` / `unified-food-search`  
- `food-repository` / `import-export` / `add-guard` / `dispatcher`  

Historical verify run sizes: ~172–213+ tests (PERFORMANCE-BASELINE / PR notes).

---

## UI coverage (weak)

- Few/no React Native component unit tests.  
- Visual pack is **manual/regression screenshots**, not assertions.  
- Web ≠ Android rendering.

---

## Open quality GitHub issues (FACT 2026-10-24)

| # | Title | Labels |
|---|-------|--------|
| 36 | Persist & kill-app durability | p0, dogfood |
| 37 | Measure repeat-meal ≤10s | p1, dogfood |
| 38 | Android UI smoke | p1, dogfood |
| 52 | Design tokens sync | p1, quality |
| 55 | Profile secondary links | p1, quality |
| 10 | Founder daily ritual docs | p1 |

---

## Recent quality merges (sample)

#72 preview overflow · #73 Eat Now · #74 shop/budget/week · #75 border-box · #77 week edit · #80 catalog search · #82 purchase→catalog · #83 shop from recipe · #85 OCR · #87 weight UX · #88 APK meta.

---

## Missing tests (priority themes)

| Gap | Risk |
|-----|------|
| Android kill-app | Data loss fear |
| Repeat ≤10s timing | North-star unproven |
| Purchase preview layout at 320dp Android | Overflow regression |
| Alias merge shopping dupes | Data quality |
| OCR end-to-end on device | Feature trust |
| Race: double confirm purchase | Dup pantry/expenses |
| Large snapshot persist on device | Jank |

---

## Security / privacy tests

- No real health/receipt data in fixtures (policy).  
- Secrets scan as part of verify (as configured).  
- Do not enable Dispatcher / auto-merge for product changes without human.

---

## Verdict

**Domain logic: relatively well tested.**  
**Product reliability on Android: not evidenced.**  
Quality freeze remains open until dogfood Pass issues close.
