# UX Flows — JTBD analysis

**Источник:** code walkthrough 2026-10-20. Длительности — **оценка / Hypothesis**, пока нет device timing.

Легенда доказательств: **E** = код/UI структура; **H** = гипотеза, нужна проверка на устройстве.

---

## JTBD 1 — Быстро записать еду

| Поле | Содержание |
|------|------------|
| Проблема | Повтор еды должен быть ≤10 с (PRD north-star) |
| Текущий путь A | Сегодня → chip Recent в AddFoodBlock → flash | **E** `index.tsx` |
| Текущий путь B | Сегодня → «Добавить» → AddFoodSheet → Recent/Search → ConfirmPortion → save | **E** |
| Текущий путь C | Питание → catalog card → portion → save | **E** `food.tsx` |
| Экраны / слои | 1–3 (tab + sheet + portion) |
| Действия (идеал) | 1 tap | Фактически: 1–5+ |
| Препятствия | Выбор meal chip до add; sheet tabs; portion confirm даже для known repeat (**H** ценность confirm) |
| Избыточное | Дублирование add на Today и Food; JourneyShortcuts отвлекают |
| Неочевидное | Global `meal` в DataContext влияет на repeat target |
| Точки отказа | Нет productId/recipeId у quick entry → silent skip в `repeat()` | **E** |
| Идеал | Recent 1-tap с last grams; undo; meal inferred by time |
| Success metric | P50 repeat ≤10s на midrange Android; 0 silent failures |

---

## JTBD 2 — Не знаю, что приготовить

| Поле | Содержание |
|------|------------|
| Проблема | Нужен dish из того, что дома / из рецептов |
| Путь | План → Запасы / Eat Now «Дома» / Рецепты | **E** |
| Экраны | Hub + 1–2 |
| Препятствия | Pantry пустой → Eat Now «Дома» empty; нет явного «из запасов сварить» | **E/H** |
| Идеал | Один вход «Из дома»: batches + recipes matching pantry % |
| Success | ≥1 полезный candidate при непустом pantry (**H** dogfood) |

---

## JTBD 3 — Перекус / что съесть сейчас

| Поле | Содержание |
|------|------------|
| Проблема | Остаток КБЖУ → варианты без запрета |
| Путь | Сегодня shortcut «Сейчас» / План → Eat Now → В дневник / В план | **E** |
| Препятствия | Без daily targets — empty guidance; candidates только с known macros; catalog seed dump уже убран (хорошо) | **E** |
| Идеал | Soft remaining strip + 3 cards + diary/plan |
| Success | Открыть → выбрать → diary ≤30s (**H**) |

---

## JTBD 4 — Нормально питаться неделю

| Поле | Содержание |
|------|------------|
| Проблема | Меню + готовка + покупки |
| Путь | План → Неделя → draft → Shop → (Budget) | **E** |
| Препятствия | Draft из всех recipes может шуметь; цены ручные; budget secondary | **E/H** |
| Избыточное | Stores tags без влияния на list |
| Идеал | 3/5/7 draft → edit portions → shop need-to-buy → optional budget |
| Success | Основатель использует week≥1 раз/нед без обхода в notes (**H**) |

---

## JTBD 5 — Понимать прогресс

| Поле | Содержание |
|------|------------|
| Проблема | Вес / еда / спорт / привычки без стыда |
| Путь | Прогресс tab: charts, habits panel, challenges, PDF | **E** `progress.tsx` |
| Препятствия | Информационная плотность; challenges vs habits dual model | **E/H** |
| Идеал | Default: week food + weight; secondary: habits; tertiary: challenges |
| Success | Пользователь находит вес и kcal week <5s (**H**) |

---

## JTBD 6 — Не вводить одни и те же данные

| Поле | Содержание |
|------|------------|
| Проблема | Повтор ввода КБЖУ/рецептов |
| Пути | Saved meals, copy yesterday, cook-again, import-text, import-personal, aliases | **E** |
| Препятствия | Discovery размазан (Recipes / Archive / Sheet recipes tab) | **E** |
| Идеал | «Повторы» hub: recent, saved, yesterday, imports |
| Success | Second log of same dish ≤3 taps |

---

## Cross-cutting flow smells

1. **Два «дома» для еды:** Сегодня vs Питание — оба с add + plan strip (**E**).
2. **План спрятан:** header icon + hub + shortcuts — 3 входа, нет root tab (**E**, by ADR-008 intentional).
3. **Portion gate:** почти везде ConfirmPortion — правильно для unknown, может тормозить known favorites (**H**).
4. **Flash ≠ Undo:** flash на add; undo в основном на delete (**E**).
