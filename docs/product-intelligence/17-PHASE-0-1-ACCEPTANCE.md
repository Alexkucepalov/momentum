# Phase 0–1 — Detailed Acceptance Criteria

| Field | Value |
|-------|--------|
| **Source** | [`15-MOMENTUM-2.0-VISION-AND-ROADMAP.md`](./15-MOMENTUM-2.0-VISION-AND-ROADMAP.md) |
| **IA** | [`16-TARGET-IA.md`](./16-TARGET-IA.md) |
| **Rule** | Android tasks ≠ done on Node-only evidence |
| **First batch** | Q-01, Q-02, Q-04, Q-05, UX-01 (design), UX-03 (spec), FI-01 (spec) |

Each task: user problem · AS-IS · TO-BE · data constraints · AC · tests · risks · deps · agent scope lock.

---

## Phase 0 — Reliability

### Q-01 — Persist & force-stop (#36)

| Field | Content |
|-------|---------|
| **Type** | QA · Android required |
| **User problem** | Fear of losing diary after kill |
| **AS-IS** | Protocol open; Pass not claimed (`07`, #36) |
| **TO-BE** | Confirmed durability on dogfood APK |
| **Data** | Synthetic entries only |
| **AC** | 1) Install APK from `DOGFOOD-APK.md`. 2) Create ≥5 diary entries + 1 water + 1 weight. 3) Force-stop → relaunch × **20**. 4) All entities present; totals match. 5) Results logged in `docs/quality/` with device model, OS, APK sha256, git SHA. |
| **Tests** | Device protocol checklist; optional Maestro after manual Pass |
| **Risks** | Flaky OEM kill; false Pass if only backgrounding |
| **Deps** | Physical device or AVD with force-stop |
| **Scope lock** | No persist architecture rewrite in this task |

### Q-02 — Repeat logging ≤10s (#37)

| Field | Content |
|-------|---------|
| **Type** | QA · Android required |
| **User problem** | North-star speed unproven |
| **AS-IS** | Recent/quick paths exist; timing UNVERIFIED |
| **TO-BE** | Measured median on device |
| **AC** | 1) Warm app, day with ≥3 recent. 2) Stopwatch from Today visible → confirmed re-log. 3) **n≥20**, report median/P95, exclude first cold. 4) Pass if median **≤10s**; else file bug with funnel screenshot steps. 5) Record build + device. |
| **Tests** | Timing log sheet in quality docs |
| **Risks** | Slow device; OCR models cold start unrelated — exclude OCR path |
| **Deps** | Q-01 preferred first (trust data) |
| **Scope lock** | Measurement only unless clearly blocked by one-line bug |

### Q-03 — Android UI smoke (#38)

| Field | Content |
|-------|---------|
| **Type** | QA · Android |
| **AC** | Critical paths from `SMOKE-CHECKLIST` / E2E matrix: Today log, Food search, recipe open, plan eat-now open, receipt paste preview, progress weight. Pass/fail per row on device. Visual Audit column A optional same session. |
| **Deps** | Dogfood APK |
| **Scope lock** | No feature work |

### Q-04 — Purchase Preview overflow regression

| Field | Content |
|-------|---------|
| **Type** | Bug · Cursor + Android verify |
| **User problem** | Preview unusable on narrow phones |
| **AS-IS** | Mitigated web #72/#75; Android UNVERIFIED |
| **AC** | 1) Synthetic long product names + prices. 2) Preview at **320 / 360 / 390** dp: no horizontal page scroll; inputs fully visible; confirm reachable. 3) Web pack after/ still OK. 4) Regression test or screenshot fixture if feasible without device farm. |
| **Tests** | Layout unit/snapshot if present; device screenshots |
| **Risks** | Web≠Android fonts |
| **Scope lock** | Preview layout only |

### Q-05 — Recipe KBJU consistency

| Field | Content |
|-------|---------|
| **Type** | Bug · Cursor |
| **User problem** | Same recipe shows different kcal |
| **AS-IS** | Partial #72; multiple UI paths |
| **Data** | Declared per-100g vs ingredient-derived — **one documented policy** |
| **AC** | 1) ADR/comment in domain: precedence (e.g. finished per-100g if set, else ingredients/yield). 2) Detail, portion modal, Eat Now, diary log show **same** kcal for same grams (±0.5 rounding). 3) Unit tests cover both branches. 4) No inventing macros. |
| **Tests** | Extend `recipe-detail` / `recipeNutrition` / UI-facing helpers |
| **Deps** | None |
| **Scope lock** | Display + calculation consistency; no recipe UX redesign |

### Q-06 — OCR accuracy on real order screenshots

| Field | Content |
|-------|---------|
| **Type** | QA / research · Android |
| **AC** | 1) Labeled synthetic+real (founder-owned) screenshot set (≥10). 2) Metrics: line recall, qty/price error rate. 3) Doc: what works / fails; **no** «100% works» claim. 4) Feeds D4. |
| **Scope lock** | Measurement + report; no cloud OCR |

### Phase 0 gate

- Q-01 Pass or blocking bug filed with severity.  
- Q-02 measured (Pass or explicit miss + follow-up issue).  
- Q-04/Q-05 merged or Waived with evidence.  
- Q-03/Q-06 can trail slightly but must be scheduled before Phase 5 pilot.

Android gate **does not** block wireframes for Phase 1.

---

## Phase 1 — Daily experience & navigation

### UX-01 — Single food logging flow (design → impl)

| Field | Content |
|-------|---------|
| **Type** | UX · design first in batch |
| **User problem** | Today vs Food feel like different apps for same intent |
| **AS-IS** | Separate entry points; risk of divergent defaults |
| **TO-BE** | One pipeline: search/recent → portion → meal → save |
| **AC (design)** | Wireframe + state matrix: entry points, defaults (grams, meal slot), error, undo. |
| **AC (impl)** | 1) Same components/handlers. 2) Same resulting `FoodEntry` fields for identical user inputs. 3) Tests for default grams from last entry (ties UX-05). 4) A11y labels preserved. |
| **Deps** | D2 optional for tabs; can ship shared sheet before tab swap |
| **Scope lock** | Logging pipeline only — no Eat Now algorithm |

### UX-02 — Simplify Today

| Field | Content |
|-------|---------|
| **AC** | First viewport: (1) KBJU status, (2) **one** primary action, (3) recent foods. Habits/water/plan below fold or compact. No Plan hub link farm. Visual Audit Today re-capture web+Android. |
| **Deps** | UX-01 defaults |
| **Scope lock** | Today layout/IA of fold only |

### UX-03 — First-run targets UX (spec → impl)

| Field | Content |
|-------|---------|
| **Type** | UX spec in first batch |
| **AC (spec)** | Flow: optional goals sheet; skip allowed; copy explains degraded Eat Now/budget without shame. Fields: kcal + optional P/F/C. |
| **AC (impl)** | 1) Triggers once on empty targets. 2) Skip persists «dismissed» without inventing numbers. 3) Profile remains source of truth. 4) Test: skip vs set. |
| **Scope lock** | Goals onboarding only |

### UX-04 — Plan tab preparation

| Field | Content |
|-------|---------|
| **Deps** | **D2 founder approve** ([`16-TARGET-IA.md`](./16-TARGET-IA.md)) |
| **AC** | 1) Tab bar: Plan replaces Activity. 2) Redirect map in PR. 3) Activity under Progress + quick action. 4) All `/plan/*` reachable. 5) Workouts list/create still work. 6) QA-07 green. |
| **Risks** | Dogfood muscle memory — release notes |
| **Scope lock** | Navigation shell; no Week redesign (Phase 4) |

### UX-05 — Contextual quick repeat

| Field | Content |
|-------|---------|
| **AC** | 1) Re-log proposes **last grams** for that item. 2) User can edit before confirm. 3) Undo/soft-delete mistaken entry within session snackbar or existing undo. 4) Contributes to Q-02 timing. |
| **Deps** | UX-01 |
| **Scope lock** | Repeat path only |

### QA-07 — Navigation regression suite

| Field | Content |
|-------|---------|
| **AC** | Checklist covering: tabs, Plan children, Recipes, Progress→Activity, Profile export entry, deep links from Today. Run web + Android subset. Failures block UX-04 merge. |

### Phase 1 gate

- UX-01 implemented or scheduled behind approved design.  
- UX-02 Today fold matches AC.  
- UX-03 skip/set goals works.  
- UX-04 only after D2; QA-07 pass.  
- No expansion into Phase 2 algorithm in same PRs.

---

## First execution batch (ready for issues)

| ID | Ready for | Blocker |
|----|-----------|---------|
| Q-01 | Human + device | Device access |
| Q-02 | Human + device | Device access |
| Q-04 | Cursor agent | Then device confirm |
| Q-05 | Cursor agent | — |
| UX-01 | Cursor design/docs PR | Founder wireframe OK |
| UX-03 | Cursor spec PR | — |
| FI-01 | Spec only (Phase 2) | After diary correctness confidence |

**FI-01 preview (spec only now):** portion suggestion respects remaining macros or shows explicit exceed; no invented nutrition; tests for null targets / small remainder.  
Full spec: [`18-FI-01-EAT-NOW-PORTION-SPEC.md`](./18-FI-01-EAT-NOW-PORTION-SPEC.md).

---

## Agent rules for this backlog

1. One GitHub issue → one branch → one PR.  
2. Scope = AC only.  
3. `npm run verify` before PR.  
4. No Dispatcher auto-merge.  
5. No Play production.  
6. No retailer scrape.  
7. Synthetic data only.  
8. Mark `needs-human` if device-only.
