# Performance & Reliability

**HEAD:** `1da2d0ac` · Source: `docs/quality/PERFORMANCE-BASELINE.md` + code inspection  
**Policy:** Do not invent Android Pass or user timings.

---

## Metric table

| Metric | Target (guide) | Measured | Environment | Evidence | Status |
|--------|----------------|----------|-------------|----------|--------|
| `npm run verify` | Green | Pass historically (172–213+ tests) | Node CI/local | PERFORMANCE-BASELINE, PR notes | OK (re-run per release) |
| Snapshot serialize D10k P50/P95 | — | ~12.3 / 36.3 ms | Node 2026-10-20 | PERFORMANCE-BASELINE | Measured Node only |
| Snapshot size D10k | — | ~3.8 MB | Node | same | Measured |
| dailyTotals D10k P95 | — | ~1.1 ms | Node | same | Measured |
| unifiedSearch "ов" D10k P95 | ≤300 ms guide | ~11.2 ms | Node | same | Measured Node; UI UNVERIFIED |
| Cold start Android | <2s proposal | — | — | — | **Not run** |
| Warm start Android | — | — | — | — | **Not run** |
| Repeat meal ≤10s | ≤10s | — | Device | issue #37 | **Not run** |
| Kill-app durability | Survive | — | Device | issue #36 | **Not run** |
| Maestro smoke | Pass | Skeleton only | `maestro/food-add-smoke.yaml` | — | **Not run** |
| FlatList jank | Smooth | — | — | ScrollView catalog risk | **Not run** |
| OCR first inference | Usable | — | Device | #85 | **UNVERIFIED** |
| Export/restore roundtrip | Lossless v14 | Covered partly in tests | Node | importExport tests | Partial |

---

## Inventory notes

### Startup

App loads snapshot from SQLite → hydrate repository. Large payload parse cost grows with history (**HYPOTHESIS** on device).

### Rendering

`DataContext` revision may re-render broad trees. Dense Today/week screens.

### Search

Domain `unifiedFoodSearch` fast on Node; UI list virtualization status: risk if mapping full arrays in ScrollView (PERFORMANCE-BASELINE).

### SQLite writes

Full JSON replace of `store_snapshot` row — simple, durable design TBD (#36).

### Crash recovery

Single-row payload: last successful write wins. Mid-write corruption UNVERIFIED.

### Offline

Core diary/recipes/plan work offline. OCR model download may need network once. Retailer APIs N/A.

### Background/resume

UNVERIFIED Android lifecycle.

### Export/restore

`importExport` domain + Profile UI. Version skew risk documented in journeys.

---

## Android-only tests not yet executed

1. Issue **#36** — persist & kill-app durability protocol  
2. Issue **#37** — measure repeat-meal ≤10s  
3. Issue **#38** — Android UI smoke (Maestro or manual)  
4. Visual Audit Pack column **A** (`android-device/`)  
5. TalkBack / a11y Pass  
6. Safe-area / keyboard avoidance on physical device  
7. OCR accuracy on real Samokat/METRO screenshots (synthetic only in CI)  
8. Dogfood APK install smoke from `DOGFOOD-APK.md` on founder phone (`dogfood_gate: pending`; APK ~210–220MB, build includes #85 OCR + #87 weight)  

---

## Safe diagnostic (this audit)

Documentation-only pass. Re-running `npm run perf:bench` is allowed but not required for conclusions above (prior 2026-10-20 numbers cited). No destructive migrations performed.
