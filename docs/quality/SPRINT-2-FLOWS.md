# Sprint 2 — 6 ключевых UX flow

Легенда: **E** = из кода/аудита · **H** = гипотеза до device dogfood.

---

## Flow 1 — Повтор привычной еды (north-star)

| | As-is | To-be |
|---|--------|--------|
| Проблема | Recent конкурирует с shortcuts/plan; путь размазан Today+Food | Один primary + recent above fold |
| Путь | Today → (scroll) → chip/recent **или** Food → catalog | Today → Недавно → [portion?] → diary |
| Экраны | 1–3 | 1–2 |
| Действия | 2–5+ (**H**) | 1–2 (one-tap) или 2–3 (portion) |
| Success | ≤10 s device (**gate open**) | То же + измерить после S2-1 |

**−N:** убрать обязательный проход через JourneyShortcuts / каталог Food.

---

## Flow 2 — Добавить новый продукт

| | As-is | To-be |
|---|--------|--------|
| Проблема | Add sheet + Food catalog дублируют поиск | Sheet = канон добавления; Food Каталог = browse |
| Путь | + → search/tabs → portion → save | Сегодня/Food [+] → поиск → portion → save |
| Success | Запись + flash; guard от double-tap | Без лишних meal-chip сверху sheet |

---

## Flow 3 — Исправить дневник (граммы / удалить)

| | As-is | To-be |
|---|--------|--------|
| Проблема | Food смешивает дневник с каталогом — скролл мимо слотов | Сегмент **Дневник** по умолчанию |
| Путь | Food → scroll past catalog → meal card | Food → Дневник → tap entry → edit |
| Success | Undo на delete; totals update | То же, меньше скролла |

---

## Flow 4 — Найти / приготовить рецепт

| | As-is | To-be |
|---|--------|--------|
| Проблема | Рецепты в sheet, `/recipes`, архив, план — путаница (**E**) | Один stack «Рецепты» + deep links |
| Путь | 3–4 входа с разным copy | Сегодня link / Food / sheet → `/recipes` |
| Success | Повтор cook ≤3 тапа (**H**) | Copy унифицирован |

**Не делать:** новый «суперпоиск» — только IA + labels.

---

## Flow 5 — Что съесть сейчас → дневник или план

| | As-is | To-be |
|---|--------|--------|
| Проблема | Вход через shortcuts/plan hub; Today strip конкурирует | Today: secondary plan strip; primary всё ещё Add |
| Путь | План → Eat Now → В дневник / В план | То же, но Today не пестрит равными CTA |
| Success | planned ≠ eaten сохранён | — |

---

## Flow 6 — Неделя → покупки (planner glue)

| | As-is | To-be |
|---|--------|--------|
| Проблема | Hub плоский; budget/stores рядом по весу | Нумерация сценария 1→4; budget в «Ещё» |
| Путь | hub → week → shop | Copy: «Сначала меню, потом покупки» |
| Success | Без новых API | — |

---

## Cross-cutting

| Тема | Решение Sprint 2 |
|------|------------------|
| Два «дома» лога | Today = скорость; Food = контроль дня |
| Модалки | Оставить portion confirm; не плодить |
| Empty | Hint «куда идти» из таблицы IA |
| Android gate | Flows не Done без dogfood после UI PR |
