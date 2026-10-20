# Quality Roadmap

**Статус:** утверждён 2026-10-20 · engineering in progress · **Android dogfood GATE OPEN**.  
**Feature Freeze:** без новых product features / FP-8+ / AI. Dispatcher dry-run.

Эталон: **открыть → продукт → граммы → дневник**.

---

## Progress (2026-10-20)

| Этап | Статус | Evidence |
|------|--------|----------|
| 1 Baseline Node | **Done** | #39, PERFORMANCE-BASELINE |
| 1 Android dogfood | **Pending** | DEVICE-DOGFOOD · apk/DOGFOOD-APK.md |
| 2 Q-P0-02 guard | **Done (code)** | main; device spot-check pending |
| 2 Kill-app / repeat timing | **Pending device** | #36 #37 |
| 3 S2-1 Today | **Merged** | #43 → main |
| 3 S2-2 Food segments | **Merged** | #45 → main |
| 3 S2-3 AddFoodSheet polish | **In PR** | search-focus; nest-a11y |
| 3 S2-4+ Recipes/Planner | **Next** | after S2-3 |
| 4 FlatList | **Deferred** | нет device jank proof |
| 5 DS / TalkBack | **Partial** | nest fix; full path pending |

**Нельзя пометить Quality Roadmap DONE** пока device gates #36/#37/#38 открыты.

---

## PR log (Quality)

| PR | Тема | State |
|----|------|-------|
| #39 | Sprint 1 baseline + guard | merged |
| #41 | S2-0 UX docs | merged |
| #43 | S2-1 Today hierarchy | merged |
| #45 | S2-2 Food segments | merged |
| (open) | S2-3 sheet + catalog a11y + APK meta | this branch |

---

## Explicitly not in freeze

Rewrite foodRepository · normalized SQLite · AI/OCR/live prices · auto-merge without review · Play publish.
