# Screen-by-Screen UI/UX Audit

**HEAD:** `1da2d0ac` · Evidence: Expo web Visual Audit Pack **47 PNG** (`docs/quality/visual-audit-pack/`) · Capture 2026-10-21  
**Android column:** empty — **not Pass**  
**After fixes pack:** `visual-audit-pack/after/` (subset post #72–#77)

Labels: **OBSERVED** (screenshot) · **FACT** (code) · **HYPOTHESIS** · **UNVERIFIED** (device)

---

## Method

For each screen: hierarchy, primary/secondary actions, density, typography/spacing consistency, scroll, forms, keyboard, empty/error/confirm, a11y/touch, dark/light, safe area, perf risk. Map PNG → route/component.

Known focus issues from brief (checked against pack + later PRs):

| Issue | Class after #72–#77 | Notes |
|-------|---------------------|-------|
| Purchase Preview overflow | Likely mitigated OBSERVED in `after/51` | Re-verify Android UNVERIFIED |
| Recipe KBJU inconsistency | Partially addressed (#72 seed kcal) | Still watch yield vs per-100g |
| Overloaded week menu | Partially (#77 edit mode) | Still dense OBSERVED `54` |
| Duplicate recipe create entries | Still present | new + import-text + personal |
| Huge forms | OBSERVED pantry/recipe/budget | |
| Technical copy | Partial remaining | Eat Now / budget |
| Weak Eat Now | Improved pantry-first (#73) | Still data-dependent |
| Pantry form > list | OBSERVED `22`/`52b` | |
| Opaque budget forecast | Softened (#74 ≥7d) | Completeness still weak |
| Today/Food duplicate | Unchanged | IA |
| Shopping dupes | HYPOTHESIS | Alias match |
| Screens useless without setup | OBSERVED empty states | |

---

## Tabs / core

### T01 Today empty — `01-today-empty.png` → `(tabs)/index.tsx`

| Aspect | Finding | Sev |
|--------|---------|-----|
| Hierarchy | Day header + empty totals; CTAs compete | P2 |
| Primary | Add food / open plan | — |
| Empty | Honest empty; weak onboarding to targets | P1 |
| A11y | UNVERIFIED TalkBack | — |

**Evidence →** empty day without goals. **Impact:** first-run confusion. **Direction:** goals sheet. **Severity:** P1 UX.

### T02 Today filled — `61-today-filled.png`

| Aspect | Finding |
|--------|---------|
| Density | High: macros, habits, water, plan, recents |
| Primary | Re-log / quick add buried among modules HYPOTHESIS |
| Scroll | Long page; north-star speed at risk |

### T03–T06 Food — `02*`, `60*`, `(tabs)/food.tsx`

| Aspect | Finding | Sev |
|--------|---------|-----|
| Search empty | Clear no-results OBSERVED `02b` | OK |
| Search results | Usable OBSERVED `60b` | OK |
| Overlap | Same log intent as Today | P1 IA |

### T07 Activity empty — `03-activity-empty.png`

Sparse; primary = add workout modal. Low density OK. Secondary to food JTBD.

### T08 Progress empty — `04-progress-empty.png`

Weight CTA present; sparkline needs data (#87). Empty OK.

### T09 Profile — `05-profile.png`

Targets, water, export. Dense settings form. Primary unclear vs “set goals once”.

---

## Modals

| ID | PNG | Route/component | Audit |
|----|-----|-----------------|-------|
| M01 | `30-modal-add-food` | Add food sheet | Primary log path; long form risk |
| M02 | `30b` quick | Quick add | Better for ≤10s target |
| M03 | `31` habit | Habit composer | OK |
| M04 | `31b` challenge | Challenge | Secondary; hide candidate |
| M05 | `32` workout | Workout | OK |

**Keyboard avoidance:** UNVERIFIED on Android WebView/RN.

---

## Recipes

| ID | PNG | Finding | Sev |
|----|-----|---------|-----|
| R01–R03 | `10`, `40`, `40b` | Library usable; search OK | — |
| R04 | `11`/`42` | Large form; many fields | P2 |
| R05–R06 | `12`/`43*` | Import paste → editor; correction burden | P2 |
| R07 | `13*` | Personal archive path duplicates create | P2 |
| R08 | `41` | Detail KBJU display — watch consistency | P1 |
| R09–R10 | `41b`/`41c` | Recook + portion modals — good contextual | — |

**Finding PI-UX-R1:** Multiple create entries (new / import-text / import-personal). **OBSERVED**. **Impact:** discovery confusion. **Direction:** one Create funnel. **P2**.

---

## Plan / FI

### P01 Plan hub — `20` / `58` → `plan/index.tsx`

Link farm to FI features. **OBSERVED:** second IA root. **Sev P1**.

### P02–P03 Eat Now — `21` / `57` → `plan/eat-now.tsx` + `scoreEatNow`

| Empty | Nudges goals; may still list candidates (#73) |
| Filled | Ranked list; quality depends on pantry/targets |
| Copy | May expose scoring rationale (technical) HYPOTHESIS |

**PI-UX-EN1:** Suggestions feel weak without rich data. **Impact:** feature abandonment. **P1**.

### P04–P06 Pantry — `22`, `52*` → `plan/pantry.tsx`

**PI-UX-PA1:** Add form dominates empty/filled. **OBSERVED**. **Impact:** inventory hard to scan. **Direction:** list-first. **P1**.

### P07–P08 Week — `23`/`53`/`54` → `plan/week.tsx`

**PI-UX-WK1:** Filled week overcrowded. Partially mitigated by edit mode (#77). **Still P1** until Android confirm.

### P09–P10 Shop — `24`/`55` → `plan/shop.tsx`

Empty improved (#74 manual). Filled: checkboxes OK; dupe risk HYPOTHESIS.

### P11–P12 Budget — `25`/`56` → `plan/budget.tsx`

**PI-UX-BU1:** Forecast opacity; #74 hides until ≥7d. Completeness of prices still unclear. **P1**.

### P13 Stores — `26` → `plan/stores.tsx`

**PI-UX-ST1:** Thin preference UI; no catalogs. **Hide/defer candidate**. **P2 product**.

### P14–P17 Purchase — `27*`/`50`/`51` → `plan/receipt.tsx`

| Preview overflow | Mitigated on web after #72/#75; Android UNVERIFIED | P0→monitor |
| Long names | Still risk at 320dp | P1 |
| OCR mode | Code path #85; not in original 47 pack as separate PNG | UNVERIFIED UX |

---

## Cross-cutting UX

| Topic | Status |
|-------|--------|
| Visual hierarchy | Inconsistent: hub lists vs dense filled days |
| Tokens | Open issues #52/#55 style debt |
| Dark mode | Not a product focus; light assumed OBSERVED |
| Safe area Android | UNVERIFIED |
| Perf FlatList | Catalog may use ScrollView map — FACT risk in PERFORMANCE-BASELINE |
| Confirmation | Soft delete weight exists; purchase confirm exists |
| Shame language | Policy forbids; spot-check OK |

---

## Severity rollup (UX)

| Sev | Count (approx) | Themes |
|-----|----------------|--------|
| P0 | 0 open confirmed web | Preview overflow fixed on web; device TBD |
| P1 | ~8 | IA overlap, pantry form, week density, Eat Now value, budget clarity, recipe KBJU |
| P2 | ~6 | Forms, Stores, challenges, create dupes |
| P3 | polish | tokens, copy |

Full IDs → `11-ISSUE-REGISTER.md`.
