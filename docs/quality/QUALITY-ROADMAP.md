# Quality Roadmap

**Статус:** утверждён основателем 2026-10-20 с корректировками приоритетов.  
**Feature Freeze:** 2–3 недели. Dispatcher — dry-run. Без auto-merge. Без новых product features.

Эталонный сценарий Quality Sprint:  
**открыть → привычный продукт → граммы → запись в дневнике** (секунды, без навигационной путаницы).  
Спорт / привычки / planner — после отработки пищевого дневника.

Связь: `QUALITY-BACKLOG.md` · `PRODUCT-AUDIT.md` · `PERFORMANCE-BASELINE.md`.

---

## Утверждённая последовательность

### Этап 1 — Baseline (сейчас)

- Синтетические datasets (D0…D10k и т.д.)
- Node benchmarks (отдельно от emulator/device)
- Android UI smoke (Maestro или ручной протокол)
- **Q-P1-04** — замер повторного добавления (≤10 с) на устройстве/эмуляторе

**Exit:** таблица baseline заполнена хотя бы для Node + протокол device; ничего не выдаём за device без прогона.

### Этап 2 — Reliability

- **Q-P0-01** persist / kill-app / restart  
- **Q-P0-02** double-submit  
- Offline add path  

**Exit:** сохранность и отсутствие дублей подтверждены в подходящей среде.

### Этап 3 — Упростить core food UX

- **Q-P1-01** Today hierarchy  
- **Q-P1-02** Food diary vs catalog  
- Discovery confusion (где рецепт?) — продуктовый фокус, не рефакторинг ради LOC  

**Каждое UX-изменение:** проблема → as-is → to-be → −N действий → screenshots → тесты → perf impact.

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
