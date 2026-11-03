# Предложения по улучшению экранов — nf-fit

**Дата:** 2026-11-03  
**Контекст:** post-overhaul `main` (#174–#184), dogfood APK с swipe/Today/widgets.  
**Ограничения:** offline-first · `unknown ≠ 0` · plan ≠ diary · без shame · без выдуманных КБЖУ · Release Lock: сначала device Pass, потом крупные фичи.

Шкала приоритета: **P0** трение / баг опыта · **P1** скорость north-star · **P2** ясность / плотность · **P3** nice-to-have.

---

## 0. Северная звезда (не менять)

1. Повтор еды **≤10 с** на midrange Android.  
2. Один понятный «остаток дня» (ккал + БЖУ), без морали.  
3. Лог → сразу обновлённые цифры везде.  
4. Garmin/сон/шаги — атрибуция источника; нет данных = «—», не 0.

---

## 1. Сегодня — `(tabs)/index`

**Роль:** командный центр дня + быстрый лог.

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| T1 | Ring: крупно **остаток** ккал (цель − еда + активность), съедено/сожжено вторично | P1 | Отвечает «можно ли ещё поесть?» |
| T2 | Склеить ring + БЖУ-бары в **одну** карточку; 2×2 метрики оставить компактнее или «ещё» | P1 | Сейчас кольцо + 4 карточки конкурируют |
| T3 | Above-fold: дата · strip · ring · **3 recent/fav** · sticky Add; привычки ниже fold | P1 | Сократить скролл до первого лога |
| T4 | Тап по слоту приёма (завтрак…) → Add уже с meal | P1 | Как в лучших трекерах: строка = вход |
| T5 | Анимация ring после add (краткий pulse) | P2 | Обратная связь = награда |
| T6 | Пустой день: один CTA «Добавить первую запись» + copy yesterday если есть | P2 | Уже частично; усилить |
| T7 | Не тащить Plan-хаб в first viewport (иконка в header ок) | P2 | Сейчас компас в header — оставить |

---

## 2. Питание — `(tabs)/food`

**Роль:** дневник дня vs каталог (уже SegmentedControl).

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| F1 | Дневник: **компактные строки**, не тяжёлые карточки на каждую запись | P1 | Плотность, меньше «карточного шума» |
| F2 | Swipe: edit / copy-to-day / delete (сейчас delete+trash) | P1 | Скорость правок |
| F3 | Каталог: запомнить последний фильтр; пустой поиск → recent | P1 | Повторный путь |
| F4 | Sticky footer: Add primary; scan right (уже); long-press Add → Quick kcal | P2 | Ещё быстрее |
| F5 | Сумма дня / приёма в sticky mini-bar при скролле дневника | P2 | Не терять totals |
| F6 | Явнее dual model: «Дневник» = факт, «Каталог» = база (короткий caption) | P2 | Снизить путаницу с Today |
| F7 | Copy yesterday / repeat meal — всегда видимы, когда применимо | P1 | North-star |

---

## 3. Движение — `(tabs)/activity` (+ sleep redirect)

**Роль:** Activity \| Sleep на общей дате.

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| M1 | Above-fold: шаги · минуты · ккал тренировок одной полосой | P1 | Сегодня уже шлёт сюда; экран должен отвечать сразу |
| M2 | Sleep: stages bar + «оценка» только если Garmin; empty → «Синк Garmin» deep-link | P1 | Device gate + ясность |
| M3 | Workout row → detail chart уже есть; добавить «повторить вчерашнюю» | P2 | Параллель food repeat |
| M4 | Не дублировать DayStrip+swipe конфликт со списками (как food) | P0 | Уже чинили food; держать паттерн |
| M5 | Неделя шагов sparkline под summary | P2 | Прогресс без ухода в Progress |

---

## 4. Прогресс — `(tabs)/progress`

**Роль:** неделя / тело / привычки / отчёты (4 сегмента).

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| R1 | Default tab: **обзор 7 дней** с одним инсайтом (без wall of cards) | P1 | Primary action размыт |
| R2 | Challenges → подсекция «Ещё» / отдельный экран | P2 | Плотность |
| R3 | Reports: один primary «Скопировать день для ChatGPT» + secondary PDF | P1 | JTBD анализа |
| R4 | Month overview: тап по дню → setDateLocal + Today | P2 | Навигация по данным |
| R5 | Body: вес + BMI рядом; ввод кг с клавиатурой decimal | P2 | UX ввода |
| R6 | Без «оценки дня» / красных fail streaks | — | Уже принцип; не ломать |

---

## 5. Профиль — `(tabs)/profile`

**Роль:** цели · интеграции · данные · приватность.

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| P1 | Секции-аккордеоны: Цели → Интеграции → Данные → О приложении | P1 | Экран ~длинный |
| P2 | Garmin card: last sync + warnings наверху (уже Stage 7) + CTA «Открыть Garmin» | P1 | Dogfood path |
| P3 | Export/import: wizard «экспорт → share» / «вставить JSON → preview → replace» | P1 | Меньше страха wipe |
| P4 | Цели КБЖУ: live preview ring mini при blur | P2 | Понятность |
| P5 | Убрать дубль day-report если он уже в Progress | P2 | Один путь анализа |
| P6 | Privacy one-pager: что локально / что уходит в Garmin/OFF | P2 | Trust |

---

## 6. Add Food / sheets (не routes, но ядро)

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| A1 | Разбить `AddFoodSheet` по зонам: Recent · Search · Recipes · Quick · Scan | P1 | Monolith ~860 LOC = риск |
| A2 | ConfirmPortion: степпер крупнее; last grams default; macro preview above fold | P1 | Critical path |
| A3 | После confirm — сразу закрыть sheet + flash + undo (уже); haptic | P2 | Ощущение скорости |
| A4 | Barcode: offline last-hit cache badge; fail → manual product без потери meal | P1 | Сеть/OFF |
| A5 | «Мои продукты» / bulk import — entry ≤2 тапа из sheet | P2 | Own catalog JTBD |

---

## 7. Рецепты — `/recipes/*`

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| Q1 | Index: Chip filters + cook-again сверху (≤2 тапа с Today) | P1 | Discovery |
| Q2 | Detail: primary «В дневник» / secondary «Сварить партию» | P1 | Clear CTA |
| Q3 | Import-text: preview unknown macros явно; не блокировать save без kcal | P1 | unknown≠0 |
| Q4 | Editor: sticky Save; клавиатура не закрывает yield | P2 | Device IME |
| Q5 | Personal import: короче copy; успех → detail | P2 | Friction |

---

## 8. План — `/plan/*`

**Принцип:** запланированное ≠ съеденное (уже notice).

| Screen | Предложения | Prio |
|--------|-------------|------|
| **Hub** | Primary только Eat Now / Recipes / Pantry; week/shop/budget secondary (уже); сократить subtitles | P2 |
| **Eat Now** | Показывать remaining macros крупно; empty → «нет целей / нет запасов» с CTA | P1 |
| **Pantry** | Coverage % → Eat Now; expiry/«мало» без shame | P2 |
| **Week** | Drag порций позже; сейчас — ясный «В дневник» на порцию | P1 |
| **Shop** | Missing-only default; цены optional | P2 |
| **Budget** | Четыре метрики уже ok; sparkline spent vs limit | P2 |
| **Receipt** | Preview confirm сильнее; post-import → pantry | P1 |
| **Stores** | Оставить в «Ещё»; не развивать без live-цен | P3 |

---

## 9. Garmin — `/garmin/*`

| # | Предложение | Prio | Почему |
|---|-------------|------|--------|
| G1 | Sync screen: progress + last OK/fail; collapsible warnings (есть) | P1 | Device QA |
| G2 | Key screen: paste + mask + «ключ только на устройстве» | P1 | Trust |
| G3 | Workout detail: DS ChartFrame; back to day | P2 | Visual |
| G4 | Data browser: filter by type; empty honest | P2 | Dogfood debug |

---

## 10. Виджеты / система

| # | Предложение | Prio |
|---|-------------|------|
| W1 | После install подсказать «добавь виджет дня» (один раз) | P2 |
| W2 | Compact widget: remaining kcal если цель известна | P2 |
| W3 | Быстрый APK-профиль: только `arm64-v8a` для dogfood | P1 | Сборка ~1ч → ~15–25м |
| W4 | TalkBack pass critical: Today Add, Food delete, ConfirmPortion | P0 | Gate |

---

## 11. Сквозные улучшения

| Тема | Предложение | Prio |
|------|-------------|------|
| Дата | Единый DayChrome везде (strip + jump Сегодня) | P1 |
| Undo | Единый UndoBar timeout + a11y announce | P1 |
| Пустые состояния | Всегда 1 CTA + 1 secondary | P1 |
| Ошибки | ErrorBanner + action, без silent fail | P1 |
| Performance | Snapshot write off UI thread (после device measure) | P1 |
| Docs | SCREEN-AUDIT refresh после каждого UI PR | P2 |

---

## 12. Что **не** делать сейчас

- Новый root tab / ChatGPT API / OCR / Health Connect / cloud  
- Rewrite `foodRepository` «на всякий»  
- FlatList everywhere без hotspot  
- Shame streaks / calorie judgment colors  
- Live store prices  

---

## 13. Рекомендуемая очередь (после device Pass #36–#38)

1. **T1–T3 + F1/F7** — Today/Food speed & hierarchy  
2. **A1–A2** — AddFood split + portion UX  
3. **P1 + R1/R3** — Profile/Progress clarity  
4. **M1–M2 + G1** — Movement/Garmin dogfood  
5. **W3** — fast APK build profile  
6. Plan Eat Now / Week «В дневник» polish  

---

## 14. Вердикт

Продукт уже богатый companion; главный выигрыш не в новых модулях, а в **сжатии пути лога** и **иерархии цифр дня**. Сегодня/Питание/AddFood — 80% ценности; Plan/Progress — вторичный слой; Profile/Garmin — доверие и данные.
