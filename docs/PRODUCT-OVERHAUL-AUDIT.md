# Momentum / nf-fit — Product Overhaul Audit (Этап 0)

**Дата:** 2026-11-01  
**Метод:** code + docs review + route inventory + git state.  
**Не выполнено в этом аудите:** device walkthrough, TalkBack, cold-start latency на телефоне, Maestro E2E.  
**Ветка факта:** `feat/garmin-personal-sync` (+ большой **незакоммиченный** diff поверх nf-fit Phase 0–6).  
**Локальный `main`:** отстаёт от remote / от ветки аудита — не считать `main` источником истины для текущего продукта.

Статусы функций: **Working** | **Partial** | **Broken** | **Unverified** | **Planned**.

---

## 0. Сопоставление с документацией

Искомые артефакты с точными именами **Feature Inventory / User Journeys / Screen-by-screen audit / Issue Register / ChatGPT Handoff** в репозитории **не найдены** как отдельные файлы.

| Ожидание | Фактический аналог | Актуальность vs код |
|----------|-------------------|---------------------|
| Feature Inventory | `docs/17-DEV-PLAN.md`, `docs/quality/PRODUCT-AUDIT.md` | **Отстаёт** (5 tabs, snapshot v13 в PRODUCT-AUDIT; код — 6 tabs, snapshot **v18**) |
| User Journeys | `docs/03-UX.md`, `docs/quality/UX-FLOWS.md`, `docs/food-intelligence/02-JOURNEYS.md` | Частично актуально; Garmin/сон/ChatGPT-отчёты не отражены |
| Screen-by-screen | `docs/quality/SCREEN-AUDIT.md` | **Отстаёт** (нет Sleep, Garmin stack; Today/Progress устарели) |
| Issue Register | GitHub Issues + DEV-PLAN | Не сведён в один файл |
| ChatGPT Handoff | — | Нет; реализован copy-text (код), без doc |
| PRD | `docs/01-PRD.md` (2026-10-16) | Базовый; **non-goal «Garmin restricted»** противоречит текущему Personal API dogfood |
| Design system doc | `docs/04-DESIGN-SYSTEM.md`, `docs/visual-direction.md` | Ближе к коду после Soft Utility; `quality/DESIGN-SYSTEM-AUDIT.md` всё ещё упоминает teal как stale |
| Architecture | `docs/05-ARCHITECTURE.md` | Идеал «entity SQLite»; факт — **полный JSON snapshot** на каждое изменение |
| Garmin | `docs/garmin-personal-sync.md` | **Актуален** относительно незакоммиченного кода |

**Вывод:** при расхождении приоритет у **кода на `feat/garmin-personal-sync` + working tree**. Документы ниже помечены к обновлению в roadmap.

---

## 1. Текущая архитектура

```
apps/mobile/          Expo Router UI (Expo ~57, RN)
  app/                routes
  src/                features, components, design-system, storage bridge, widgets
src/domain/           чистые функции (nutrition, garmin mappers, reports, planner…)
src/storage/          FoodRepository (in-memory god-object) + types + migrations stub
tests/*.mjs           node:test + transpile TS
```

**Паттерн данных**
1. UI → `DataContext` → `FoodRepository` API.
2. Каждая мутация → `toSnapshot()` → persist hook.
3. Android: `expo-sqlite` хранит **целиком** `StoreSnapshot` JSON (`expoFoodStore.native.ts`).
4. Web fallback: memory / localStorage snapshot.
5. Garmin API key + bearer: **SecureStore only** (не в snapshot/export).
6. Domain numbers: `unknown != 0`; entry snapshot при записи.

**Слои UI**
- Design-system primitives: `AppText`, `AppCard`, `AppButton`, `MetricCard`, `Screen`.
- Legacy/shared: `PrimaryButton`, `FormScrollView`, `KcalRing`, sheets, chips — часто через `theme/tokens` (re-export DS).
- Feature folders: diary, recipes, plan, garmin, progress, habits, challenges, weight.

**Навигация (факт)**
- Tabs (6): Сегодня, Питание, Активность, **Сон**, Прогресс, Профиль.
- Stacks: `/recipes/*`, `/plan/*`, `/garmin/*`.
- Общая дата дня: `DataContext.dateLocal` + `DaySwipeArea` / `DayStrip` / calendar sheet.

**Важно:** `TAB_SHELL` в tokens всё ещё описывает **5** вкладок без Sleep — контракт устарел.

---

## 2. Полный список экранов и маршрутов

### Tabs — `apps/mobile/app/(tabs)/`

| Route | Файл | Назначение |
|-------|------|------------|
| `index` | `index.tsx` | Сегодня: дата, статус, КБЖУ, вода, активность, план, привычки, избранное |
| `food` | `food.tsx` | Дневник / каталог, приёмы, copy yesterday, add |
| `activity` | `activity.tsx` | Тренировки дня, неделя, ручной ввод |
| `sleep` | `sleep.tsx` | Сон дня + неделя (Garmin) — **untracked в git status** |
| `progress` | `progress.tsx` | Неделя KPI / тело / питание / спорт / привычки / отчёты |
| `profile` | `profile.tsx` | Цели, приватность, Garmin/Zepp, отчёт дня, export/import |

### Recipes — `/recipes`

| Route | Назначение |
|-------|------------|
| `index` | Список + hub actions |
| `new`, `edit/[id]` | Создание / правка |
| `[id]` | Деталь + cook-again |
| `import-text` | Парсинг текста |
| `import-personal` | Архив `import:` |

### Plan — `/plan`

| Route | Назначение |
|-------|------------|
| `index` | Hub Food Planner |
| `eat-now` | Что съесть сейчас |
| `pantry` | Кладовая + batches |
| `week` | Черновик меню |
| `shop` | Покупки |
| `budget` | Бюджет |
| `stores` | Предпочтения магазинов |
| `receipt` | Ручной расход / чек-контекст |

### Garmin — `/garmin`

| Route | Назначение |
|-------|------------|
| `index` | Ключ, sync full/incremental |
| `data` | Списки импортированных данных |
| `workout/[id]` | Деталь тренировки (трек, графики, зоны) |

### Прочее
- `+not-found`, `+html`
- Overlays (не routes): `AddFoodSheet`, `ConfirmPortionSheet`, `BarcodeLookupSheet`, `DayCalendarSheet`, `PortionEditModal`, `SaveMealModal`, workout form sheet, и др.

---

## 3. Состояние вкладок

| Вкладка | Статус | Факт |
|---------|--------|------|
| Сегодня | **Partial** | Рабочий дневной хаб; длинный скролл; несколько CTA; StatCards/KcalRing/activity card после UX-pass |
| Питание | **Partial** | Сегменты diary/catalog Working; КБЖУ выровнен с Today; каталог без FlatList |
| Активность | **Working** | День + неделя + ручной ввод + Garmin deep-link; один DayStrip |
| Сон | **Partial** | UI + mapper + sync в коде; **Unverified** на реальном Garmin payload устройстве |
| Прогресс | **Partial** | Неделя/отчёты улучшены; тело/привычки/челленджи всё ещё плотные; device UX не измерен |
| Профиль | **Partial** | Цели/экспорт/Garmin/Zepp/ChatGPT-copy; демо 2 недели убрано; экран длинный |

---

## 4. Основные пользовательские сценарии

| Сценарий | Статус | Комментарий |
|----------|--------|-------------|
| Добавить еду (поиск / recent / favorite) | **Working** | ConfirmPortion → diary; undo |
| Повтор приёма / copy yesterday | **Partial** | Есть кнопки; «удобный повтор вчерашнего» в dogfood-ревью ещё не закрыт как UX |
| Штрихкод OFF | **Partial** | Работает при сети; offline catalog fallback |
| Рецепт → порция в дневник | **Working** | Yield + snapshot; cook-again |
| Импорт рецепта из текста / архива | **Working** | Без выдуманных КБЖУ |
| Вода +250 | **Working** | StatCards |
| Ручная тренировка | **Working** | |
| Garmin sync вес/шаги/тренировки | **Partial** | Код + APK; device full history **Unverified** в этом аудите |
| Garmin sleep | **Partial** | Код есть; device **Unverified** |
| Zepp CSV вес | **Partial** | Парсер + UI card; device **Unverified** |
| Гибкие привычки / челленджи | **Working** (логика) / **Partial** (discovery UX) | |
| Flexible PDF / text отчёт | **Working** | Offline print + clipboard |
| Отчёт дня → ChatGPT (copy) | **Working** | Без прямого API |
| Export / import JSON | **Working** | version ≤18 |
| Eat Now / pantry / week / shop / budget | **Partial** | Shipped; ценность и склейка JTBD слабые без dogfood-метрик |
| Android home widget | **Partial** | Plugin + contract; device refresh **Unverified** |
| North-star ≤10s repeat | **Unverified** | Нет device measurement в репо |
| Planned meal ≠ diary | **Working** | По коду/ADR-008; auto-log отсутствует |

---

## 5. Дизайн-система (факт) и консистентность

**Runtime SoT:** `src/design-system/tokens.ts` → `apps/mobile/src/design-system/tokens.ts` (+ re-export `theme/tokens.ts`).

Направление в docs: **Minimal Soft Utility** (светлый canvas, чёрный CTA, почти flat).  
Целевой overhaul (этот этап): **Premium Minimal Utility** — см. `docs/DESIGN-SYSTEM.md` (предложение), без смены платформы.

Проблемы консистентности — в `docs/DESIGN-AUDIT.md`. Кратко:
- два пути импорта токенов + `PrimaryButton` vs `AppButton`;
- DateSwitcher vs DayStrip;
- pill/chip стили размножены локально;
- 65 файлов всё ещё тянут `theme/tokens`, 30 — `@/src/design-system`;
- TAB_SHELL ≠ фактические 6 вкладок.

---

## 6. Дубли и конкурирующие стили

| Паттерн | Варианты | Риск |
|---------|----------|------|
| Primary CTA | `AppButton`, `PrimaryButton` | Разный API/визуал |
| Date nav | `DayStrip`, `DateSwitcher` | Разная иерархия; на Activity дубль уже убран |
| Empty | `EmptyState` + локальные empty blocks | OK если дисциплина |
| Cards | `AppCard` + raw StyleSheet surfaces | Разные padding/radius |
| Section title | `SectionHeader` + локальные uppercase labels | |
| Macro display | `MacroStrip`, `KcalRing`, MetricCard | Разные плотности |
| Flash feedback | `FlashBar` / `showFlash` | Working |
| Theme import | design-system vs theme | Drift при правках |

---

## 7. Рабочие / незавершённые функции (сводка)

### Working (сохранять логику)
- Offline diary + portions + undo  
- Recipes CRUD / yield / cook-again  
- Domain nutrition validation (`unknown != 0`)  
- Flexible habits + challenges data model  
- Export/import snapshot pipeline  
- Copy day/period report text + PDF  
- Add-guard / no invented nutrition  

### Partial
- Today/Food IA и визуал  
- Garmin sync + sleep UI (device)  
- Food Planner depth vs value  
- Widgets  
- Progress as «месячная аналитика»  
- Catalog performance (no virtualization)  

### Broken
- Не зафиксировано как «падение» в unit verify.  
- **Процессный broken:** working tree не закоммичен; docs/TAB_SHELL/PRODUCT-AUDIT расходятся с продуктом → риск потери/путаницы.

### Unverified
- Device dogfood Garmin sleep/full sync  
- ≤10s repeat meal  
- TalkBack / contrast  
- Widget on physical home screen  
- Persist latency на больших snapshot  

### Planned (не код / отложено)
- Прямой ChatGPT API  
- Health Connect live  
- HRV / Body Battery  
- Cloud sync / backend  
- Store scraping  
- iOS  

---

## 8. Технические риски

| Риск | Severity | Доказательство |
|------|----------|----------------|
| God-repository ~3800 LOC | High | `foodRepository.ts` |
| Full-snapshot write на каждое изменение | High | `expoFoodStore.native.ts` |
| AddFoodSheet ~860 LOC monolith | High | regression surface |
| Uncommitted feature branch | High | git status: M + ?? Garmin/sleep |
| Docs/PRD drift (Garmin was non-goal) | Med | `01-PRD.md` vs код |
| Dual calendar/date components | Med | |
| 6 tabs crowding | Med | Tab bar на узких экранах |
| SCHEMA_VERSION=8 (SQL migrations) vs snapshot v18 | Med | Два versioning канала; легко перепутать |
| SecureStore key expiry Garmin | Med | Personal API key TTL |
| No E2E | Med | verify = unit + tsc only |

---

## 9. Производительность и сохранение данных

| Тема | Факт | Статус |
|------|------|--------|
| Persist | Целый JSON snapshot | **Partial** — надёжно для dogfood размера; O(n) write |
| Списки | Почти нет FlatList (кроме recipes index) | **Partial** — риск на большом каталоге |
| Undo | soft delete + UndoBar | **Working** |
| Export | JSON clipboard | **Working** |
| Import | Replace all после confirm | **Working** (destructive — OK) |
| Garmin key | SecureStore | **Working** |
| Day change haptic | есть util | **Working** / device **Unverified** |

---

## 10. Android-реализация

| Тема | Статус |
|------|--------|
| Expo prebuild + local APK script | **Working** (`build:apk:local` → `dist/momentum-dogfood.apk`) |
| Camera barcode | **Partial** (permissions / device) |
| App widgets plugin | **Partial** |
| Garmin networking | **Partial** (needs key + network) |
| iOS | **Planned** (out of scope) |
| Play production | **Запрещено** без approve |

---

## 11. Тесты и quality gates

| Gate | Статус |
|------|--------|
| `npm run verify` (typecheck + test + security + mobile tsc) | **Working** на момент последних срезов |
| Unit tests ~54 files | **Working** (garmin/sleep/day-report добавлены) |
| Maestro / Detox E2E | **Отсутствует** |
| Device visual pack Pass | **Unverified** / historically pending |
| Snapshot assert v18 | Обновлено в тестах working tree |

---

## 12. Что сохранить без изменений (логика / контракты)

1. Offline-first, no required backend.  
2. `unknown ≠ 0` и snapshot нутриентов в entry.  
3. Planned meals never auto-log to diary.  
4. No shame copy / no medical diagnosis.  
5. Garmin key только SecureStore; не в export.  
6. Flexible report / day report as **user-initiated** clipboard/PDF (no silent cloud).  
7. Domain pure functions for nutrition math.  
8. Snapshot import/export compatibility path (bump versions явно).  
9. Food Planner principle ADR-008 (даже если UI сжимаем).  
10. Confirm before destructive wipe / import replace.

---

## Документы после Этапа 0 (статус Stage 11)

1. `docs/01-PRD.md` — **synced** Garmin / sleep-in-Movement / ChatGPT clipboard.  
2. `docs/03-UX.md` — **synced** 5 tabs IA.  
3. `docs/04-DESIGN-SYSTEM.md` / `DESIGN-SYSTEM.md` — Premium Minimal Utility.  
4. `docs/quality/SCREEN-AUDIT.md`, `PRODUCT-AUDIT.md` — **synced** tabs, v18, FlatList.  
5. `TAB_SHELL` — aligned `today/food/movement/progress/profile`.  
6. `docs/17-DEV-PLAN.md` — Stages 1–9 merged; 10–11 perf/docs; **device Pass open**.

---

## Краткий вердикт продукта

Momentum уже **богатый offline companion** с работающим дневником, рецептами, planner-модулями и (в working tree) Garmin+сном+отчётами. Продукт **не законченный**: IA перегружена, визуальный язык фрагментирован, docs отстают, ветка не стабилизирована коммитом, device quality gates не закрыты. Overhaul должен **склеить и отполировать**, а не переписывать domain.
