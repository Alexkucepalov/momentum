# Double-submit guard inventory (Q-P0-02)

**Updated:** 2026-10-20 (Sprint 1)

| Path | Guarded? | Notes |
|------|----------|-------|
| Today recent repeat | yes | `index.tsx` |
| Today copy yesterday | yes | fixed Sprint 1 |
| Today portion confirm | yes | |
| Food repeat / repeat meal slot | yes | |
| Food portion confirm | yes | |
| `CopyYesterdayButton` | yes | fixed Sprint 1 |
| AddFoodSheet recent/search/manual | yes | |
| AddFoodSheet saved meal / quick | yes | fixed Sprint 1 |
| Eat Now diary confirm | yes | |
| TodayPlanStrip «Съел» | yes | fixed Sprint 1 |
| Week plan «В дневник» | yes | fixed Sprint 1 |
| Barcode ConfirmPortion | yes | fixed Sprint 1 |
| Recipe detail → diary | yes | fixed Sprint 1 |
| Eat Now «В план» | n/a | not diary add |

Unit: `tests/add-guard.test.mjs` (`createAddGuard`).  
Manual: 5 rapid taps → ≤1 entry — see SMOKE-CHECKLIST.
