# Issue Register — Problems & Opportunities

**HEAD:** `1da2d0ac` · Audit 2026-10-24  
**Not** auto-filed as GitHub issues. Severity P0–P3. Effort: S/M/L/XL.

Legend: **Bug** · **UX** · **Missing** · **Data** · **Arch** · **Opportunity** · **External**

---

## 1. Confirmed bugs

| ID | Component | User problem | Evidence | Sev | Freq | Impact | Conf | Effort | Deps | Suggested | AC | Test | Risk | Founder? |
|----|-----------|--------------|----------|-----|------|--------|------|--------|------|-----------|----|------|------|----------|
| PI-BUG-01 | Android durability | Fear data loss after kill | #36 open; no Pass | P0 | Dogfood | High | High | M | Device | Run protocol; fix if fail | Protocol green | Device | Regress persist | No |
| PI-BUG-02 | Purchase preview layout | Horizontal overflow / clip | Was P0; #72/#75 web after/ | P1* | Import users | High | Med | S | — | Re-verify Android 320dp | No overflow device | Screenshot A | Layout | No |
| PI-BUG-03 | Recipe KBJU display | Different kcal same recipe | #72 seed; still watch paths | P1 | Recipe users | Med | Med | M | recipeNutrition | Single source display | Same number detail/log | Unit+UI | Nutrition trust | No |

\*Web mitigated; treat as **regression watch** until Android evidence.

---

## 2. UX friction

| ID | Component | User problem | Evidence | Sev | Effort | Class | Suggested | Founder? |
|----|-----------|--------------|----------|-----|--------|-------|-----------|----------|
| PI-UX-01 | IA Today/Food | Duplicate log intent | Routes + pack | P1 | L | UX | Unify composer | Yes (IA) |
| PI-UX-02 | Plan hub | Second app feeling | `plan/index` + `20.png` | P1 | M | UX | Contextual entry | Yes |
| PI-UX-03 | Pantry | Form > inventory | `22`/`52b` | P1 | M | UX | List-first | No |
| PI-UX-04 | Week menu | Overcrowded | `54` + #77 partial | P1 | M | UX | View/edit already; denser declutter | No |
| PI-UX-05 | Eat Now | Weak suggestions | Empty/filled pack; data dep | P1 | M | UX | Today entry + better empty | No |
| PI-UX-06 | Budget | Opaque forecast | Pack; #74 ≥7d | P1 | S | UX | Completeness meter | No |
| PI-UX-07 | Recipe create | Triple entry | new/import-text/personal | P2 | M | UX | One funnel | No |
| PI-UX-08 | Stores | Useless alone | `26.png` + adapter | P2 | S | UX | Hide/defer | Yes |
| PI-UX-09 | Long forms | Abandon create | Recipe/budget/pantry | P2 | M | UX | Progressive disclosure | No |
| PI-UX-10 | Technical copy | Non-user language | Eat Now/budget strings HYP | P2 | S | UX | Rewrite microcopy | No |

---

## 3. Missing flows

| ID | Problem | Evidence | Sev | Effort | Suggested |
|----|---------|----------|-----|--------|-----------|
| PI-MISS-01 | First-run goals onboarding | Empty Today pack | P1 | M | Goals sheet |
| PI-MISS-02 | Measured ≤10s re-log | #37 open | P1 | M | Instrument + fix path |
| PI-MISS-03 | Android Visual Audit A | VISUAL-AUDIT-PACK | P1 | M | Capture device PNGs |
| PI-MISS-04 | OCR device accuracy study | #85 shipped; no study | P2 | L | Synthetic+real eval |
| PI-MISS-05 | Local analytics counters | No SDK | P3 | M | Opt-in local metrics |

---

## 4. Data quality

| ID | Problem | Evidence | Sev | Effort | Suggested |
|----|---------|----------|-----|--------|-----------|
| PI-DATA-01 | Shopping duplicate lines | Alias match HYP | P2 | M | Stronger merge + tests |
| PI-DATA-02 | Incomplete prices → budget lie | Budget domain | P1 | M | Show % priced |
| PI-DATA-03 | Double purchase confirm dupes | HYP | P2 | M | Idempotency key |
| PI-DATA-04 | Raw vs cooked confusion | Types + UI | P1 | M | Labels everywhere |
| PI-DATA-05 | Stale pantry | No expiry UX | P2 | M | Soft staleness |

---

## 5. Architecture risks

| ID | Problem | Evidence | Sev | Effort | Suggested | Founder? |
|----|---------|----------|-----|--------|-----------|----------|
| PI-ARCH-01 | Full-snapshot persist scale | foodRepository + benches | P1 | XL | Incremental/relational | Yes if migrate |
| PI-ARCH-02 | God repository | 3334 LOC | P2 | XL | Split modules | No for split plan |
| PI-ARCH-03 | Global revision re-renders | DataContext | P2 | M | Selective subscriptions | No |
| PI-ARCH-04 | Non-virtualized lists | PERFORMANCE-BASELINE | P2 | M | FlatList | No |
| PI-ARCH-05 | APK size OCR models | ~200MB+ dogfood | P2 | L | Lazy download | Yes |

---

## 6. Product opportunities

| ID | Opportunity | Class | Sev/Value | Effort | Founder? |
|----|-------------|-------|-----------|--------|----------|
| PI-OPP-01 | Closed loop plan→shop→pantry→eat | Improve | High | L | Yes priority |
| PI-OPP-02 | One-tap recent breakfast | Improve | High | S | No |
| PI-OPP-03 | On-device OCR as privacy moat | Improve | High | M | Yes messaging |
| PI-OPP-04 | Calendar-first week | Simplify | Med | M | No |
| PI-OPP-05 | Challenges removal/hide | Hide | Low | S | Yes |

---

## 7. External integration blockers

| ID | Blocker | Evidence | Sev | Notes | Founder? |
|----|---------|----------|-----|-------|----------|
| PI-EXT-01 | Retail scrape/partner catalogs | storeCatalogAdapter; FI analysis | P1 product | Needs BD | **Yes** |
| PI-EXT-02 | Cloud OCR Cyrillic | Docs #84 chose on-device | — | Policy | Yes if revisit |
| PI-EXT-03 | Telemetry backend | None | P3 | Privacy | Yes |
| PI-EXT-04 | Play production release | AGENTS | — | Human only | **Yes** |

---

## Frequency estimates

Only where justified: dogfood founder is primary user now → **freq = dogfood sessions**, not consumer scale. Do not invent MAU.

---

## Mapping to open GitHub issues

| GitHub | Register |
|--------|----------|
| #36 | PI-BUG-01 |
| #37 | PI-MISS-02 |
| #38 | PI-MISS-03 (partial) |
| #52/#55 | tokens/copy polish → PI-UX-10 adjacent |
