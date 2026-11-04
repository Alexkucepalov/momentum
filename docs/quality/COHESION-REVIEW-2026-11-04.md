# nf-fit — полное ревью цельности

**Дата:** 2026-11-04  
**Автор:** AI coding session (Composer)  
**База:** `main` @ ~`662d954` + незакоммиченная ветка `feat/week-meal-board`  
**Связано:** `PRODUCT-FULL-AUDIT-2026-11-04.md`, `FRIENDS-BETA-STATUS.md`, `17-DEV-PLAN.md`, `PRODUCT-ROADMAP.md`

Это не очередной список микрофиксов. Цель документа — **остановиться**, увидеть продукт целиком и решить, что считать «готовым целым», а что — шумом.

---

## 0. Вердикт в трёх предложениях

1. **Ядро продукта сильное и уже цельное по смыслу:** offline дневник, `unknown ≠ 0`, plan ≠ diary, 5 вкладок, DS Premium Minimal, verify зелёный, overhaul stages 1–11 на main.  
2. **Цельность ломается не архитектурой вкладок, а накоплением параллельных UX-экспериментов** (цвет → Progress → Profile → Sleep → Week board → Drinkit-карусель) без freeze, без device Pass и без одного визуального эталона «день пользователя».  
3. **Друзьям раздавать рано** (`Friends Beta = BLOCKED`). Основателю — да, как личный APK. Следующий правильный шаг — **не новые фичи**, а стабилизация ветки + device Pass + один cohesion-pass по Today/Food.

---

## 1. Что уже сделано (факт)

### 1.1 На `main` (продактовый фундамент)

| Блок | Статус | Смысл для пользователя |
|------|--------|------------------------|
| Overhaul 1–11 | Merged | Одна IA, один DS, planner/Garmin/reports |
| Fast food (#175, #186) | Merged | Copy yesterday, recent «+», undo paths |
| 5 tabs | Done | Сегодня · Питание · Движение · Прогресс · Профиль |
| Widgets (#185) | In APK | Glance на home screen |
| Release Lock | Документ | Нет Play / нет major features до device Pass |
| Domain nutrition / recipes / Garmin map | Strong | Чистые функции, snapshot, secrets в SecureStore |

**Оценка фундамента: A−** как offline companion для dogfood.

### 1.2 В текущей ветке `feat/week-meal-board` (не смержено, смесь тем)

Одна ветка сейчас несёт **несколько разных намерений**:

| Тема | Что появилось | Зрелость |
|------|---------------|----------|
| Progress declutter | Перестройка сегментов / инсайты | Средняя, без отдельного issue-фокуса |
| Profile «человеческий» | Переписан copy/layout, убран «ты» | Средняя |
| Accent → neutral | `accentSoft` серый, mono ink | Локально ок, но история «teal→blue→warm→neutral» = дёрганье |
| FlashBar toast | Анимация + иконки | Ок как polish |
| Weight sparkline | Мин. span 2 кг | Ок, точечно |
| Activity declutter | Компактнее summary | Ок |
| Sleep stats | `sleepStats` + richer SleepDayPanel + mapSleep | Сильный domain; UI ещё плотный |
| **Week meal board** | `ensureWeekDraftPlan`, колонки, sheets add/move/edit | Рабочий MVP |
| **Drinkit-эксперимент** | DayRail, snap-карусель, dock, spring press | **Снят (Task 0, 2026-11-04)** — оставлен simple week board MVP |

**Проблема ветки:** это уже не «один issue → один PR». Diff ~2.1k / −1.5k строк + куча untracked plan UI. Так нельзя спокойно ревьюить и откатывать.

### 1.3 Что intentionally хорошо (не ломать)

- Plan не пишет в дневник сам.  
- `unknown ≠ 0`, snapshot КБЖУ при записи.  
- Нет shame-streaks / medical coaching / silent AI nutrition.  
- Общая `dateLocal` между вкладками.  
- Токены в одном файле (`src/design-system/tokens.ts`).

---

## 2. Где приложение не «одно целое»

### 2.1 Продуктовая ось размыта

**North-star PRD:** повтор еды ≤10 с.  
**Факт поведения команды в последних сессиях:** Progress → Profile → Sleep → Week board → Drinkit motion.

Это разные продукты:

| Ось | Вопрос пользователя | Экран |
|-----|---------------------|--------|
| A. Скорость лога | «Что я только что съел — в дневник за 10 с» | Today / Food |
| B. Картина дня/недели | «Как я ем и сплю» | Progress / Movement |
| C. Рацион наперёд | «Что приготовлю» | Plan board |
| D. Delight / motion | «Приятно ли трогать» | Drinkit-эксперимент |

Пока A не доказан на device, B/C/D — украшения вокруг недоказанного ядра.

### 2.2 Визуальный язык — формально один, ритм разный

| Паттерн | Где так | Где иначе |
|---------|---------|-----------|
| SegmentedControl | Food, Activity\|Sleep, Progress | Plan hub — список ссылок |
| Sticky primary CTA | Today/Food Add | Progress — размыто; Plan board — dock «Добавить» |
| Day chrome | DayStrip на Today/Food/Activity | Week board — свой DayRail (третий язык даты) |
| Карточки | Food diary всё ещё «карточки»; Progress — стены карточек | Board — колонки+dock (новый паттерн) |
| Toast | FlashBar на части экранов | Не везде едино |
| Empty state | Разный copy и плотность | Board: «нажми, чтобы добавить» — ок, но локально |

**Вывод:** DS tokens ≠ visual cohesion. Нужен **один chrome дня** и **один паттерн primary action**, а не новый rail на каждом экране.

### 2.3 Plan / Diary mental model

Сильная идея продукта: **факт ≠ черновик**.  
Слабость UX: входы в Plan (compass в header, Eat Now, Доска, Покупки) стоят рядом с дневником без постоянного короткого якоря «это не дневник».

Week board усиливает ценность рациона, но **увеличивает поверхность**, где пользователь может перепутать «запланировал» и «съел».

### 2.4 Инженерия vs скорость итераций

| Факт | Риск |
|------|------|
| `foodRepository` god-object | Любая plan/sleep правка = blast radius |
| Global `revision` | Любая мутация → широкий re-render |
| Full JSON snapshot | Ок dogfood; не «годы истории» |
| UI blobs (Profile, Progress, AddFoodSheet) | Сложно править «чуть-чуть» без регрессий |
| Почти нет UI/E2E | Verify зелёный ≠ «экран не сломан на web/Android» |
| HMR + `useState(createRepo)` | Уже ловили: новый метод repo «не существует» до hard reload |

### 2.5 Процесс

DEV-PLAN / Friends Beta явно говорят: **Release Lock — device Pass first, major features freeze**.  
Сессия нарушила дух lock: крупный board + motion-эксперимент без device evidence и без отдельного issue/PR на каждую тему.

Это честный источник усталости: бесконечные правки без точки «готово».

---

## 3. Оценка по областям (сейчас)

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| Vision / PRD P0 | A− | Ядро есть |
| Цельность IA (5 tabs) | A− | Совпадает с roadmap |
| Цельность UX «день» | C+ | Today всё ещё dashboard-heavy |
| Скорость лога (код) | B+ | Paths есть |
| Скорость лога (device) | ? | BLOCKED |
| Plan ≠ diary clarity | B− | Технически ок, когнитивно рискованно |
| Week board MVP | B | Полезен; Drinkit-слой снят (Task 0) |
| Sleep / Garmin depth | B | Domain↑; device/Garmin unverified |
| Progress clarity | B− | Перестроен, primary action всё ещё спорный |
| Profile | B | Человечнее; всё ещё «свалка» функций |
| Visual system | B | Tokens ok; rhythm/patterns drift |
| Engineering health | B− | Domain A; persist/repo C+ |
| Release readiness | **BLOCKED** | Нужен human device Pass |

---

## 4. Что я считаю нужно исправить (по приоритету)

Не «ещё 40 полировок». Три слоя.

### Слой 0 — Stop & ship hygiene (сегодня / завтра)

1. **Drinkit снят (Task 0, 2026-11-04)** — оставлен simple week board MVP.  
2. **Разрезать `feat/week-meal-board` на логические PR** (или осознанный RC-пакет с явным списком тем — по согласованию).  
3. **Не мержить в main** до явного разрешения + `npm run verify`.  
4. **Device Pass** по `DEVICE-DOGFOOD-15MIN.md` — единственный unblock Friends Beta.

### Слой 1 — Сделать продукт одним (cohesion pass, 1–2 PR)

Цель: один пользовательский день ощущается одинаково.

| # | Работа | Зачем |
|---|--------|--------|
| C1 | **Today fold = скорость:** recent 3–6 + copy yesterday above fold; habits ниже | Вернуть north-star |
| C2 | **Один DayChrome** (DayStrip) на Today/Food/Activity; Week board — исключение с подписью «план недели», не третий календарь-язык без нужды | Убрать тройной UI даты |
| C3 | **Один FlashBar / undo contract** на всех add-path | Доверие к быстрым действиям |
| C4 | Постоянный micro-caption plan≠diary в Plan stack + Eat Now | Снять путаницу |
| C5 | Food diary: компактные строки (если ещё не везде) | Плотность = скорость правки |
| C6 | Progress: один primary «Скопировать день» + ≤3 сегмента above fold | Экран с одной работой |
| C7 | Profile: группы Goals / Data / Integrations — без новых фич | Свалка → карта |

### Слой 2 — Решения по экспериментам (выбрать явно)

| Эксперимент | Рекомендация |
|-------------|--------------|
| Week board (колонки + add/move/edit) | **Оставить** как Plan feature; упростить UI до «неделя + список/колонки без карусельного театра», если Drinkit утомляет |
| DayRail + snap + dock | **Либо** принять как стандарт Plan-only, **либо** откатить к горизонтальному scroll без focus-theatre. Не тащить на Today/Food |
| Rich sleep stats | **Оставить domain**; UI ужать до 1 summary + details expand |
| Accent churn | **Freeze tokens** на текущем mono/neutral; запрет новых «давай цвет» без issue |
| FlashBar motion | Оставить; не усложнять |

---

## 5. Целевая картина «единое целое» (definition of done)

Приложение считается цельным, когда:

1. **Открыл → за 10 с повторил еду** (device stopwatch n≥10).  
2. На любом экране дня понятно: **что уже факт**, что черновик плана.  
3. Дата/навигация дня — **один паттерн** (кроме осознанного Plan week).  
4. Primary action на каждом root tab **один и очевиден**.  
5. Визуал: tokens + одинаковые CTA/empty/toast; без локальных «новых языков».  
6. Friends Beta checklist подписан человеком.  
7. Нет смешанных mega-веток: 1 issue → 1 PR.

Пока п.1 и п.6 открыты — любые Drinkit/board polish = развлечение, не продукт.

---

## 6. Рекомендуемый порядок работ (без бесконечности)

```
1) Решение по ветке week-meal-board
   ├─ A: вырезать только board → PR «Plan week board MVP»
   ├─ B: Progress/Profile/Sleep/Flash/Weight → отдельные PR от main
   └─ C: Drinkit layer — keep minimal OR revert to simple board
2) verify + PR review (без merge в main без человека)
3) Device Pass (human) → обновить FRIENDS-BETA-STATUS
4) Один cohesion PR: Today fold + DayChrome + undo contract
5) Только потом: board polish / sleep expand / widgets feel
```

**Явно не делать сейчас:** drag-and-drop как в Drinkit, новый цвет акцента, новый root tab, split FoodRepository, normalized SQLite, Play upload.

---

## 7. Честный разбор сессии (почему усталость)

| Что было полезно | Что размыло фокус |
|------------------|-------------------|
| Sleep completeness (domain) | Несколько UI-тем в одной ветке |
| Plan board как замена «меню на неделю» | Сразу поверх — Drinkit motion |
| Neutral accent / human Profile | Серия «ещё чуть-чуть» без DoD |
| Фикс nested `<button>` на board | Реактивный debug вместо freeze scope |

Паттерн: **хорошие локальные улучшения без контракта «что закрываем»**. Усталость закономерна.

---

## 8. Моё мнение (прямо)

- Продукт **уже достаточно богат**. Ему не хватает не фич, а **дисциплины цельности и доказательства на телефоне**.  
- Week board — правильное направление для рациона, если остаётся простым инструментом плана.  
- Drinkit-интерактив на доске — интересный прототип; **не стоит делать его новым стандартом всего приложения**, пока Today не «щёлкает» за 10 секунд.  
- Лучший подарок продукту сейчас: **разрезать ветку, заморозить эксперименты, прогнать device Pass, один cohesion-pass по Today/Food**.

Если нужно одно решение «на завтра»:  
**Shipable path = simple week board MVP + freeze motion + device Pass.** Всё остальное — бэклог после Pass.

---

## 9. Приложение: карта «оставить / упростить / отложить»

| Элемент | Действие |
|---------|----------|
| 5 tabs IA | Оставить |
| DS tokens mono/neutral | Freeze |
| Diary / catalog / copy yesterday / recent+ | Оставить; доказать device |
| Week board CRUD + move sheet | Оставить (упростить UI) |
| DayRail + snap scale + dock | Упростить или оставить только в Plan |
| Rich sleep panels | Ужать UI |
| Progress rewrite in branch | Отдельный PR / review |
| Profile rewrite in branch | Отдельный PR / review |
| Дальнейший Drinkit drag | Отложить |
| Friends Beta раздача | После device Pass |

---

*Конец ревью. Следующий артефакт по запросу: конкретный plan разрезания PR / checklist device Pass — без нового кода, пока не скажешь «делаем X».*
