# FI Quality Sprint Report — Issue #67

**Date:** 2026-10-20  
**Scope:** Food Planner slices 1–4 (Eat Now, Pantry, Week Plan, Shopping, Budget)  
**Status:** ✅ Integration testing complete; E2E pending device dogfood

---

## Summary

Integration quality sprint for Food Planner features (FI-1 through FI-4). All acceptance criteria met:

- ✅ Snapshot v14 with `planned ≠ eaten` validation
- ✅ Synthetic retailer fixtures (Пятёрочка, Чижик, METRO, Самокат)
- ✅ Integration tests for dedupe, null prices, discounts, weight items, no double-write
- ✅ QA report with defect list (this document)
- 🟡 Android E2E smoke script (created, pending real device validation)
- ✅ Feasibility note for OCR/catalogs/privacy

---

## Test Coverage

### Integration Tests (`tests/integration/food-planner-quality.test.ts`)

**Passing:**
- `planned ≠ eaten`: Planned meals do not affect `dailyTotals()`
- `unknown ≠ 0`: Null prices and nutrition preserved through import/export
- Re-import dedupe: Products and recipes do not duplicate on snapshot re-import
- Pantry/expense no double-write: Adding pantry items does not create food expenses
- Weight-based items: Correctly handle price-per-kg and grams
- Discount processing: Final price reflects discount application
- Snapshot v14: Version, structure, and all FP entities present

**Synthetic Fixtures:**
- `tests/fixtures/retailers/pyaterochka-receipt.json` — 5 items, weight + discount mix
- `tests/fixtures/retailers/chizhik-receipt.json` — 4 items, null weight (eggs)
- `tests/fixtures/retailers/metro-receipt.json` — 4 items, premium brands, kg weights
- `tests/fixtures/retailers/samokat-receipt.json` — 5 items, fresh produce weights

---

## Defect List

### P0 — Must Fix Before Merge

None identified. All acceptance criteria tests pass.

### P1 — High Priority

#### DEF-FI-01: Missing price staleness warning in UI
**Severity:** Medium  
**Component:** Shopping list UI  
**Description:** When a `ProductPrice.observedOn` is older than 30 days, the UI should show a warning like "Цена от 15 сен — может устареть." Currently, `priceAsOf` is displayed but without a staleness flag.  
**Acceptance:** Shopping item card shows age-based warning when `observedOn < now - 30 days`.  
**Workaround:** User can manually re-check prices.  
**Fix PR:** Small UI-only change; suggest separate PR per AGENTS.md (no auto-merge).

#### DEF-FI-02: Pantry expiration date not validated
**Severity:** Medium  
**Component:** Pantry CRUD  
**Description:** `PantryItem.expiresOn` accepts any string; no validation that it's a valid YYYY-MM-DD or >= today. UI allows setting expiration in the past without warning.  
**Acceptance:** Validation rejects malformed dates; UI warns if `expiresOn < today`.  
**Workaround:** User discipline; data remains consistent.  
**Fix PR:** Add validation in `foodRepository.upsertPantryItem()` + UI warning.

### P2 — Nice to Have

#### DEF-FI-03: Shopping list does not merge identical normalized keys with different display names
**Severity:** Low  
**Component:** `aggregateShopping.ts`  
**Description:** If a recipe uses "Помидор" and another uses "Помидоры", they may not merge into one shopping line despite `normalizeShoppingName()` matching. Edge case with plural/singular variants.  
**Acceptance:** Advanced normalization (stemming/lemmatization) or accept as feature gap.  
**Workaround:** User manually combines lines or standardizes recipe ingredient names.  
**Fix PR:** Linguistics complexity; defer unless user reports confusion.

#### DEF-FI-04: Cooked batch creation without portion KBJU snapshot
**Severity:** Low  
**Component:** Pantry → "Отметить приготовленным"  
**Description:** When marking a recipe as cooked, the batch stores `initialYieldG` and `remainingG`, but does not snapshot the recipe's per-100g nutrition at that moment. If the recipe's `energyKcalPer100g` is later edited, past diary entries remain correct (snapshot is taken on `addEntryFromRecipe`), but the batch's implicit nutrition is lost.  
**Acceptance:** `CookedBatch` includes `nutritionPer100gSnapshot` if recipe has per-100g fields.  
**Workaround:** Recipe nutrition edits are rare; diary entries already have snapshots.  
**Fix PR:** Schema addition requires snapshot v15; defer unless user confusion arises.

### P3 — Observational

#### OBS-FI-01: No automated test for rapid-tap double-submit guard in Eat Now CTA
**Severity:** Info  
**Component:** Eat Now "В дневник" button  
**Description:** Integration tests cover `useAddGuard()` logic, but no automated test for rapid taps on the actual button. Manual QA or Maestro E2E needed.  
**Status:** Manual verification in E2E smoke script.

#### OBS-FI-02: Retailer fixture coverage limited to 4 chains
**Severity:** Info  
**Component:** Test fixtures  
**Description:** Only Пятёрочка, Чижик, METRO, Самокат covered. Missing Перекрёсток, Магнит, ВкусВилл, Красное&Белое (all exist as `StorePreferenceId` enum values).  
**Status:** Sufficient for sprint scope; expand fixtures if receipt import feature is added.

---

## Architecture & Privacy Notes

### `planned ≠ eaten` Invariant
**Validation:** `computeDailyTotals()` iterates only `FoodEntry`, never `PlannedMeal`. `PlannedMeal.status` transitions to `logged` when explicitly converted via `logPlannedMealToDiary()`, which creates a new `FoodEntry`. This ensures plans remain advisory-only until user confirms.

### `unknown ≠ 0` Invariant
**Validation:**
- `ProductPrice.priceRub`, `ShoppingItem.priceRub`: `number | null` — never coerced to 0.
- `FoodProduct` and `RecipeIngredient` nutrition fields: `number | null` — preserved through `addNutrition()` in `nutrition.ts`.
- `DailyTotals.hasUnknownFields`: `true` when any entry has `null` macros.

### Snapshot v14 Compatibility
**Migration:** `normalizeSnapshot()` and `StoreSnapshotAny` accept v1–v14. Backward-compatible; old snapshots upgrade on first load. No destructive migrations.

---

## E2E Smoke Script Status

**Created:** `maestro/food-planner-smoke.yaml`  
**Status:** 🟡 **Pending real device validation**  
**Rationale:** AGENTS.md forbids fake success claims. Script is syntactically complete but not run on physical Android hardware.  
**Next Step:** Founder dogfood on device; mark pass/fail in separate PR.

---

## Feasibility Research: OCR, OFF, Retailer Catalogs

See `docs/quality/FI-OCR-CATALOG-FEASIBILITY.md` for full analysis.

**Summary:**
- **OCR RU:** ML Kit / Tesseract possible; on-device offline; no PII upload; manual review required.
- **Open Food Facts:** Existing integration via `openFoodFacts.ts`; RU coverage limited; compliant with license.
- **Retailer Catalogs:** Legal/ToS barriers; no scraping allowed; manual user price entry only.
- **Privacy:** All local-first; no external data upload without explicit consent.
- **Costs:** OCR = free on-device; OFF API = free; paid AI services explicitly forbidden per AGENTS.md.

---

## Risk & Rollback

### Risks
1. **Snapshot v14 migration risk:** Minimal — version is additive; v13 snapshots auto-upgrade.
2. **Integration test flakiness:** Low — pure unit tests, no async/network/device dependencies.
3. **E2E pending device:** Medium — cannot claim green until real device pass; mitigated by explicit pending status.

### Rollback
- Revert PR to restore snapshot v13 (git revert).
- Tests are additive; no breaking changes to existing features.
- Fixtures are dev-only; no production impact.

---

## Recommendations for Next Sprint

1. **Fix DEF-FI-01 (price staleness)** in separate small PR — UI-only, low risk.
2. **Fix DEF-FI-02 (pantry expiration validation)** — domain + UI, medium risk.
3. **Device dogfood E2E smoke** — unblock with founder's physical Android device.
4. **Expand retailer fixtures** if receipt import feature is approved for next sprint.
5. **Monitor DEF-FI-03 (shopping merge)** for user confusion signals before investing in stemming.

---

## Acceptance Checklist

- [x] Synthetic retailer fixtures (Пятёрочка, Чижик, METRO, Самокат)
- [x] Integration tests: re-import dedupe, null prices, discounts, weight lines, pantry/expense no double-write
- [x] `planned ≠ eaten`; `unknown ≠ 0`; snapshot v14
- [x] QA report + defect list (this document)
- [x] Android E2E smoke script (pending device — no fake pass)
- [x] Feasibility note: OCR RU, OFF, retailer catalogs, privacy/consent, costs

**Status:** ✅ All acceptance criteria met. Ready for PR.
