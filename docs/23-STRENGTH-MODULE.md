# Strength module (силовые) — PRD slice

**Статус:** Stage 01 domain (snapshot v19) → UI next  
**ADR:** ADR-011 in `docs/14-DECISIONS.md`  
**Философия:** быстро в зале (≤15 с до записи подхода), шаблон ≠ факт, без стыда за перенос, без 6-й вкладки.

## Экраны

| Зона | Поведение |
|------|-----------|
| Движение | Недельная доска карточек + конструктор + активная сессия |
| Сегодня | Ближайшая плановая + «Начать» (после Stage 02) |
| Прогресс | Рабочий вес × повторы по упражнению (Stage 03) |
| Питание | Без авто-возврата ккал тренировки |

## Сущности (snapshot v19)

- `Exercise` — справочник  
- `WorkoutTemplate` + `WorkoutTemplateExercise` — многоразовый план  
- `PlannedActivity` — событие на дату (сила / кардио / отдых)  
- `WorkoutSession` + `WorkoutSet` — факт; перенос плана **не** меняет историю  

## Этапы

1. Конструктор + журнал + черновик после kill  
2. Недельная доска: меню Перенести / Копировать (drag позже)  
3. Аналитика силы  
4. Google Calendar — отдельно  

## Anti-regression

Не трогать Food order, Garmin overlay, portion grams, sleep GMT, widget revision (`ANTI-REGRESSION.md`).
