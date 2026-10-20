# Quality Sprint 2 — UX/UI Redesign Plan

**Статус:** проектирование (wireframes + IA). **Код экранов не менять** до approve структуры Today/Food.  
**Feature Freeze:** сохранён — без новых product features, без Dispatcher, без auto-merge.  
**Эталон:** пищевой дневник (открыть → продукт → граммы → запись).

---

## Open quality gate (не закрыт)

| Gate | Статус |
|------|--------|
| Android dogfood 15 мин (`DEVICE-DOGFOOD-15MIN.md`) | **Не пройден** — нет device Pass в PERFORMANCE-BASELINE |
| Kill-app durability (#36) | Pending device |
| Repeat ≤10 s (#37) | Pending device |

Sprint 2 **можно проектировать и готовить PR-план**, но UI-изменение считается Done только после: screenshots + Android dogfood на затронутом сценарии + `npm run verify`.  
Не трактовать Node baseline / CI green как UX-успех.

---

## Цель спринта

Собрать уже существующие возможности в **понятные сценарии**, а не добавлять экраны.  
Nothing-inspired: mono, сильная типографика, один primary CTA на viewport, меньше pill-шума.

---

## Порядок работ (утверждённый)

| # | Область | Фокус | Когда код |
|---|---------|-------|-----------|
| 1 | **Today** | Один CTA, иерархия, быстрый повтор | После approve IA Today/Food |
| 2 | **Food** | Дневник ≠ поиск ≠ каталог | Тот же PR-серия |
| 3 | AddFoodSheet | Меньше шагов, порция, guard | После 1–2 |
| 4 | Recipes | Единый путь discovery | После 1–2 |
| 5 | Planner | Связка меню→готовка→покупки (без новых фич) | P2 |
| 6 | Progress/Profile | Меньше шума | P2 |
| 7 | Design system | Tokens/docs sync, компоненты | Параллельно точечно |

**Старт реализации:** только пара **Сегодня + Питание** — см. `WIREFRAMES-TODAY-FOOD.md`.

---

## Артефакты Sprint 2

| Документ | Содержание |
|----------|------------|
| `SPRINT-2-IA.md` | Информационная архитектура (tabs + stacks) |
| `SPRINT-2-FLOWS.md` | 6 ключевых UX flow (as-is → to-be) |
| `WIREFRAMES-TODAY-FOOD.md` | Wireframes + before/after + hide/remove |
| Этот файл | План PR, AC, gates |

---

## Предлагаемые маленькие PR (после approve Today/Food)

| PR | Scope | Не входит |
|----|-------|-----------|
| **S2-0** (этот) | Docs: IA + flows + wireframes | UI code |
| **S2-1** | Today: above-fold hierarchy only | Food catalog rewrite |
| **S2-2** | Food: segments Дневник \| Каталог | AddFoodSheet split |
| **S2-3** | AddFoodSheet: entry UX polish | Repo rewrite |
| **S2-4** | Recipes discovery copy/nav glue | New import channels |
| **S2-5+** | Planner glue / Progress / DS | New FP features |

Каждый PR: проблема → as-is → to-be → −N действий → AC → test plan → screenshots → dogfood note.

---

## Критерии качества (общие)

- Назначение экрана понятно за несколько секунд  
- Один очевидный primary action  
- Повтор еды — ориентир ≤10 s (измерить на device)  
- Нет дублирующих CTA без обоснования  
- Нет лишних модалок  
- Empty / error проработаны  
- Back + keyboard предсказуемы  
- Snapshot **v13** без breaking migration  
- `npm run verify`  
- UI Done ≠ CI only  

---

## Согласование IA (утверждено 2026-10-20)

1. **Today** above-the-fold: КБЖУ → primary «Добавить еду» → recent. Meal chips с fold убраны (время + правка в sheet).  
2. **Food** сегменты `Дневник` | `Каталог` — **S2-2** после review S2-1.  
3. Empty plan → text-link; JourneyShortcuts → secondary text links ниже fold.  

**S2-1 in progress** · S2-2 не начинать до review S2-1.
