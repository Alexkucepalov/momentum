# Screen Audit

Inventory from Expo Router (`apps/mobile/app/**`).  
Оценка: **Code review**, не device walkthrough. Колонка «Primary action» = что должно быть очевидным.

Шкала цели экрана: ✅ ясно / ⚠️ размыто / ❌ конфликт.

> **2026-11-01 refresh (Stage 11):** вкладки = Сегодня / Питание / **Движение** / Прогресс / Профиль (+ stacks recipes, plan, garmin).  
> Движение = сегменты Активность | Сон; `(tabs)/sleep` hidden + redirect.  
> Snapshot store: **v18** (`sleepNights`). Catalog = FlatList (threshold 24). Device TalkBack / visual Pass — **open**.

---

## Tabs

### Сегодня — `(tabs)/index.tsx`

| Вопрос | Оценка | Notes |
|--------|--------|-------|
| Цель | ⚠️ | Daily hub: log + habits + plan + shortcuts |
| Primary action | ⚠️ | AddFoodBlock vs Plan strip vs Shortcuts |
| Competing CTA | ❌ | JourneyShortcuts (4) + Plan + Add + Checklist |
| Hierarchy | ⚠️ | Ring / strip / add compete for attention |
| Scroll length | ⚠️ | Long on small phones (**H**) |
| One-hand | ⚠️ | Primary add mid-scroll |
| Empty/error | ✅ | Habits empty handled; plan empty CTA |
| a11y | ⚠️ | Many controls; need TalkBack pass (**H**) |
| Design system | ✅ | tokens used |

**P1 fix idea:** Above-fold = date + ring + **one** add CTA + recent 3; rest progressive.

### Питание — `(tabs)/food.tsx`

| Вопрос | Оценка | Notes |
|--------|--------|-------|
| Цель | ⚠️ | Diary + week strip + catalog + plan |
| Primary | ⚠️ | Sticky add exists but catalog dominates scroll |
| Duality | ❌ | Overlaps Today logging |
| Lists | ✅ | Catalog `FlatList` (virtualize ≥24); diary ScrollView OK |
| Search | ✅ | Local query |
| Header | ⚠️ | Plan icon + other actions |

**P1:** Split mental model — «Дневник дня» vs «Каталог» (segment or sub-route).

### Активность — `activity.tsx` (~246)

| Цель | ✅ Workouts for day |
| Primary | ✅ Add workout |
| Notes | Cleaner than Food; keep pattern |

### Прогресс — `progress.tsx` (~427)

| Цель | ⚠️ Trends + habits + challenges + export |
| Primary | ⚠️ Unclear first action |
| P2 | Collapse challenges behind «Ещё» |

### Профиль — `profile.tsx` (~744)

| Цель | ⚠️ Settings + goals + water + privacy + export |
| Density | ❌ Large screen |
| P2 | Group: Goals / Body / Data / About |

---

## Plan stack — `/plan/*`

| Screen | Цель | Primary | Issues |
|--------|------|---------|--------|
| `index` hub | Navigate modules | ✅ cards | OK |
| `eat-now` | Pick food now | ✅ diary / plan CTAs | Needs targets |
| `pantry` | Stock + batches | ✅ | Dense but OK |
| `week` | Meal draft | ✅ | Banner planned≠eaten good |
| `shop` | List + prices | ✅ | ₽ semantics clarified |
| `budget` | Spend vs eaten | ⚠️ | Two metrics easy to confuse if no prices |
| `stores` | Pref tags | ⚠️ | Low product value |
| `receipt` | Manual expense | ✅ honest stub | Deep navigation |

---

## Recipes — `/recipes/*`

| Screen | Notes |
|--------|-------|
| `index` | List + nav to import |
| `new` / `edit/[id]` | Form heavy; keyboard (**H**) |
| `[id]` | Detail + cook |
| `import-text` | Preview macros improved (#29) |
| `import-personal` | Polish #33; logic intact |

---

## Overlays / sheets (not routes)

| Component | Role | Audit |
|-----------|------|-------|
| `AddFoodSheet` (~842) | Core add | Monolith — split P1 |
| `ConfirmPortionSheet` | Grams + macros | Critical path |
| `BarcodeLookupSheet` | OFF | Network dependent |
| `DayCalendarSheet` | Date pick | OK |
| `PortionEditModal` / `SaveMealModal` | Edit / save meal | Naming overlap with ConfirmPortion |

---

## Missing vs docs/03-UX.md

| Spec | App |
|------|-----|
| 4 tabs | **5** tabs (Profile split) — intentional dogfood |
| Welcome onboarding | **Absent** — skip OK per PRD |
| AISuggestionCard | Absent (good for freeze) |
| Offline banner | Not prominent (**H** need?) |

---

## Checklist scores (aggregate)

| Criterion | Worst offenders |
|-----------|-----------------|
| Competing CTA | Today, Food, Progress |
| Scroll | Today, Food, Profile, import-personal |
| Virtualization | Food catalog, Eat Now cards, pantry |
| Keyboard | Recipe forms, shop prices (**H**) |
| Data loss on dismiss | Sheet drafts — **H** verify |
