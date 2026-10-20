# Quality Roadmap

**Статус:** утверждён основателем 2026-10-20 с корректировками приоритетов.  
**Feature Freeze:** 2–3 недели. Dispatcher — dry-run. Без auto-merge. Без новых product features.

Эталонный сценарий Quality Sprint:  
**открыть → привычный продукт → граммы → запись в дневнике** (секунды, без навигационной путаницы).  
Спорт / привычки / planner — после отработки пищевого дневника.

Связь: `QUALITY-BACKLOG.md` · `PRODUCT-AUDIT.md` · `PERFORMANCE-BASELINE.md`.

---

## Утверждённая последовательность

### Этап 1 — Baseline

- Node fixtures/benches — **сделано** (#39)  
- Android dogfood 15 мин — **OPEN GATE** (`DEVICE-DOGFOOD-15MIN.md`)  
- Q-P1-04 / Q-P0-01 device — pending  

### Этап 2 — Reliability (частично)

- Q-P0-02 double-submit — **код в main**; device §2a/2b pending  
- Kill-app — pending device  

### Этап 3 — UX Sprint 2 (проектирование → код после approve)

См. **`SPRINT-2-UX-PLAN.md`**. Сначала IA + wireframes Today/Food; код только после согласования.  
Android gate остаётся открытым: UI PR ≠ Done без dogfood.

### Этап 4 — Узкие места (по данным baseline)

- **Q-P1-03** AddFoodSheet по **ответственности** (+ регрессионные тесты), **не** «каждый файл &lt;300 LOC»  
- **Q-P1-05** FlatList **только** где измерен bottleneck (каталог тысяч), не для коротких списков  

### Этап 5 — Visual polish & a11y

- DS sync, nav, profile, habits, TalkBack, errors  
- PR #20 (catalog polish) — human review → merge или close  

### Явно не делать в freeze

- Rewrite `foodRepository` / нормализованный SQLite без доказанной нужды  
- FP-8+, AI, OCR, live prices, sports expansion  
- `agent-ready` на feature queue  

---

## PR-план Quality Sprint 1 (ручной merge)

| Порядок | Тема | Issues | Заметки |
|---------|------|--------|---------|
| 1 | Docs approval + roadmap sync | (этот PR / docs) | Уже в работе |
| 2 | Perf fixtures + Node benches | QS: fixtures | CI-safe |
| 3 | Double-submit coverage | Q-P0-02 | Unit + inventory |
| 4 | Maestro/manual smoke + persist protocol | Q-P0-01 | Emulator/device evidence |
| 5 | Repeat-meal timing protocol | Q-P1-04 | Device preferred |
| — | PR #20 FoodCatalogList | #5 | Отдельный human merge |

Dispatcher **не** включать.

---

## Definition of Done (Quality)

Изменение готово не после зелёного CI, а после проверки **пользовательского сценария** в заявленной среде (Node / emulator / device — явно указать).

---

## Success

Momentum **проще, быстрее, надёжнее** на пути пищевого лога — не «больше функций».
