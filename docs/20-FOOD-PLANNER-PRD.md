# PRD — Momentum Food Planner

**Status:** Draft for founder approval (docs-only). Implementation Issues exist **without** `agent-ready` until approved.  
**Module:** раздел внутри питания — «План» (не шестая tab).  
**North-star:** не только «что съел», а «что приготовить / съесть сейчас / на неделю / что купить / сколько потратить».

## Problem

Ежедневные вопросы, которые счётчик калорий не решает:

1. Что приготовить из того, что есть / умею?
2. Что съесть сейчас под остаток КБЖУ?
3. Что есть на неделю без ежедневного придумывания?
4. Что купить и сколько примерно потратить?

## Goals

| ID | Goal | Metric (dogfood) |
|----|------|------------------|
| G1 | Eat Now под известный остаток дневных целей | ≥1 полезный вариант с граммовкой за ≤10 с |
| G2 | Подбор из личных рецептов / продуктов | Только известные КБЖУ; unknown не маскируется |
| G3 | Черновик меню 3–7 дней | План ≠ съедено |
| G4 | Список покупок из плана | Агрегация одинаковых ингредиентов |
| G5 | Бюджет (позже) | План vs факт; цена не «сегодня», если источник устарел |

## Non-goals (v1)

- Интеграции магазинов с live-ценами / scraping / обход ToS
- AI как единственный источник рациона или КБЖУ
- Автологирование запланированного в дневник
- Shame / блокировка еды при превышении цели
- Production PostgreSQL до отдельного ADR на backend

## Principles

1. **Offline-first:** подбор и расчёты на устройстве (SQLite + domain TS).
2. **`unknown ≠ 0`:** нет выдуманных ккал/цен/остатков.
3. **Детерминированная математика:** AI только запрос / замены / объяснение; числа — domain.
4. **Draft → confirm:** планы, корзины, AI-предложения не пишутся без явного сохранения.
5. **Остаток КБЖУ = ориентир**, не запрет.

## Personas / jobs

- Вечер: «480 ккал осталось — что съесть быстро?»
- Выходные: «2 готовки на неделю, бюджет ~X ₽»
- Магазин: «одна строка курицы на все рецепты»

## Success for MVP (Sprint 1–2)

- [ ] Eat Now: список кандидатов из recipes/products с порцией под остаток (когда цели и macros известны)
- [ ] Фильтры: дома / быстро / больше белка (без магазинного live)
- [ ] Pantry v0: ручные остатки продуктов + остаток партии рецепта после лога порции
- [ ] a11y, offline, `npm run verify`
- [ ] Нет invented nutrition

## Risks

| Risk | Mitigation |
|------|------------|
| Ложные «точные» цены магазинов | Только user price + дата; UI «оценка по прошлым покупкам» |
| AI ошибается в граммах | Не сохранять AI draft без подтверждения; validate domain |
| Scope creep (6 спринтов сразу) | Issues без `agent-ready` до утверждения; serial dispatcher |
| Конфликт с offline-first backend | Backend sync — отдельный ADR; Planner v1 локальный |

## Audit snapshot (current codebase)

Уже есть:

- `Recipe` + ingredients + cooked yield + optional per-100g
- Diary `FoodEntry` + meal slots + daily targets on `Profile`
- `parseRecipeText` / import personal recipes
- Common food catalog seeds + favorites / frequent
- Nutrition domain (portion, unknown handling)

Нет:

- meal plans, pantry, shopping lists, budgets, store prices
- Eat Now / planner UI surface
- Remaining cooked-batch inventory after diary log

## Related docs

- UX: `docs/21-FOOD-PLANNER-UX.md`
- Data / contracts: `docs/22-FOOD-PLANNER-DATA.md`
- ADR-008: `docs/14-DECISIONS.md`
- Smart import: `docs/19-SMART-RECIPE-IMPORT.md`
