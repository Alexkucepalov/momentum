# Living development plan — founder dogfood

Источник истины для сессий разработки. Cursor plan — зеркало; при расхождении править этот файл. Читать вместе с `AGENTS.md` перед каждым issue.

## Product Overhaul (2026-11-01)

SoT: `docs/PRODUCT-ROADMAP.md` · audit `docs/PRODUCT-OVERHAUL-AUDIT.md` · DS proposal `docs/DESIGN-SYSTEM.md`.

| Этап | Статус | Notes |
|------|--------|-------|
| **1 Stabilization (A1–A11)** | **Done** | PR #168; v18 roundtrip; A10 device wipe still manual |
| **2 Design system (B)** | **Done** | PR #169; tokens + shared primitives |
| **3 Navigation (C)** | **Done (PR #170)** | 5 tabs · Движение = Activity\|Sleep · Food DayStrip |
| **4.1 Today (D1–D9)** | **Done (PR #171)** | Fold: date + ring + water/activity · Plan header · favorites ≤3 |
| **4.2 Food (E1–E9)** | **Done (PR #172)** | SegmentedControl · diary empty · catalog FlatList |
| **4.4–4.5 Progress/Profile** | **Done (PR #173)** | 4 progress segments · Profile section order |
| **4.x Screens** | **Merged #174** | Stages 1–4 squash on main |
| **5 Fast food (J)** | **Merged #175** | Copy yesterday · undo add · portion-first |
| **6 Recipes (K)** | **Merged #176** | DS Field · Chip filters · snapshot unknown≠0 |
| **7 Garmin UX (L)** | **Merged #177** | Last-sync · warnings · device QA doc |
| **8 Analytics (M)** | **Merged #178** | 30-day overview · report DS · secrets guard |
| **9 Planner (N)** | **In progress** | Hub stores demoted · budget plan/fact · plan≠diary |
| 10–11 | Pending | Perf → Android QA |

**A9 TAB_SHELL:** aligned — UI matches `today/food/movement/progress/profile`.

## Quality Freeze (утверждён 2026-10-20, 2–3 недели)

**Режим:** product quality first — `docs/quality/QUALITY-ROADMAP.md` (утверждённая последовательность).

| Разрешено | Запрещено |
|-----------|-----------|
| Sprint 1 residual: device dogfood (#36–#37) | Product features / FP-8+ / AI / OCR / live prices |
| Sprint 2: UX **docs/IA/wireframes**; UI PR только после approve Today/Food | Auto-merge; live Dispatcher; массовый redesign одним PR |
| Issues `dogfood`+`p0`/`p1`/`quality` **без** `agent-ready` | Rewrite foodRepository / normalized SQLite «на всякий» |

**Open gate:** Android dogfood ещё не прогнан — Sprint 2 не «done» без device.  
Эталон: открыть → продукт → граммы → дневник.  
Sprint 2: S2-1 Today merged (#43); S2-2 Food segments (#44). Plan: `docs/quality/SPRINT-2-UX-PLAN.md`.  
Dispatcher: `DISPATCH_ENABLED=false`, `DISPATCH_DRY_RUN=true`.

## Цель

Личное Android-приложение для ежедневного лога еды (offline-first). Привычки — свои, без хардкода; челленджи позже.

North-star: повторный приём ≤10 с; `unknown ≠ 0`; snapshot при записи; без AI на add/edit/delete.

## Текущий спринт

| Статус | Issue | Промпт |
|--------|-------|--------|
| Done | Sprint 1 — UX Foundation | компактный Today/Food, empty states, safe/keyboard |
| Done | Sprint 2 — Nutrition Flow | AddFoodSheet, unified search, quick modes, portion |
| Done | Sprint 3 — Recipes & Activity | cook-again, workout context, import restore |
| Done | Sprint 4 — Motivation & Insights | quantitative habits, challenges, week reports (v9) |
| Done | UX polish post-S4 | Today CTA dedupe; Progress food chart; challenge periods; no fake kcal fill |
| Done | Flexible PDF report | Progress · Итоги; даты + категории; expo-print offline |
| Done | P0-02 Domain nutrition | `src/domain/nutrition.ts` |
| Done | P0-01 Bootstrap Expo | `apps/mobile` (Expo Router tabs) |
| Done | P0-03 SQLite snapshot store | `src/storage/*` + `expoFoodStore` |
| Done | P1 Diary + recents/favorites | Food/Today UI |
| Done | P1 Recipes + export/a11y | Add sheet recipes + Progress export/delete |
| Done | Tab bar icons + portion modal + empty states | dogfood UX polish |
| Done | Visual pass vs `docs/reference-momentum-ui.jpg` | RU copy, ring, 5 tabs |
| Done | SDK 57 align with Expo Go | `expo@~57` |
| Done | Portion confirm + multi-ingredient recipes | ConfirmPortionSheet |
| Done | Local water + weight + walk habit | snapshot v2 |
| Done | Manual workouts (Activity) | snapshot v3, no food kcal offset |
| Done | Manual barcode + OFF cache | snapshot v4, no camera |
| Done | Flexible weekly habits | Progress panel, no shame streaks |
| Done | Camera barcode + label/manual fallback | expo-camera; OCR parse from text |
| Done | Food tab visual/UX pass | date switcher, meal cards, catalog |
| Done | Dogfood tracker + Profile settings | snapshot v5, water target, privacy |
| Done | Activity UX + weight sparkline | presets, week bars, neutral trend |
| Done | Weight line chart | SVG polyline in Progress; OCR label deferred |
| Done | Food catalog + recipes UX | cards, MacroStrip, recent strip, recipe photos |
| Done | Today dogfood daily loop | scan, favorites, flexible habits checklist |
| Done | Recipes in catalog + repeat meal | Food filter + copy meal slot |
| Done | Copy yesterday → day + flash toast | ≤10s day replay |
| Done | AddFoodSheet UX rewrite | no top meal chips; tabs+quick + |
| Done | Portion sheet UX | swipe-down, lower controls, edit КБЖУ/100g |
| Done | Kcal ring + activity MET estimate | food≠offset; undo toast compact/auto |
| Done | Manual daily КБЖУ + BMI + search/UX | snapshot v6; copy yesterday ration btn |
| Done | Full recipes section | photo/desc/KBJU; snapshot v7; diary portion |
| Done | Competitor UX gaps | saved meals + quick add + week strip (v8) |
| Done | App-wide UI/UX polish | shared headers/footer/empty; press states; tabs |
| Done | UX audit P0–P1 slice | KBJU hint, dedupe, insets, Today/Add/swipe, Activity split |
| Done | Full day calendar | month grid + food/activity/weight day detail |
| Done | RU barcode scan → portion | OFF RU-first; дневник только после граммов |
| Done | Barcode false «не найден» fix | parallel OFF, GTIN-14, fallback titles |
| Done | Barcode fetch cancel on RN | XHR transport; OFF name lang fallback |
| Done | User habits CRUD | soft delete/update; dogfood 14d UI removed |
| Done | Habits UX polish | week dots, progress bar, composer, Today cards |
| Done | Profile UX polish | cards, goal chips, water presets, flash |
| Done | Local frequent index + OFF fallback | listFrequentProducts; barcode link offline |
| Done | APK dogfood pipeline | eas.json preview + `npm run build:apk:local` |
| Done | Challenges | Progress · personal metrics; no shame streaks |
| Cancelled | Founder dogfood gate UI | 14-day tracker removed from product |
| Done | Smart Recipe Import Phase 0 | ADR-007 + `parseRecipeText` + Рецепты → Из текста |
| Done | Common food catalog | `commonFoodCatalog` seed:* + alias search offline |
| Done | Personal recipes archive import | review UI + `import:` ids, no silent bulk / no invented kcal |

Обновлять колонку Status после merge каждого PR.

## Epic: Food Planner (priority over AI trainer / deep sports)

Документы: `20-FOOD-PLANNER-PRD.md`, `21-FOOD-PLANNER-UX.md`, `22-FOOD-PLANNER-DATA.md`, ADR-008.

**Статус:** docs + GitHub Issues (`food-planner`). **Не** ставить `agent-ready` и **не** начинать реализацию до явного approve основателя.

| Sprint | GitHub | Issue theme | Depends on | Agent-ready? |
|--------|---------|-------------|------------|--------------|
| FP-0 | docs PR | Docs / ADR / contracts | — | n/a (docs) |
| FP-1 | [#13](https://github.com/Alexkucepalov/momentum/issues/13) | Domain: remaining macros + Eat Now scorer + tests | FP-0 | Done (#22) |
| FP-2 | [#14](https://github.com/Alexkucepalov/momentum/issues/14) | Plan hub UI + Eat Now screen | FP-1 | Done (#22) |
| FP-3 | [#15](https://github.com/Alexkucepalov/momentum/issues/15) | Pantry + cooked batch remaining | FP-2 | Done (#23) |
| FP-4 | [#16](https://github.com/Alexkucepalov/momentum/issues/16) | Weekly meal plan drafts (3/5/7) | FP-3 | Done (#24) |
| FP-5 | [#17](https://github.com/Alexkucepalov/momentum/issues/17) | Shopping list aggregate + user prices | FP-4 | Done (#26) |
| FP-6 | [#18](https://github.com/Alexkucepalov/momentum/issues/18) | Food budget plan/fact + forecast | FP-5 | Done (#27) |
| FP-7 | [#19](https://github.com/Alexkucepalov/momentum/issues/19) | Store preference tags (no scrape) | FP-5 | Done (#27) |

После approve: помечать **один** следующий FP issue `agent-ready`; serial dispatcher.

## Epic: Food Intelligence (design package — no code yet)

Документы: `docs/food-intelligence/` (audit → PRD → journeys → IA → sources → ADR purchases → backlog → QA).

**Статус:** design-only PR на ветке `docs/food-intelligence-overhaul`. **Не** начинать slice 1 (import → preview → pantry + expense) до approve ADR + OCR/consent. Quality Freeze для несвязанных фич сохраняется; device dogfood (#36–#38) остаётся open gate.

| Slice | Outcome | Status |
|-------|---------|--------|
| Docs 00–07 | Founder review package | Done (#57) |
| FI slice 1 | Purchase → pantry + expense | Done (#58 / #59) |
| FI slice 2 | Pantry coverage → Eat Now / Recipes | Done (#60 / #63) |
| FI slices 3–4 | Missing shop + budget metrics | Done (#61–#62 / #64) |
| FI-5+ | OCR / OFF enrichment / QR | Deferred — consent / `needs-human` |

## Backlog (next agent-ready)

Очередь для Cloud triage / label `agent-ready`. Один issue за раз; ≤2 in flight. После merge — перенести в таблицу выше как Done.

| Priority | Issue | Acceptance (кратко) |
|----------|-------|---------------------|
| — | **Food Planner FP-1…** | См. epic выше — **без** `agent-ready` до approve |
| 1 | ~~Parse diary-style recipe paste hardening~~ | Done (#28) |
| 2 | Catalog / Recipes / Archive visual polish QA | Open #5 + PR #20 (review); **no new agent-ready** — quality freeze |
| 3 | ~~Import-text preview shows per-100g macros~~ | Done (#29) |
| 4 | Agent smoke / docs sync | #10 open — docs only; optional during freeze |
| 5 | ~~Offline recipe search aliases~~ | Done (#32) |
| ★ | **Quality backlog** | `docs/quality/QUALITY-BACKLOG.md` — приоритет над feature queue |

## Порядок (не параллелить)

```text
schema → diary CRUD → recents/favorites → recipes cooked yield → export/delete
→ workouts + barcode camera/OFF + label text parse + flexible habits
→ profile (v5) + user habits CRUD
→ (later) challenges; on-device OCR → health / AI → Play
```

## Автоматизация

См. `docs/08-AUTOMATION.md`, `automation/bootstrap-checklist.md`, `automation/setup-status.md`.

- Один issue / одна ветка / один PR; merge только человеком.
- Локально и в Cloud Agent: только acceptance criteria текущего issue.
- Label `agent-ready` → реализация из `prompts/NN-*.md`.
- CI / локально: `npm run verify` (typecheck + test + security + mobile tsc).

## Definition of Done (MVP dogfood)

- [x] Повтор еды из Recent в 1 тап; undo на удаление
- [x] Всё локально без сети; null не становится 0
- [x] Рецепт с cooked yield корректен на тестах и в UI
- [x] Export/delete своих данных
- [x] Нет обязательного аккаунта / AI / камеры для базового лога
- [x] a11y labels на основных контролах
- [x] Свои привычки: создать / изменить / удалить; Today чеклист без хардкода
- [x] Challenges (личные метрики, Progress)

## Запреты

- Fake backend / silent AI guesses / invented nutrition values
- Secrets или реальные health records в git/tests/logs
- Auto-merge в `main`, production Play, credentials от агента
- Shame/guilt copy; negative/NaN grams treated as valid

## Команды проверки

```bash
npm run verify
```

## APK (dogfood, не Play)

Локально (JDK 17 + Android SDK в `~/.momentum-build` или свои `JAVA_HOME`/`ANDROID_HOME`):

```bash
cd apps/mobile && npm run build:apk:local
# → apps/mobile/dist/momentum-dogfood.apk  (release + embedded JS; Metro не нужен)
# FORCE_PREBUILD=1 — пересоздать android/
```

EAS cloud (нужен `eas login` + `eas init` для `projectId`):

```bash
cd apps/mobile && npm run build:apk
```

Play production / AAB — только с human sign-off (`docs/10-PLAY-RELEASE.md`).
