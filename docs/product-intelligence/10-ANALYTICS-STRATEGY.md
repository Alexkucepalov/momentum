# Privacy-First Analytics Strategy

**HEAD:** `1da2d0ac`  
**Constraint:** Offline-first · no server telemetry assumed · **do not ship SDK without founder approval**.

---

## Principles

1. Prefer **on-device counters** and founder-visible export.  
2. No health payloads, receipt text, or free-text meals off-device.  
3. Aggregate only (counts, durations buckets).  
4. User-exportable diagnostics file (opt-in).  
5. Dogfood: manual stopwatch + checklists remain valid until infra exists.

---

## Metric definitions (PROPOSED)

| Metric | Definition (local) | PII risk |
|--------|--------------------|---------|
| Time to first food log | ms from first open to first `FoodEntry` | Low if bucketed |
| Time to repeat food | ms / taps from Today open to re-log | Low |
| Search success rate | selects / searches | Low |
| Search zero-results rate | zero-hit searches / searches | Low |
| Recipe create completion | saves / start create | Low |
| Recipe import correction rate | edited lines / parsed lines | Low |
| Purchase import correction rate | same for purchase | Low |
| Pantry matching success | auto-matched lines / lines | Low |
| Eat Now accept | suggestion→log / views | Low |
| Weekly menu completion | activate / start draft | Low |
| Shopping completion | done items / items | Low |
| Budget usage | spent/limit when both set | Medium — keep local |
| Error frequency | caught error codes count | Low |
| Feature discovery | first open of route | Low |
| Task completion | journey success flags | Low |

---

## What is already measured

| Kind | Status |
|------|--------|
| Product telemetry events | **None** in production code (FACT — no analytics SDK wired for JTBD) |
| Node perf benches | Yes — developer only |
| CI test counts | Yes |
| Visual pack | Qualitative |
| Dogfood protocols | Manual (#36–#38) |

---

## What can be measured locally (no network)

1. In-memory / SQLite table `local_metrics` (would need implementation — **not in this audit**).  
2. Profile export include metrics blob.  
3. Debug screen for founder dogfood.  
4. Stopwatch scripts in `docs/quality/SMOKE-CHECKLIST.md`.

---

## What needs new infrastructure

| Need | Infra | Approval |
|------|-------|----------|
| Cross-user aggregates | Backend or privacy CRDT | Founder |
| Crash reporting | Sentry-like | Founder + privacy review |
| Funnel across reinstalls | Account sync | Out of scope now |
| OCR quality labeling | On-device eval set | Founder |

---

## What cannot be known from code alone

- Real user timing ≤10s  
- Emotional reaction to Eat Now quality  
- Whether Stores confusion is frequent  
- OCR accuracy on messy screenshots  
- Whether budget forecast trust collapses  

---

## Event sketch (local only, PROPOSED)

```
app_open
targets_set
food_log_create { source: recent|search|manual|recipe|eat_now }
search_query { hit_count_bucket }
recipe_create_start / recipe_create_save
purchase_parse_start / purchase_confirm
eat_now_view / eat_now_accept
plan_activate
export_backup / restore_backup
error { code }
```

**Forbidden in events:** names, macros values, raw OCR text, barcodes full strings (hash optional).

---

## Rollout recommendation (PROPOSED)

Phase 0: manual dogfood metrics (#36–#38).  
Phase 1: local counters + export (human approval).  
Phase 2: optional anonymized weekly summary share — **only if founder wants**.
