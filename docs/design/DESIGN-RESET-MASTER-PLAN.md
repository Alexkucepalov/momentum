# Design Reset — Master Plan (COMPLETE)

**Дата старта:** 2026-10-29 · **Ветка:** `feat/148-design-reset-complete` · **База:** `main` @ `91ced15` (после merge #152)  
**Контракт:** Nutrition Soft Light — [`CONTRACT.md`](./CONTRACT.md) · [`DESIGN-RESET-AUDIT.md`](../quality/DESIGN-RESET-AUDIT.md)  
**Baseline live:** `docs/quality/visual-audit-pack/2026-10-29-baseline-live/` + Expo `:8002` snapshot  
**Предыдущий Soft Light (#148/#149–#152):** принят как foundation, **не** считать Done без чеклиста ниже.

---

## 0. Сверка с реальностью (не доверять старым отчётам)

| Факт | Статус |
|------|--------|
| PR #152 merged | ✅ Soft Light B–E на `main` |
| `surfaceCard` на экранах | ✅ только deprecated alias в `tokens.ts` |
| `SoftMetricCard` | ✅ alias → `BentoStat` |
| Единый CTA Today | ✅ InverseStrip primary; один calendar на DayStrip |
| Food / Activity язык | ✅ близко к Soft Light |
| ADR-009 redirects (pantry/shop/budget/stores/receipt) | **I** — не восстанавливать UI |
| Android Pass | ❌ Pending |
| Friends Beta READY | ❌ не ставить без gate |

---

## 1. Inventory экранов и состояний

Статусы: `NS` not started · `IP` in progress · `IM` implemented (код Soft Light) · `VV` visually verified (web) · `DV` device verified.

### 1.1 Layout / system

| Маршрут | Класс | Статус | Проблемы → решение |
|---------|-------|--------|-------------------|
| `/_layout` | I | IM | — |
| `/(tabs)/_layout` | shell | IM → VV | soft tab chrome; сверить с Food |
| `/plan/_layout`, `/recipes/_layout` | I | IM | stack titles native |
| `/+not-found` | N | IP | привести к Soft Light empty |
| `/+html` | I | IM | web only |

### 1.2 Вкладки

| Маршрут | Главная задача | CTA | Статус | Проблемы → решение |
|---------|----------------|-----|--------|-------------------|
| `/` Сегодня | быстрый лог еды | InverseStrip «Записать еду» | IM → IP | dual calendar; barcode secondary OK; убрать header calendar |
| `/food` | дневник + каталог | Fab | IM → VV | эталон; DateSwitcher vs DayStrip — план unify later |
| `/activity` | лог тренировок | Fab | IM → VV | BentoStat OK; без neumorph |
| `/progress` | вес / отчёты / привычки | WeightLog dark | IM → VV | tabs body/food/sport/habits/summary |
| `/profile` | цели / настройки | secondary CTAs | IM → VV | AppCard forms |

### 1.3 Plan

| Маршрут | Статус | Примечание |
|---------|--------|------------|
| `/plan` hub | IM → VV | AppCard hub |
| `/plan/eat-now` | IM → VV | AppCard + PrimaryButton |
| `/plan/my-products` | IM → VV | AppCard list |
| `/plan/week` | IM → IP | DnD + action menu; web≠Android |
| pantry/shop/budget/stores/receipt | **I** | Redirect ADR-009 |

### 1.4 Recipes

| Маршрут | Статус |
|---------|--------|
| `/recipes`, `/new`, `/edit/[id]`, `/[id]`, import-text, import-personal | IM → VV |

### 1.5 Sheets / modals

| ID | Компонент | Статус | Примечание |
|----|-----------|--------|------------|
| S1–S6, S8–S11 | AddFood…Week sheets | IM → VV | light sheetSurface |
| S7 WeightLog | dark keep | IM → VV | intentional dark |
| M1–M4 | Portion/Save/Centered/Profile paste | IM → VV | |

---

## 2. Карта компонентов (дубли → канон)

| Роль | Канон | Legacy / deprecate |
|------|-------|-------------------|
| Raised surface | `AppCard` | `surfaceCard` alias only |
| Metric cell | `BentoStat` | `SoftMetricCard` alias |
| Section title | `SectionTitle` | `SectionHeader` re-export |
| Primary CTA | `PrimaryButton` / `Fab` / one `InverseStrip` | ad-hoc black pills |
| List row | `ListRow` | local Pressable rows (migrate opportunistically) |
| Header | `SoftHeader` (home) / stack title | — |
| Date | `DayStrip` + `DateSwitcher` | ✅ same AppCard + `dateChrome` family |
| Empty | `EmptyState` | — |
| Sheet chrome | `SwipeToDismissSheet` + `sheetSurface` | — |

**Не плодить:** FoodRow/RecipeRow как отдельные файлы, пока `ListRow` + domain meta покрывают; добавить только при ≥3 копиях разметки.

---

## 3. План миграции (этапы)

| Этап | Содержание | DoD этапа |
|------|------------|-----------|
| **A** | Inventory + baseline + этот MASTER-PLAN | файлы в repo |
| **B** | `MOMENTUM-UI-KIT.md` + token gaps (pressed/disabled docs) | kit documented |
| **C** | Today calendar dedupe; tab/nav consistency; Food etalon check | ≤1 calendar entry Today |
| **D** | Week DnD feedback polish; Eat Now / Recipes smoke | no domain change |
| **E** | `+not-found`; sheet density pass | Soft Light |
| **F** | rg leftover elevation/local card chrome; verify | verify green |
| **G** | re-capture pack; REPORT; Android Pending; PR merge | REPORT + PR |

**Intentional out of scope:** restore ADR-009 shopping/budget UI; invent nutrition; new features; Friends Beta READY without device gate.

---

## 4. Риски

| Риск | Mitigation |
|------|------------|
| Week DnD break | keep measure refs outside AppCard; manual `/plan/week` |
| #135 Add Food conflict | tone* reserved; rebase #135 after Soft Light |
| Dual date patterns | document; unify later |
| Web≠Android | REPORT: DV Pending |

---

## 5. Definition of Done (проверяемый)

См. user brief §10. Текущий прогресс обновляется в этом файле и в `DESIGN-RESET-REPORT.md`.

| Критерий | Сейчас |
|----------|--------|
| Inventory полный | ✅ (этот doc) |
| UI Kit единый на активных поверхностях | ✅ #152 + complete pass + UI Kit doc |
| Нет конкурирующих языков | ✅ Today calendar dedupe; Soft Light shell |
| Сценарии сохранены | ✅ |
| verify green | ✅ re-run на complete branch |
| Screenshots актуальны | ✅ pack 2026-10-29 + baseline-live |
| Android | Pending |
| Friends Beta | BLOCKED until Android + product gate |

См. [`DESIGN-RESET-REPORT.md`](./DESIGN-RESET-REPORT.md).
