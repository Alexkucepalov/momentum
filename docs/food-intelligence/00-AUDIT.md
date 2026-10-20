# Module audit — as-is (code + UX)

Date: 2026-10-21 · Codebase: `main` post S2-4 hub. Style: Nothing mono.

---

## Cross-cutting friction

| Issue | Evidence | Impact |
|-------|----------|--------|
| Modules weakly linked | Purchase ≠ pantry; shopping ≠ confirmed buy; budget expenses ≠ line items | User re-enters the same food |
| Receipt stub only totals | `plan/receipt.tsx` → one `FoodExpense` note | No stock, no matching, no dedupe |
| Prices never “live” | ADR-008 + Stores = preference tags | Correct ethically; user expects more — must set expectations |
| Hub improved but still a menu of apps | S2-4 groups «Сейчас / Неделя» | Still no single journey rail |
| Recipes vs Catalog vs Eat Now | Discovery map exists | Mentally three places for “food ideas” |
| Planned ≠ eaten OK | Explicit log from plan | Keep; reinforce in import flow |

---

## 1. Eat Now (`/plan/eat-now`)

**User problem:** «Что съесть сейчас под остаток КБЖУ из того, что реально есть?»

**Current journey:** План → Eat Now → filters → score candidates → portion sheet → diary.

**Capabilities:** `scoreEatNow` + pantry/cooked/recipe/product pools; filters (дома / купить / без готовки / 15 мин / белок); meal by `mealSlotForNow`.

**Friction:** Weak “from what I just bought”; empty pantry → generic catalog feel; “купить” is label-only.

**Redundant:** Overlaps Recipes “what to cook” and Today Recent for repeats.

**Merge/remove:** Keep as **contextual recommendation layer**, not a third recipe browser. Feed from pantry coverage %.

**Proposed role:** Primary CTA after confirmed purchase / when remaining macros known.

---

## 2. Recipes (`/recipes`)

**User problem:** Хранить способы готовки, импорт, повтор партий.

**Current journey:** Hub actions (manual / text / archive) → list/filter → detail → cook / log.

**Capabilities:** Full recipe CRUD, import, cooked batches via repo, Eat Now uses recipes.

**Friction:** Not ranked by pantry; import ≠ purchase import; discovery still multi-entry.

**Merge/remove:** Keep library; add **pantry match** and **missing ingredients → shopping** as contextual actions, not new hub tiles.

---

## 3. Home Pantry (`/plan/pantry`)

**User problem:** Что дома (сырьё + готовые партии).

**Current journey:** Manual add/edit locations; cooked batches; links to Eat Now.

**Capabilities:** `PantryItem` + `CookedBatch`; quantities nullable; FIFO cooked decrease on diary.

**Friction:** Not filled from purchases; no receipt link; easy to drift from reality.

**Merge/remove:** Pantry becomes **system of record for stock**; purchases write here on confirm. Manual edit stays.

---

## 4. Weekly Meal Planning (`/plan/week`)

**User problem:** Меню на 3–7 дней без ежедневного придумывания.

**Current journey:** Draft params → generate → activate → log/skip/portion; shopping from plan.

**Capabilities:** `MealPlan` / `PlannedMeal`; planned ≠ eaten; shopping list from plan.

**Friction:** Generation quality depends on recipe pool; weak leftover reuse story; budget field decorative vs real spend.

**Merge/remove:** Keep; drive candidates from pantry + favorites; never auto-diary.

---

## 5. Shopping Lists (`/plan/shop`)

**User problem:** Одна покупка по недостающему.

**Current journey:** List from plan → check items → optional prices.

**Capabilities:** Aggregate lines, pantry coverage, checkoff, user/estimate prices.

**Friction:** Checkoff ≠ purchase confirmation; no path from shopping → receipt → pantry.

**Merge/remove:** Shopping = **intent**; Purchase import = **fact**. Closing a list should offer “записать покупку”.

---

## 6. Food Budget (`/plan/budget`)

**User problem:** Лимит vs факт трат (и позже стоимость съеденного).

**Current journey:** Set monthly limit; add categorical expenses; receipt stub feeds total only.

**Capabilities:** `FoodBudget`, `FoodExpense`; categories groceries/cafe/office/delivery.

**Friction:** No SKU-level spend; no projected shopping cost; no amortized eaten cost.

**Merge/remove:** Keep three labeled buckets (actual / projected / eaten) — only show when data exists.

---

## 7. Stores (`/plan/stores`)

**User problem:** Где обычно покупаю (для UX/matching hints).

**Current journey:** Toggle preferences; link to manual receipt.

**Capabilities:** `StorePreference` tags only.

**Friction:** Looks like “integrations” but isn’t; receipt buried here.

**Merge/remove:** Demote to settings chip under Purchase Import; keep tags for matching priors. **Do not** imply live catalogs.

---

## Data flow today (broken chain)

```
Diary ← Eat Now / Recipes / Plan log
Pantry ← manual only
Shopping ← plan aggregate
Budget ← manual expense / receipt TOTAL
Stores ← tags
Purchase lines ← ❌ missing
```

## Target chain

```
PurchaseImport → confirmed lines → Pantry + Expenses (+ ProductPrice observations)
     ↓
Pantry coverage → Recipes rank / Eat Now
     ↓
Weekly plan → Shopping (needToBuy only)
     ↓
Shopping done → prompt PurchaseImport
Budget reads expenses + optional projected shopping + optional eaten amortization
```
