# Performance Baseline

**Политика:** не заявлять device/emulator Pass без прогона.  
Node benches: `npm run perf:bench` · fixtures: `npm run perf:fixtures`.

---

## What was / was not measured

| Item | Status | Env |
|------|--------|-----|
| Unit `npm run verify` | Pass (172 tests) | CI/local Node |
| Node microbenches D100/D1k/D10k | **Run 2026-10-20** | Node (see table) |
| Cold/warm start Android | **Not run** | — |
| Repeat meal ≤10s | **Not run** | protocol: #37, SMOKE-CHECKLIST |
| Kill-app durability | **Not run** | protocol: #36 |
| Maestro smoke | Skeleton only | `maestro/food-add-smoke.yaml` |
| FlatList jank | **Not run** | — |

---

## Node results (2026-10-20)

Machine: founder/dev host · `node` via `npm run perf:bench`.  
**Not** Android. Includes seeded catalog products (common food merge).

| Metric | D100 | D1k | D10k |
|--------|------|-----|------|
| Entries | 100 | 1000 | 10000 |
| Snapshot JSON bytes | ~65 KB | ~433 KB | ~3.8 MB |
| serialize P50 / P95 (ms) | (see run) | 0.67 / 14.6 | 12.3 / 36.3 |
| dailyTotals P50 / P95 (ms) | ~0.1 | 0.018 / 0.022 | 0.13 / 1.1 |
| unifiedSearch "ов" P50 / P95 (ms) | ~0.1 | 0.12 / 0.15 | 0.26 / 11.2 |
| seed build P50 (ms) | — | ~4 | ~31 |

### Interpretation (honest)

- Search/totals on Node stay fast even at D10k for these microbenches.
- **Serialize ~3.8 MB @ ~12–36 ms P50/P95 on Node** supports the audit risk that full-snapshot persist grows with history — **device UI-thread impact still Hypothesis** until measured on Android (`Q-P0-01`).
- Search P95 spike at D10k (~11 ms Node) still ≪ 300 ms guide — **does not** prove UI list jank.

Raw JSON: re-run `npm run perf:bench` (do not commit huge fixture dumps).

---

## Architectural risk signals (code)

| Risk | Evidence |
|------|----------|
| Full-snapshot persist | `expoFoodStore.native.ts` |
| No FlatList on catalog | Food catalog ScrollView maps |
| Global `revision` re-render | `DataContext` |

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
| Repeat recent E2E | | | | | | #37 |
| Open AddFoodSheet | | | | | | pending |
| SQLite write (persist) | | | | | | #36 |
| Kill + relaunch | | | | | | #36 |

---

## Synthetic datasets

`npm run perf:fixtures` → `scripts/perf/fixtures/*.json` (gitignored).  
Sizes: D0, D100, D1k, D10k.
