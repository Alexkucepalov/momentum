# UX-01 — Single food logging pipeline

| Field | Value |
|-------|--------|
| Issue | #96 |
| Status | Implemented (code) + this state matrix |
| Scope | Logging only — not Eat Now / Plan tab |

## Goal

Today and Food use the **same** path: pick item → **ConfirmPortionSheet** → save `FoodEntry`.

## Entry points → pipeline

| Entry | Screen | Opens | Default grams |
|-------|--------|-------|----------------|
| Footer «Добавить еду» | Today / Food | `AddFoodSheet` → Confirm | product: `lastGramsForProduct` ?? 100; recipe: `lastGramsForRecipe` ?? min(200, yield) |
| Favorite chip | Today | Confirm | last product grams ?? 100 |
| Catalog + / open | Food | Confirm | same defaults via `defaultPortionGrams` |
| Recent / repeat row | Food / AddFood | Confirm (not silent re-log) | entry.grams |
| Barcode | Today / Food / AddFood | Confirm | last product grams ?? 100 |
| Recipe detail «порция» | Recipes | Confirm | (unchanged sheet; same Confirm component) |

## State matrix

| State | Behavior |
|-------|----------|
| Loading | N/A (local) |
| Empty recent | Hide recent block; Add still works |
| Unknown macros | Confirm shows «—»; save keeps null (≠ 0) |
| Error grams | Confirm validation; no write |
| Undo | Existing soft-delete / undo bar where present |
| Double-tap | `createAddGuard` / `allowAdd` |

## Identical result rule

Same `productId`/`recipeId` + same `grams` + same `meal` + same `dateLocal` → same macros via `addEntryFromProduct` / `addEntryFromRecipe` (snapshot rules unchanged).

## Out of scope

UX-02 Today fold declutter · UX-04 Plan tab · UX-05 snackbar polish · Eat Now scoring.
