# FI-01 — Portion-aware Eat Now (specification)

| Field | Value |
|-------|--------|
| Issue | #98 |
| Status | **Spec only** — implementation of UI/copy after approve |
| Code today | `src/domain/scoreEatNow.ts`, `remainingMacros.ts`, tests `eat-now*.test.mjs` |

---

## Problem

User needs a **suggested portion** that fits remaining KBJU (or honestly shows it will exceed). Never invent macros. Unknown ≠ 0.

---

## AS-IS (FACT — already in code)

1. `remainingMacros(targets, totals)` — null when either side unknown; may be **negative** (overshoot).  
2. `suggestPortionGrams(per100, remaining, preferProtein?)`:  
   - Uses meal budget, not full day remaining: `mealEnergyBudgetKcal` cap **700 kcal**, fraction **0.35** of day remaining.  
   - If remaining energy ≤ 0 → small snack **80 g**.  
   - Grams clamped **40…500**.  
3. `computeFitScore(portionMacros, remaining)` — exceed **reduces** score, does **not** ban.  
4. Candidates with fully unknown macros cannot score against remaining (`fitScore` null).  
5. No invented kcal — only from product/recipe/batch `per100`.

---

## TO-BE policy (this issue locks)

### Hard rules (must)

| Rule | Behavior |
|------|----------|
| H1 | Never coerce null macros → 0 for scoring or display |
| H2 | Suggested grams from known remaining + known per100 only |
| H3 | If no energy/protein remaining known → still suggest default grams; UI must say targets incomplete |
| H4 | If portion energy > remaining energy (both known) → still allow pick; **must show explicit exceed** in UI (FI-02 copy) |
| H5 | Meal cap remains (one sitting ≠ whole day remaining) |

### Soft ranking (after hard filters)

1. Exclude allergens / user exclusions when those exist (future).  
2. Prefer `atHome` / pantry coverage.  
3. Prefer prep time when filter quick.  
4. Prefer fitScore when comparable.  
5. Prefer user frequency (optional later).

### Explicit exceed (UI requirement for impl PR)

When `remaining.energyKcal != null` and suggested portion kcal `> remaining.energyKcal`:

- Show line like: «Порция ~X ккал при остатке Y — выше остатка» (neutral, no shame).  
- Same for protein if prefer-protein mode and both known.

When remaining null: «Нет цели по ккал — порция ориентир, не подгонка».

---

## Test matrix (extend in impl)

| Case | Expect |
|------|--------|
| Targets null | Suggestions still list; explanation incomplete; no fake fit |
| Small remaining (e.g. 120 kcal) | Grams sized to budget; may be near MIN_G |
| Remaining ≤ 0 | Small snack grams (~80); soft overshoot messaging |
| Unknown per100 kcal | No energy-based portion; null energy on card |
| Exceed after suggest | fitScore lower; UI exceed flag true |
| Meal cap | Day remaining 2000 → budget ≤ 700 |

Existing unit coverage: `tests/eat-now.test.mjs` (portion suggest, caps, overshoot snack).

---

## Out of scope for #98

- FI-02 explanation polish UI  
- FI-03…FI-06 full Eat Now 2.0  
- Changing MEAL_ENERGY_CAP without measurement  

## Impl checklist (follow-up issue)

- [ ] Export `portionExceedsRemaining(...)` helper  
- [ ] Wire exceed flag into Eat Now list row  
- [ ] Snapshot tests for copy strings (RU)  
- [ ] Device smoke on dogfood APK  

---

## Acceptance for this docs issue

1. Spec merged and linked from #98.  
2. Founder/ChatGPT can approve before coding UI exceed.  
3. No product behavior change in the docs-only PR.
