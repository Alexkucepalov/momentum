# Feature Inventory — Momentum

**HEAD:** `1da2d0ac` · Schema **v14** · Audit 2026-10-24  
**Statuses:** Working | Partial | Broken | Unverified | Planned  
**Value:** High | Medium | Low

Evidence: route files under `apps/mobile/app/`, domain under `packages/domain/src/`, UI under `apps/mobile/src/ui/`, tests under `tests/`.

---

## Legend for rows

Each feature: **Name** · Purpose · User problem · Route · Entry · Flow (short) · Components/domain · Data · Mutates · Side effects · Offline · Empty/loading/error · Tests · Limits · **Status** · Evidence · Value

---

## 1. Today

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Daily KBJU status vs targets | Working | High | `TodayScreen.tsx`, `getDayTotals`, `targets` |
| Date navigation prev/next | Working | High | `TodayScreen` date controls |
| Recent foods + quick re-log | Working | High | `getRecentFoods`, Quick Add path |
| Today plan (planned meals) | Working | Medium | Planned entries; planned≠eaten |
| Habits on Today | Working | Medium | Habit rows / toggle |
| Water logging | Working | Medium | Water UI + repository |
| Quick actions strip | Partial | Medium | Overlaps Food / Plan deep links |

**Unknown macros:** Partial — shows honesty labels; user can still log. Domain: `nutrition.ts`.

---

## 2. Food (diary + catalog)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Diary by meal | Working | High | `FoodScreen`, meal sections |
| Catalog browse/search | Working | High | Seed + user products, `search` |
| Manual product create | Working | High | Manual product form |
| Quick Add / portion edit | Working | High | Portion grams, meal slot |
| Recent / Favorites | Partial | High | Recent strong; favorites weaker UX |
| Barcode scan | Partial | Medium | Camera path exists; DB coverage thin |
| Copy yesterday | Working | Medium | Repository copy helpers |
| Meal slot change | Working | Medium | Edit entry |

---

## 3. Recipes

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Library list/search | Working | High | `/recipes`, `recipes.tsx` |
| Create recipe | Working | High | `/recipes/new` |
| Import from text | Working | High | `/recipes/import`, parse domain |
| Personal archive | Working | Medium | Soft/archive patterns |
| Ingredient KBJU | Working | High | Snapshot + yield |
| Cooked yield / portions | Working | High | Domain yield math |
| Cook again / batches | Working | High | CookedBatch entities |
| Log serving to diary | Working | High | Link cook → entry |
| Link pantry / menu | Partial | High | Used by Eat Now / plan |

**OBSERVED:** Duplicate create entries (new vs import) in Visual Audit; KBJU display inconsistency across screens (hypothesis: yield vs raw).

---

## 4. Eat Now (`/plan/eat-now`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Remaining KBJU calc | Working | High | `scoreEatNow`, targets − eaten |
| Ranking algorithm | Working | High | Domain scorer + tests |
| Filters / portion fit | Partial | Medium | UI filters thinner than scorer |
| Pantry matching | Working | High | Match against pantry |
| Buy suggestions | Partial | Medium | Without live prices weak |
| Empty / no targets | Partial | High | Degrades; copy may be technical |
| Unknown nutrition handling | Working | High | Domain preserves null |

**OBSERVED:** Recommendations often feel weak without rich pantry + targets.

---

## 5. Pantry (`/plan/pantry`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Manual add | Working | High | Form + repository |
| Import from purchase | Working | High | Confirm → pantry upsert |
| Link to products | Working | High | `matchPurchaseProduct` |
| Qty / units / location | Partial | Medium | Units g/ml/pcs; locations thin |
| Cooked batches in pantry | Working | Medium | Batch stock |
| Consume / uncertain qty | Partial | Medium | Unknown qty supported in model |
| Recipe / shopping link | Partial | High | Via plan flows |

**OBSERVED:** Form dominates list (Visual Audit).

---

## 6. Planning (`/plan/*`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Menu 3/5/7 days | Working | High | Meal plan domain |
| Generate menu | Working | Medium | Generator + constraints |
| Budget hint / cook count / diversity | Partial | Medium | Params exist; UX dense |
| Edit portions / move / replace | Partial | High | Editable but heavy UI |
| Activate plan | Working | Medium | Activation flag |
| Add plan meals to diary | Partial | High | Planned vs eaten discipline |

**OBSERVED:** Weekly menu screen overcrowded.

---

## 7. Shopping (`/plan/shopping`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Manual list | Working | Medium | List CRUD |
| From menu + pantry reconcile | Working | High | Domain merge |
| Units / packs | Partial | Medium | Conversion edge cases |
| Prices | Partial | Medium | Incomplete without catalog prices |
| Check bought | Working | Medium | Toggle |
| Persist list | Working | Medium | Snapshot |
| Re-buy | Partial | Low | Weak loop |

**HYPOTHESIS:** Duplicate lines possible when aliases mismatch.

---

## 8. Purchase / receipt import (`/plan/receipt`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Paste text | Working | High | Parser + fixtures |
| Manual line edit | Working | High | Preview corrections |
| Parse + preview | Working | High | Preview UI |
| Discounts / units / dupes | Partial | High | Domain handles many; not all retailers |
| Confirm → pantry + expenses + catalog upsert | Working | High | #81/#82 |
| Order status | Partial | Low | Limited |
| Screenshot OCR | Partial | High | #84/#85 ExecuTorch; web stub; device accuracy UNVERIFIED |
| Cloud OCR / ML Kit Cyrillic | Planned/Blocked | — | Docs: no free Cyrillic ML Kit |

---

## 9. Budget (`/plan/budget`)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Monthly limit | Working | Medium | Profile/settings field |
| Actual spend from imports | Working | Medium | Expenses entities |
| Basket forecast | Partial | Medium | Incomplete prices |
| Cost of eaten | Partial | Low | Sparse price coverage |
| EOM forecast | Partial | Medium | Opacity OBSERVED |
| Categories | Partial | Low | Thin |

---

## 10. Stores (`Stores` tab/screen)

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Preferred store tags | Working | Low–Med | Preference only |
| Live retailer catalogs | Broken / Blocked | High if existed | Adapter throws; needs BD |
| Seed catalog | Working | Medium | ~198 products |

---

## 11. Activity

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Workout types + duration/distance | Working | Medium | Activity screens |
| Repeat last | Partial | Medium | |
| History | Working | Medium | |
| Link habits / progress | Partial | Medium | Loose coupling |

---

## 12. Progress

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| Weight log + soft delete | Working | High | #86/#87 `softDeleteWeight` |
| Weight sparkline | Working | Medium | `WeightSparkline` |
| Body measures | Partial | Medium | |
| Nutrition / sport / habits trends | Partial | Medium | Summary views |
| Challenges | Partial | Low–Med | Exists; secondary |
| PDF export | Unverified / Partial | Medium | Check export paths |

---

## 13. Profile

| Feature | Status | Value | Evidence |
|---------|--------|-------|----------|
| KBJU targets | Working | High | |
| Height/weight settings | Working | Medium | |
| Water prefs | Working | Medium | |
| Privacy posture | Working | High | Local-only default |
| Import/export / restore | Working | High | Snapshot export |
| Backup UX | Partial | High | User must understand file care |

---

## Cross-cutting

| Capability | Status | Notes |
|------------|--------|-------|
| Offline-first | Working | No network required for core diary |
| Domain validation | Working | Agents must not bypass |
| Shame-free copy | Partial | Some technical strings remain OBSERVED |
| Accessibility | Unverified | TalkBack Pass open |
| Cloud sync | Planned / out of scope | |

---

## Doc-only vs code

| In docs / PRD | In code |
|---------------|---------|
| Retail scrape / partner APIs | Not implemented (blocked) |
| Medical advice | Explicitly forbidden |
| Gamification for under-eating | Forbidden |
| Full Maestro Android CI Pass | Protocols only |

---

## Count snapshot (audit)

- Routes (file-based): **~25** under `apps/mobile/app/`
- Domain modules: **~42** under `packages/domain/src/`
- Feature rows above: **~90+** capability lines
- Visual screens audited: **47** PNG
