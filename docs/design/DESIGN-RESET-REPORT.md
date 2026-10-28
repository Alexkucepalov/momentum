# Design Reset — Report

**Дата:** 2026-10-29  
**Ветки:** `main` @ `91ced15` (#152 Soft Light B–E) + `feat/148-design-reset-complete` (этот проход)  
**План:** [`DESIGN-RESET-MASTER-PLAN.md`](./DESIGN-RESET-MASTER-PLAN.md) · Kit: [`MOMENTUM-UI-KIT.md`](./MOMENTUM-UI-KIT.md)

---

## 1. Что реализовано

- Nutrition Soft Light как единственный shell-язык (PR-A…E через #149–#152).
- Миграция вкладок, Plan, Recipes, light sheets → `AppCard` / border fields; WeightLog остаётся dark.
- Complete pass: MASTER-PLAN, UI Kit doc, Today calendar dedupe, Soft Light `+not-found`, MealAction row chrome, purge unused `elevation` imports.
- Evidence: web pack `docs/quality/visual-audit-pack/2026-10-29-screens/`, baseline live `…/2026-10-29-baseline-live/`, dogfood APK meta.

## 2. Обработанные экраны

Все активные маршруты из MASTER-PLAN §1 — статус **IM** (implemented). Web **VV** для ключевых empty/filled в pack 2026-10-29. ADR-009 redirects — intentional **I**.

Sheets S1–S11 / modals M1–M4 — IM; WeightLog dark intentional.

## 3. Намеренно не менялось

| Что | Почему |
|-----|--------|
| ADR-009 pantry/shop/budget/stores/receipt UI | Redirect only — не восстанавливать без продукта |
| Domain / SQLite / nutrition math | вне scope редизайна |
| DayStrip vs DateSwitcher unify | задокументировано; не блокер Soft Light |
| Friends Beta → READY | нет Android Pass |
| Auto-invent food intelligence surfaces | no new features |

## 4. Компоненты: замены

| Legacy | Канон |
|--------|-------|
| `surfaceCard` spreads | `AppCard` (alias deprecated) |
| `SoftMetricCard` | `BentoStat` alias |
| Ad-hoc elevation cards | AppCard / border fields |
| Dual Today calendar | только DayStrip calendar |

## 5. Тесты

`npm run verify` — **OK** (typecheck + 200 tests + security + mobile tsc) на complete branch.

## 6. Скриншоты

- Baseline (user + browser): `docs/quality/visual-audit-pack/2026-10-29-baseline-live/`
- After Soft Light (#152): `docs/quality/visual-audit-pack/2026-10-29-screens/` (39 shots)
- Expo dogfood: `http://localhost:8002` during session

## 7. Известные дефекты

- Dual date chrome (DayStrip vs DateSwitcher) — cosmetic inconsistency.
- Некоторые click-miss в capture script (sheet labels) — не продуктовые баги.
- Week DnD: feedback/flash + MealAction alternative есть; **Android gesture Pass не прогнан**.

## 8. Android verification

**Pending.** APK собран (`docs/quality/apk/DOGFOOD-APK.md`); жесты / IME / safe area на device не закрыты. Web ≠ Android Pass.

## 9. Остаток (приоритет)

1. **P0** Android Pass по `ANDROID-TEST-PLAN.md` на dogfood APK.  
2. **P1** Unify date header (DayStrip ↔ DateSwitcher).  
3. **P2** Rebase/coordinate open #135 Add Food.  
4. **P3** Friends Beta gate только после P0.

## 10. Friends Beta

**BLOCKED** — нет device Pass; product gate не подтверждён. Код Soft Light готов к dogfood среди друзей **после** установки APK и ручного Android checklist.

---

## 11. Follow-up: visual redesign from user photos (2026-10-29)

Branch work after #153: canvas `#F2F2F2`, DateSwitcher→AppCard, Plan hub vertical rows (no dual black pills), ListRow/Bento/DayStrip/segment density, HabitCard PrimaryButton, REFS + UI Kit recipes for user moodboard. Domain unchanged. Android Pass still Pending.
