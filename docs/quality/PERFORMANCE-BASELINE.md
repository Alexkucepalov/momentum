# Performance Baseline

**Политика:** не заявлять device/emulator Pass без прогона.  
Node benches: `npm run perf:bench` · fixtures: `npm run perf:fixtures`.

---

## What was / was not measured

| Item | Status | Env |
|------|--------|-----|
| Unit `npm run verify` | Pass (~273 tests, 2026-11-01) | CI/local Node |
| Node microbenches D100/D1k/D10k | **Re-run 2026-11-01** (Stage 10) | Node (see table) |
| Catalog FlatList virtualization | **In code** (`CATALOG_VIRTUALIZE_THRESHOLD = 24`) | UI — jank **Not run** on device |
| Cold/warm start Android | **Not run** | — |
| Repeat meal ≤10s | **Not run** | protocol: #37, `DEVICE-DOGFOOD-15MIN.md` |
| Kill-app durability | **Not run** | protocol: #36 |
| Maestro smoke | Skeleton only | `maestro/food-add-smoke.yaml` |
| FlatList jank (P1k/P10k UI) | **Not run** | Hypothesis until device |

---

## Node results (2026-11-01)

Machine: founder/dev host · `node` via `npm run perf:bench`.  
**Not** Android. Includes seeded catalog products (common food merge).

| Metric | D100 | D1k | D10k |
|--------|------|-----|------|
| Entries | 100 | 1000 | 10000 |
| Snapshot JSON bytes | ~109 KB | ~477 KB | ~3.8 MB |
| serialize P50 / P95 (ms) | 0.17 / 0.35 | 0.68 / 1.23 | 5.8 / 7.1 |
| dailyTotals P50 / P95 (ms) | 0.003 / 0.019 | 0.017 / 0.032 | 0.13 / 0.18 |
| unifiedSearch "ов" P50 / P95 (ms) | 0.19 / 0.23 | 0.20 / 0.24 | 0.30 / 0.37 |
| seed build P50 (ms) | ~1.1 | ~2.0 | ~11.5 |

### Interpretation (honest)

- Search/totals on Node stay fast even at D10k for these microbenches.
- **Serialize ~3.8 MB @ ~6–7 ms P50/P95 on Node** (faster host than 2026-10-20) — full-snapshot persist still scales with history; **device UI-thread impact still Hypothesis** until measured on Android (`Q-P0-01`).
- Search P95 at D10k (~0.4 ms Node) ≪ 300 ms guide — **does not** prove UI list jank.
- Catalog now uses `FlatList` with windowing above 24 rows; diary day lists stay in `FormScrollView` (typically short).

Raw JSON: re-run `npm run perf:bench` (do not commit huge fixture dumps).

---

## Architectural risk signals (code)

| Risk | Evidence | Stage 10 note |
|------|----------|---------------|
| Full-snapshot persist | `expoFoodStore.native.ts` | Unchanged — needs device timing |
| Catalog list growth | `FoodCatalogList` FlatList + threshold 24 | Virtualization **shipped**; jank unmeasured |
| Global `revision` re-render | `DataContext` | Unchanged |
| Diary meal sections in ScrollView | `food.tsx` diary segment | OK for typical day size; do not FlatList without hotspot |

---

## Target guides (not claimed)

| Metric | Guide |
|--------|-------|
| Repeat meal E2E | ≤10s device |
| Local search P95 | ≤300ms |
| Warm start | <2s (proposal) |

---

## Device / emulator table (fill when run)

| Scenario | Env | P50 | P95 | n | Build | Notes |
|----------|-----|-----|-----|---|-------|-------|
| Cold start | | | | | | pending |
| Warm start | | | | | | pending |
| Repeat recent E2E | | | | | | #37 · Stage 11 human |
| Open AddFoodSheet | | | | | | pending |
| SQLite write (persist) | | | | | | #36 |
| Kill + relaunch | | | | | | #36 |
| Catalog scroll jank | | | | | | Stage 10 code ready |

---

## Synthetic datasets

`npm run perf:fixtures` → `scripts/perf/fixtures/*.json` (gitignored).  
Sizes: D0, D100, D1k, D10k.
