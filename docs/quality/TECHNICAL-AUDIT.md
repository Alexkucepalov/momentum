# Technical Code Review

**Scope:** architecture & code inspection 2026-10-20.  
**Not:** runtime profiler, production traffic, secret scan beyond `npm run security:scan`.

---

## Architecture snapshot

```
UI (Expo Router) → DataContext(repo, revision) → FoodRepository (memory Maps)
                                                 ↓ persist hook
                                            SQLite single-row JSON snapshot
Domain pure functions ← used by repo & some screens (good)
```

**Strengths:** domain purity for nutrition/planner; `unknown ≠ 0` enforced in many paths; offline-first; no backend required.

**Weaknesses:** god-repo; snapshot writes; UI coupling to repo methods; limited virtualization.

---

## Findings (file-backed)

### 1. React rendering / revision fan-out

- **Where:** `apps/mobile/src/state/DataContext.tsx` — `refresh()` increments `revision`; screens `void revision` to force recompute.
- **Behavior:** any mutation re-renders all mounted consumers.
- **Risk:** jank as tree grows (**H** at scale).
- **Direction:** selectors / store subscription per screen; or React Query-like versioning per collection.

### 2. Hooks / callbacks

- Screens often inline lambdas in `.map` (Eat Now cards, Food catalog) — new refs each render.
- **Risk:** child memo useless; usually OK without memo.
- **Direction:** only memoize after measuring.

### 3. FlatList missing

- **Where:** Food catalog, pantry, eat-now, import-personal — `FormScrollView` + `.map`.
- **Risk:** 1k+ rows → memory + scroll (**H**).
- **Direction:** FlatList for catalog & diary entries first.

### 4. Large components

| File | LOC | Issue |
|------|-----|-------|
| `foodRepository.ts` | ~2760 | God object |
| `AddFoodSheet.tsx` | ~842 | UI + orchestration |
| `profile.tsx` | ~744 | Settings dump |
| `food.tsx` | ~514 | Mixed concerns |
| `import-personal.tsx` | ~500+ | Dense UI |

### 5. Domain vs UI

- Good: `nutrition`, `scoreEatNow`, `parseRecipeText`, `foodBudget`, `unifiedFoodSearch`.
- Smell: screens call many repo methods and reimplement labels/MEAL maps repeatedly.

### 6. SQLite / migrations

- **Where:** `expoFoodStore.native.ts`, `src/storage/migrations.ts`.
- **Model:** one `store_snapshot` row; version on JSON (`StoreSnapshot.version` 13).
- **Risk:** large payload; migrate-all-or-nothing; no partial crash recovery beyond last successful write (**H** verify atomicity of `runSync`).

### 7. N+1 / inefficient reads

- `food.tsx`: per-recipe `getRecipeIngredients` in loop — **E**.
- `listEntriesForDate` filters all entries — OK until D50k (**H**).

### 8. State structure

- Global `meal` + `dateLocal` shared Today/Food — powerful but surprising when switching tabs.
- Flash/undo separate — undo only wired for deletes primarily.

### 9. Race / async

- Barcode OFF fetch: cancel/XHR work landed historically — re-verify on device (**H**).
- Persist hook sync `runSync` on UI thread — long writes can hitch (**H**).

### 10. Errors

- Many `throw new Error` in repo → UI try/catch inconsistently; some alertMessage.
- **Direction:** Result types for user-facing mutations.

### 11. Persistence / restart

- Hook after mutations — **E** path exists.
- **E2E kill-app** not automated — matrix pending.

### 12. Offline-first

- Diary/recipes local — **E**.
- Barcode/OFF needs network; fallback titles exist — **E**.

### 13. Tests

- Strong domain coverage; weak UI/E2E.
- Snapshot version asserts scattered — bumped to 13.

### 14. Dependencies

- Expo 57 stack; camera for barcode — justified.
- No Detox/Maestro in repo.

### 15. TypeScript

- Strict in mobile + src; tests via transpile `loadTsModules.mjs`.
- `StoreSnapshotAny` legacy unions — careful migrations.

### 16. Privacy / security

- AGENTS rules solid; synthetic fixtures.
- Export includes all local data — user-triggered; confirm copy OK.
- `security:scan` filename-level — not full secret content scan (**E** script comment).

### 17. Domain invariants

| Invariant | Status |
|-----------|--------|
| unknown ≠ 0 | Generally enforced; budget/eaten cost incomplete flags | **E** |
| Entry snapshot | `addEntryFromProduct` snapshots macros | **E** tests |
| No invented kcal | Parser/import paths | **E** |
| Planned ≠ eaten | Explicit log CTA | **E** |
| Activity ≠ food offset | Documented in UI | **E** |

---

## Priority tech themes (for backlog)

1. **P0:** Prove persist atomicity + restart durability (E2E).
2. **P1:** Split AddFoodSheet; FlatList catalog; measure snapshot write.
3. **P2:** Decompose foodRepository by module (facade keep).
4. **P3:** Incremental SQLite schema ADR (human gate).
