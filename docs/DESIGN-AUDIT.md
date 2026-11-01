# Momentum — Design Audit (Этап 0)

**Дата:** 2026-11-01  
**Метод:** static review кода экранов + токенов + существующих quality audits.  
**Не заменяет:** device visual pack / скриншоты с физического Android.  
**Целевое направление после approve:** Premium Minimal Utility (`docs/DESIGN-SYSTEM.md`).

Легенда проблем: **P0** блокирует цельность продукта · **P1** заметно на каждом открытии · **P2** polish.

---

## 1. Глобальные проблемы (все экраны)

### P0 — Нет единого «лица» приложения

**Что не так:** параллельно живут Soft Utility tokens, legacy `PrimaryButton`/`theme` пути, локальные StyleSheet «как получилось», остатки разных pass’ов (Nothing / Soft Light / Garmin dogfood). Вкладки ощущаются как соседние мини-приложения.

**Паттерн вместо этого:** один token contract + обязательные primitives (`AppText`, `AppCard`, `AppButton`, `Screen`, `Sheet`, `EmptyState`, `Chip`, `Metric`). Запрет локальных hex вне токенов.

### P0 — Конкурирующие CTA и слабая иерархия

**Что не так:** на Today/Food/Progress несколько равносильных кнопок и карточек в первом экране. Пользователь не считывает «главное действие».

**Паттерн:** один primary CTA на fold; secondary — text/ghost; tertiary — icon. Данные (метрики) выше действий, действия выше настроек.

### P1 — Spacing без системы

**Что не так:** смесь `space.sm/md/lg`, отрицательные margin (`-4`), ad-hoc `gap`, разные вертикальные ритмы между блоками даже на одном скролле.

**Паттерн:** вертикальный ритм только из scale 4/8/12/16/24/32; секции = 24 между блоками, 12 внутри карточки; никаких «подкруток» отрицательными margin.

### P1 — Два date-chrome

**Что не так:** `DayStrip` (недельные чипы + календарь) и `DateSwitcher` (стрелки/дата) решают одну задачу по-разному. Food всё ещё на DateSwitcher; Today/Activity/Sleep — DayStrip.

**Паттерн:** один `DayChrome` (strip + optional calendar entry + swipe hint). Удалить второй визуальный язык.

### P1 — Карточки vs «не-карточки»

**Что не так:** `AppCard` с крупным radius соседствует с hairline-блоками и panel-in-panel (каталог раньше имел тяжёлую рамку; частично упрощён).

**Паттерн:** surface только когда есть взаимодействие или отдельный смысл блока; иначе текст на canvas. Одна elevation: hairline border, без многослойных теней.

### P1 — Типографика не иерархична

**Что не так:** `metric`/`title`/`subtitle` используются непоследовательно; много `fontWeight: '800'` локально; labels то uppercase micro, то обычный caption.

**Паттерн:** Role → token только через `AppText` variants. Цифра дня = metric; название секции = label; тело = body. Не больше одного metric-блока в первом viewport.

### P2 — Чипы и pills размножены

**Что не так:** filter chips каталога, сегменты Food, Progress tabs, recipe filters, plan scopes — все с разными height (36–48), radius (pill vs md), count badges.

**Паттерн:** единый `Chip` / `SegmentedControl` с selected/unselected/disabled.

### P2 — Empty / loading / error

**Что не так:** где-то `EmptyState`, где-то абзац текста, где-то только «—». Нет единого loading skeleton. Ошибки Garmin — строки warning, не системный error surface.

**Паттерн:** EmptyState (icon + title + one CTA); ErrorBanner; inline «—» только для unknown metric, не для целого экрана.

### P2 — Анимация

**Что не так:** day swipe opacity есть; остальное — pressed opacity 0.88. Нет motion tokens.

**Паттерн:** короткие (120–200ms) fade/slide для sheet и day change; respect reduce-motion; без декоративного bounce.

---

## 2. Аудит по экранам

### Сегодня `(tabs)/index`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Слабая | Status + KcalRing + StatCards + Activity + Plan + Habits + Favorites конкурируют → fold: дата + 1 metric summary + water/activity + primary Add |
| Плотность | Высокая | Убрать вторичные links ниже fold; favorites max 3 |
| Типографика | OK/шум | dateLine + swipeHint + labels — сократить hint до a11y |
| Карточки | Много | StatCards + Activity card + favorites cards → меньше nested cards |
| CTA | Конфликт | Footer Add + barcode + secondary Plan/Recipes → один sticky Add; Plan в header |
| Пустое | Partial | Habits empty OK; activity empty text OK |
| Узкий экран | Риск | Длинный скролл — progressive disclosure |

### Питание `food`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Средняя | Segments OK; diary KcalRing выровнен |
| Date chrome | Дрейф | DateSwitcher ≠ Today DayStrip → единый DayChrome |
| Каталог | Partial | Упрощён, но всё ещё ScrollView без виртуализации; крупные thumbs |
| CTA | OK | Footer Add + scan |
| Sheets | Риск | AddFoodSheet монолит — визуально и UX «другой продукт» |

### Активность `activity`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Хорошая | Summary → week → list — эталон плотности |
| Календарь | Исправлено | Один DayStrip |
| Quick types | Шум | Ряд чипов внизу — свернуть в form sheet |
| Garmin rows | OK | Deep-link affordance |

### Сон `sleep`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Хорошая | Metric → stages → week |
| Stages bar | Сырой | Серые сегменты без легенды/контраста → labeled legend + token colors (не medical traffic-light) |
| Empty | OK | CTA на Garmin |
| IA | Вопрос | 6-я вкладка тесна — см. roadmap (merge vs keep) |

### Прогресс `progress`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Улучшена | Overview KPI grid — шаг вперёд |
| Tabs | Перегруз | 6 сегментов chips — заменить на Overview + «Разделы» list, или 3 top segments |
| Body/BMI | Плотный текст | Health box — secondary sheet |
| Reports | OK | PDF + ChatGPT copy понятны |
| Charts | Разные | WeekBarChart vs sparkline vs nutrition strip — единый chart chrome |

### Профиль `profile`

| Критерий | Оценка | Проблема → паттерн |
|----------|--------|-------------------|
| Иерархия | Слабая | Длинный settings dump |
| Группировка | Partial | SettingsCard есть; порядок: Goals → Body → Integrations → Reports → Data → Privacy |
| Demo removed | OK | |
| ChatGPT card | OK | Сообщение про отсутствие прямого коннекта — сохранить |
| Secondary links | Шум | «Питание → / Рецепты →» дублируют tabs |

### Рецепты `/recipes/*`

| Экран | Проблема → паттерн |
|-------|-------------------|
| index | Hub 3 cards — отступы чинились; всё ещё card-in-card |
| import-personal | Плотный hero + stats + list — упростить toolbar |
| forms | Тяжёлые TextInput стили — shared `Field` |

### Plan `/plan/*`

| Экран | Проблема → паттерн |
|-------|-------------------|
| hub | Карточки модулей OK как directory |
| eat-now / pantry / shop | Разная плотность и copy; нужен один list-row pattern |
| budget | Две метрики легко путаются — явные labels «план / факт / оценка съеденного» |
| stores | Низкая ценность визуально равна бюджету — demote |

### Garmin `/garmin/*`

| Экран | Проблема → паттерн |
|-------|-------------------|
| index | Utility OK; warnings wall of text → collapsible |
| workout detail | Rich charts — эталон data viz; вынести chart tokens в DS |
| data | List dump — sectioned list |

### Sheets

| Sheet | Проблема → паттерн |
|-------|-------------------|
| AddFoodSheet | Визуальный «второй app»; табы/поиск/quick — нужен redesign по DS + split code |
| ConfirmPortion | Критичен; держать controls в нижней зоне большого пальца |
| Barcode | OK functional; error states unify |
| DayCalendar | OK |

---

## 3. Цвет / графики / навигация

### Цвет
- Accent задокументирован как нейтральный ink — хорошо для Premium Minimal.
- `accentSoft` в tokens сейчас серый `#E5E7EB`, в docs 04 иногда описывался коралловый soft — **docs drift**.
- Macro colors OK только с labels (соблюдать).

### Графики
- `WeekBarChart`, sleep stages, weight sparkline, Garmin charts — разные оси/подписи/empty glyphs (`·` vs `—`).
- **Паттерн:** ChartFrame (title, subtitle, footnote, empty glyph `—`, selected day ink).

### Навигация
- 6 tabs: labels длинные («Активность», «Прогресс») на узком Android → truncation риск.
- Stack headers без единой кнопки back/style.
- **Паттерн:** ≤5 root tabs **или** 5 + Sleep inside Activity; short labels; header actions max 2 icons.

---

## 4. Единый способ устранения

1. Approve `docs/DESIGN-SYSTEM.md` (Premium Minimal Utility).  
2. Этап B: расширить primitives (Field, Chip, Segment, Sheet, ChartFrame, Empty/Error).  
3. Этап C: screen-by-screen redesign **без** смены domain API — только presentation.  
4. Запретить новые локальные hex/radius в PR checklist.  
5. Обновить visual-audit-pack на device после C.

Не делать: параллельные «скины» по вкладкам; neumorphism; purple/glow; wellness terracotta bias; тёмный default.
