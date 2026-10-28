# Design Reset Audit — Momentum

**Дата:** 2026-10-28 · **Ветка:** `main` @ `252df84` · **Открытые PR:** #135 (Add Food UX), #133 (docs) — не дизайн-reset  
**Evidence:** код `apps/mobile` + `docs/design/refs` + Visual Audit Pack (Expo web 2026-10-24). **Android UI Pass не выставлен.**

> Предыдущие DESIGN-SYSTEM-AUDIT / SCREEN-AUDIT / vibe-PR #140–#147 **не считать актуальными** без сверки с кодом. Этот документ — сверка с реализацией.

---

## 1. Executive summary

Последние итерации (#140 Light UX → #141–#142 wrap → #143 ui primitives → #144 wellness → #146 neumorph Activity) наложили **несколько визуальных языков** без контракта миграции:

| Язык | Источник | Где живёт сейчас |
|------|----------|------------------|
| Nutrition light | ref 07 | Food (`CalorieHero`/`MacroGrid`/`Fab`) |
| Wellness soft home | ref 08 | Today (`SoftHeader`/`InverseStrip`/bento) |
| Soft mono onboarding | ref 09 | IconTile / WorkoutRow glyphs |
| Activity neumorph masonry | ref 10 | Activity (`SoftMetricCard`/`ProgressRing`) |
| Dark bento density | refs 03/05 | частично Progress `BentoStat` |
| Legacy `surfaceCard` StyleSheet | pre-#143 | Recipes, Plan subroutes, sheets, habits, ~40 файлов |

**Итог:** экраны выглядят как разные продукты; часть маршрутов **не тронута** новыми примитивами; Pinterest-рефы конкурируют, а не сходятся в одну систему.

**Решение:** один контракт — **Nutrition Soft Light** (еда + план рациона). Остальные рефы — только отдельные паттерны (тёмный log sheet, FAB). Не neumorph-masonry и не dark-shell для вкладок.

---

## 2. Полная карта экранов и состояний

Классификация: **F** fully / **P** partial / **N** not / **A** Android-check / **I** intentional.

### 2.1 Layouts / special

| Маршрут | Название | Файл | Компоненты | Состояния | Класс | Примечание |
|---------|----------|------|------------|-----------|-------|------------|
| `/_layout` | Root Stack | `app/_layout.tsx` | providers | — | I | без UI |
| `/(tabs)/_layout` | Tab bar | `app/(tabs)/_layout.tsx` | Ionicons, tokens | focused tab | P | soft tab chrome; не единый с header stack recipes |
| `/plan/_layout` | Plan stack | `plan/_layout.tsx` | Stack | — | I | |
| `/recipes/_layout` | Recipes stack | `recipes/_layout.tsx` | Stack | — | I | |
| `/+not-found` | 404 | `+not-found.tsx` | link | static | N | вне системы |
| `/+html` | Web shell | `+html.tsx` | — | — | I | web only |

### 2.2 Вкладки

| Маршрут | Название | Файл | Ключевые UI | Состояния | Новый дизайн? | Старое | Класс |
|---------|----------|------|-------------|-----------|---------------|--------|-------|
| `/` | Сегодня | `(tabs)/index.tsx` | SoftHeader, InverseStrip, Home*, ListRow, AppCard | empty weight/habits; sheets: AddFood, Barcode, Calendar, Targets | Частично (08) | DayStrip old; dual CTA (strip+HomeAction+barcode) | P · A |
| `/food` | Питание | `food.tsx` | CalorieHero, MacroGrid, MealSection→ListRow, Fab | empty diary/catalog; search; AddFood/Portion/Barcode | Ближе к 07 | DateSwitcher vs DayStrip; KcalRing legacy unused? | P · A |
| `/activity` | Активность | `activity.tsx` | SoftMetricCard, ProgressRing, IconTile, Fab | empty week/day; WorkoutForm | Другой язык (10) | WeekBarChart surfaceCard | P · A |
| `/progress` | Прогресс | `progress.tsx` | BentoStat + **surfaceCard** styles | tabs body/food/sport/habits/summary; WeightLog | Смесь | StatCards/habits/challenges surfaceCard | P · A |
| `/profile` | Профиль | `profile.tsx` | SoftHeader, AppCard + surfaceCard | paste Modal; forms | Частично | SettingsCard local, surfaceCard | P · A |

### 2.3 План

| Маршрут | Название | Файл | UI | Состояния | Класс |
|---------|----------|------|-----|-----------|-------|
| `/plan` | Хаб | `plan/index.tsx` | SoftHeader, AppCard hub | static | P · A |
| `/plan/eat-now` | Что съесть | `eat-now.tsx` | surfaceCard, MealChips, ConfirmPortion | empty/search/filled | N · A |
| `/plan/my-products` | Мои продукты | `my-products.tsx` | surfaceCard, PrimaryButton, inline panels | empty/import/edit | N · A |
| `/plan/week` | Меню недели | `week.tsx` → `WeekPlannerScreen` | surfaceCard DnD sheets | empty/composer/filled | N · A |
| `/plan/budget|pantry|shop|stores` | ADR-009 redirect | `*.tsx` | Redirect | — | **I** |
| `/plan/receipt` | → my-products | `receipt.tsx` | Redirect | — | **I** |

### 2.4 Рецепты

| Маршрут | Название | Файл | UI | Состояния | Класс |
|---------|----------|------|-----|-----------|-------|
| `/recipes` | Список | `recipes/index.tsx` | surfaceCard RecipeCard | empty/search/filled | N · A |
| `/recipes/new` | Новый | `new.tsx` + RecipeEditorForm | surfaceCard forms | empty form | N · A |
| `/recipes/edit/[id]` | Редакт | `edit/[id].tsx` | RecipeEditorForm | missing id | N · A |
| `/recipes/[id]` | Деталь | `[id].tsx` | surfaceCard, Recook, Portion | missing/empty ings | N · A |
| `/recipes/import-text` | Импорт текст | `import-text.tsx` | surfaceCard, PrimaryButton | empty parse | N · A |
| `/recipes/import-personal` | Архив | `import-personal.tsx` | surfaceCard, EmptyState | empty/select | N · A |

### 2.5 Sheets / modals (не маршруты, но UI-поверхности)

| ID | Компонент | Открывается из | Язык | Класс |
|----|-----------|----------------|------|-------|
| S1 | `AddFoodSheet` | Today, Food | surfaceCard / local | N · A |
| S2 | `ConfirmPortionSheet` | Food, EatNow, Recipe | surfaceCard | N · A |
| S3 | `BarcodeLookupSheet` + LabelCapture | Today, Food | surfaceCard | N · A |
| S4 | `DayCalendarSheet` | Today, Food, Activity | surfaceCard | N · A |
| S5 | `TargetsOnboardingSheet` | Today | CenteredFormModal | N · A |
| S6 | `WorkoutFormSheet` | Activity | surfaceCard | N · A |
| S7 | `WeightLogSheet` | Progress | **dark log (04)** | P · A |
| S8 | `RecookRecipeSheet` | Recipe detail | surfaceCard | N · A |
| S9–S11 | Week AddToPlan / MealAction / MoveCopy | Week | surfaceCard | N · A |
| M1–M3 | PortionEdit / SaveMeal / CenteredForm | Food | local | N · A |
| M4 | Profile paste `Modal` | Profile | RN Modal | N · A |

### 2.6 Сводка классификации

| Класс | Кол-во (маршруты UI + sheets) | Что |
|-------|-------------------------------|-----|
| **F** fully | **0** | Ни один экран не закрыт единым контрактом end-to-end |
| **P** partial | **6** вкладок/хаб + WeightLog | Новые примитивы + старые стили |
| **N** not | **~12** plan/recipes screens + **~12** sheets | Только `surfaceCard` / ad-hoc |
| **I** intentional | redirects ADR-009, layouts, +html | Не трогать без ADR |
| **A** Android | **все пользовательские** | Web pack ≠ Android Pass |

**Маршрутов в `app/`:** 36 файлов (вкл. layouts/redirects/html).  
**Пользовательских UI-экранов:** ~18 (+ ~15 overlay-поверхностей).

---

## 3. Проблемы (ссылки на исходники)

### 3.1 Несколько систем карточек

1. `AppCard` — `apps/mobile/src/ui/AppCard.tsx` (Today/Food/Activity/Plan hub/части Progress/Profile).
2. `surfaceCard` token — `tokens.ts` + **~40 файлов** (recipes, week, habits, diary sheets, EmptyState, WeekBarChart…).
3. Локальные «карточки» — `StatCards.tsx`, `HabitCard.tsx`, RecipeCard в `recipes/index.tsx`, SettingsCard в `profile.tsx`.

### 3.2 Конкурирующие metric / header / CTA

- Headers: `SoftHeader` vs `SectionTitle` (`src/ui`) vs `SectionHeader` (`src/components`) vs native Stack titles.
- Metrics: `BentoStat` vs `SoftMetricCard` vs `StatCards` vs `ProgressRing` hero.
- CTA: `Fab` (Food/Activity) + `InverseStrip` (Today) + `HomeActionCards` pills + `PrimaryButton` + header `+` на Activity → **дубли на Today/Activity**.

### 3.3 Рефы без единой концепции

`docs/design/REFS.md` одновременно требует soft wellness, neumorph Activity, Nutrition list, dark bento — без приоритета. Код следует разным рефам по вкладкам.

### 3.4 Несогласованность токенов vs экраны

- `radius.xxl=32` + heavy elevation (neumorph) на всех `AppCard`, включая Food list — перегруз для nutrition density.
- Macro colors только на Food; Activity mono rings — другой продукт.
- `DayStrip` (Today) vs `DateSwitcher` (Food/Activity) — два паттерна даты.

### 3.5 Visual Audit устарел

`docs/quality/visual-audit-pack/2026-10-24-screens/` снят **до** #140–#147. Не отражает текущий UI. Android Pass отсутствует (`VISUAL-AUDIT-PACK.md`).

### 3.6 Документы

`docs/quality/DESIGN-SYSTEM-AUDIT.md` описывает устаревшие radius/type и «SurfaceCard optional» — расходится с `tokens.ts`.

---

## 4. Причины неоднородности

1. **Нет freeze-контракта** перед vibe-итерациями — каждый PR добавлял язык, не удаляя предыдущий.
2. **Миграция «сверху»** — вкладки получили `AppCard`, а recipes/plan/sheets остались на `surfaceCard`.
3. **Pinterest = moodboard, не система** — refs 01–10 смешаны в REFS.md как равноправные.
4. **Дубли примитивов** (`BentoStat`/`SoftMetricCard`, `SectionTitle`/`SectionHeader`) без deprecation path.
5. **DoD = verify + APK**, без visual regression checklist на все маршруты.

---

## 5. Предлагаемый дизайн-контракт — **Nutrition Soft Light**

Единственный эталон для shell: **питание и план рациона** (ориентир ref **07** + мягкость 08/09 без neumorph-masonry и без dark tab shells).

### 5.1 Цвет и поверхности

| Token | Value | Роль |
|-------|-------|------|
| `background` | `#F2F2F2` | canvas |
| `surface` | `#FFFFFF` | cards / sheets light |
| `text` / `textSecondary` / `textMuted` | `#111` / `#6B7280` / `#9CA3AF` | иерархия |
| `primaryButton` | `#111111` | единственный primary |
| `focus` | `#EF6E58` | **только** today marker / week trend |
| `protein/carbs/fat` | как сейчас | только с текстовой меткой |
| `darkBg` | `#000` | **только** focused log sheets (вес) |

Запрет: glow, 3D, purple brand wash, neumorph dual-shadow на светлых вкладках.

### 5.2 Typography

| Token | Size | Weight use |
|-------|------|------------|
| `hero` | 34 | одно число на экран (ккал/вес) |
| `title` | 24 | screen title |
| `subtitle` | 17 | section / card title |
| `body` | 15 | rows |
| `caption` | 13 | meta |
| `micro` | 11 | chips / a11y secondary |

### 5.3 Space / radius / elevation

- Space: 4 / 8 / 12 / 16 / 24 / 32 (без изменений).
- Radius: `sm` 12 · `md` 16 · `lg` 20 · `xl` 24 · `pill` 999. (**убрать зависимость от xxl=32 как default card**).
- Elevation: один `elevation.card` (opacity ≤0.06, radius ≤20) + `tabBar`.

### 5.4 Кнопки и иерархия

1. **Один primary job на экран** — либо `Fab`, либо чёрная pill `PrimaryButton`, либо одна inverse strip — не все сразу.
2. Secondary — text link / ghost (без второй чёрной pill рядом).
3. Header `+` допустим, если нет Fab на том же job.

### 5.5 Карточки и rows

- Единственный raised container: **`AppCard`**.
- Списки внутри card: **`ListRow`** (glyph круглый, pills, trailing).
- Metric cell: **`BentoStat`** (alias SoftMetricCard → BentoStat).
- Flat settings: `AppCard` + ListRow / form fields, без третьей SettingsCard-системы.

### 5.6 Fields / chips / sheets

- Inputs: border `colors.border`, radius `md`, minHeight `touchMin`.
- Chips: одна `Chip`/`Segmented` обёртка (MealChips/FoodSegmentTabs постепенно).
- Sheets: `SwipeToDismissSheet` + `sheetSurface`; dark только WeightLog.
- Modals: `CenteredFormModal` для коротких форм.

### 5.7 Empty / error / loading

- Empty: только `EmptyState` на `AppCard` language.
- Error: FlashBar / Alert — без shame copy.
- Loading: нет скелетонов сейчас — не выдумывать; keep synchronous SQLite UX.

### 5.8 Icons / touch / motion / Android

- Ionicons outline; active tab filled.
- `touchMin` 48 везде (chips ≥44).
- Pressed opacity 0.88–0.92; без parallax.
- Safe area: tab bar уже учитывает insets; sheets — bottom inset; **проверить на device**, не на Expo web.

---

## 6. Таблица миграции экранов

| Экран | Изменения | Компоненты | Зависимости | Acceptance |
|-------|-----------|------------|-------------|------------|
| Tokens + REFS | одна система; deprecate multi-ref equality | `tokens.ts`, `REFS.md` | — | Food-like canvas; xxl optional |
| AppCard / ListRow / BentoStat | радиус xl=24; SoftMetric→alias | `src/ui/*` | tokens | единый card API |
| EmptyState, SectionHeader, PrimaryButton, Date* | на контракт | `src/components/*` | AppCard | нет surfaceCard ad-hoc |
| Today | один primary CTA; SoftHeader+AppCard+ListRow; убрать дубль HomeAction vs strip | index, home/* | PR1 | ≤1 black CTA job |
| Food | эталон; DateSwitcher unify later | food, MealSection | PR1 | hero+macros+rows+Fab |
| Activity | убрать neumorph-masonry; BentoStat+ListRow+Fab+IconTile grid | activity, WorkoutRow | PR1 | язык = Food/Progress |
| Progress | все surfaceCard→AppCard; один Bento | progress, panels | PR1–2 | tabs consistent |
| Profile | SoftHeader+AppCard forms | profile | PR1 | нет surfaceCard |
| Plan hub | уже AppCard — выровнять radius | plan/index | PR1 | |
| Eat now / My products / Week | AppCard+ListRow+EmptyState | plan/*, week/* | PR2 | |
| Recipes * | AppCard+ListRow+EmptyState | recipes/*, RecipeEditor | PR2 | |
| Sheets | sheetSurface + ListRow rows | features/**/**Sheet | PR3 | WeightLog dark only |
| Redirects | без UI | — | — | I |

---

## 7. Порядок PR и зависимости

| PR | Scope | Depends |
|----|-------|---------|
| **PR-A** | Design contract: tokens, REFS, ui aliases, EmptyState/PrimaryButton/SectionHeader на AppCard; deprecate SoftMetricCard→BentoStat | — |
| **PR-B** | Core tabs: Today CTA dedupe, Activity→contract, Progress/Profile surfaceCard purge | PR-A |
| **PR-C** | Plan subroutes + Week planner surfaces | PR-A |
| **PR-D** | Recipes stack | PR-A |
| **PR-E** | All sheets/modals (кроме WeightLog dark keep) | PR-A |
| **PR-F** | Visual pack re-capture (Expo web) + dogfood APK; Android checklist | B–E |

Не менять навигацию/ADR-009 redirects/domain без отдельного issue.

---

## 8. Definition of Done — весь редизайн

- [x] Один визуальный язык на всех **пользовательских** экранах и sheets (кроме dark WeightLog).
- [x] Нет необъяснимых `surfaceCard` StyleSheet на экранах (только deprecated alias → AppCard).
- [x] Нет параллельных SoftMetric vs Bento / двух date headers без плана слияния.
- [x] ≤1 primary black CTA на job/экран.
- [x] Empty + filled ключевые сценарии (Today, Food, Activity, Plan, Recipes).
- [x] `npm run verify` green.
- [x] Expo web pack переснят → `docs/quality/visual-audit-pack/2026-10-29-screens/` (39 shots; script writes dated folder).
- [ ] **Android:** жесты back/sheet dismiss, IME, safe areas на dogfood APK — отдельно; **не** считать web = Android Pass. APK built (`docs/quality/apk/DOGFOOD-APK.md`, git `ae2f0a6`).
- [x] Основные сценарии: лог еды ≤10s path, вес, тренировка, рецепт→дневник (код-пути на Soft Light; device Pass отдельно).

---

## 9. Риски и проверка

| Риск | Проверка |
|------|----------|
| DnD week layout break | ручной `/plan/week` + unit если есть |
| Sheet swipe + keyboard | ConfirmPortion, AddFood на device |
| Tab bar overlap Fab | Food/Activity paddingBottom ≥120 |
| Accidental nutrition invention | не трогать domain |
| Visual pack stale | пересъёмка после PR-B |
| Open PR #135 Add Food conflict | rebase/coordinate перед PR-E |

**Команды:** `npm run verify` (= typecheck + test + security + mobile tsc); `npm run build:apk:local --prefix apps/mobile`; screenshots: `node scripts/capture-screens-2026-10-24.mjs`.

**Состояния к пересъёмке (минимум):** Today empty/filled; Food diary/catalog/search; Activity empty/filled; Progress summary; Profile; Plan hub; Eat now; Week; Recipes list/detail; AddFood; Portion; WeightLog; Workout form.

---

## 10. Статус PR и следующий шаг

| PR | Intent | Status |
|----|--------|--------|
| **PR-A** | Tokens + canonical primitives + CONTRACT + deprecations | Merged (#151) — `docs/design/CONTRACT.md` |
| #149/#150 | Early contract + surface purge | Merged |
| **PR-B** | Today / Activity / Progress / Profile under CONTRACT | Done on `feat/148-design-reset-b-e` |
| **PR-C** | Plan eat-now / my-products / week | Done on same branch |
| **PR-D** | Recipes stack | Done on same branch |
| **PR-E** | Sheets/modals (WeightLog dark kept) | Done on same branch |
| **PR-F** | Visual pack re-capture + dogfood APK + Android Pass | Web pack `2026-10-29-screens` + APK meta done; **Android Pass still open** |

**Open conflict:** PR [#135](https://github.com/Alexkucepalov/momentum/pull/135) (Add Food UX) touches `tokens.ts` + AddFood sheets. Soft Light reserves `tone*` wells so #135 can rebase without reverting the shell.
