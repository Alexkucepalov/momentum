# Momentum — Product Roadmap & IA (Этап 0)

**Дата:** 2026-11-01  
**Зависит от approve:** `PRODUCT-OVERHAUL-AUDIT.md`, `DESIGN-AUDIT.md`, `DESIGN-SYSTEM.md`.  
**Правило:** один issue → одна ветка → один PR; без merge в main без человека; без production Play.

---

## 1. Целевая информационная архитектура

### Рекомендация по вкладке «Сон»

**Рекомендация: не держать Сон как 6-ю root-вкладку.**  
На узком Android шесть пунктов режут labels и конкурируют с core JTBD (еда).

**Вариант A (предпочтительный):**  
Root tabs = **Сегодня · Питание · Движение · Прогресс · Профиль**  
«Движение» = сегменты **Активность | Сон** (общая дата, Garmin sync).

**Вариант B:** оставить Сон отдельной вкладкой, но тогда **убрать** отдельный Progress из tab bar (Progress → из Сегодня/Профиль). Хуже для «отчётов».

**Этап C (Stage 3):** вариант A в коде — 5 root tabs, Сон внутри Движения.

### Карта разделов и роли

| Раздел | Роль | Доступ |
|--------|------|--------|
| **Сегодня** | Дневной командный центр: статус + быстрый лог | Tab |
| **Питание** | Дневник дня + каталог | Tab |
| **Движение** | Тренировки + шаги + **сон** | Tab (Activity+Sleep) |
| **Прогресс** | Неделя/месяц, привычки, отчёты | Tab |
| **Профиль** | Цели, интеграции, данные, приватность | Tab |
| Рецепты | Библиотека блюд | Stack из Питание/Сегодня |
| План питания | Черновики меню ≠ дневник | Stack `/plan` |
| Pantry | Запасы / batches | `/plan/pantry` |
| Покупки | Missing-only list | `/plan/shop` |
| Импорт покупок | Paste/OCR → preview → confirm | `/plan` flows |
| Бюджет | План/факт расходов на еду | `/plan/budget` |
| Garmin | Ключ + sync | `/garmin` из Профиль |
| Zepp CSV | Импорт веса | Профиль |
| Отчёты | PDF + текст для ChatGPT | Прогресс · Отчёты (+ shortcut Профиль) |
| Export/restore | JSON | Профиль |
| Привычки / челленджи | Личные метрики без shame streaks | Прогресс |

**Не добавлять** отдельный root tab для Planner, Recipes, Garmin.

---

## 2. Этапы реализации (A–I)

### A. Надёжность и сохранение данных
**Цель:** не потерять dogfood-данные; зафиксировать ветку.

| Задача | Prio | Сложность | Depends | Файлы (ориентир) | DoD | Тесты |
|--------|------|-----------|---------|------------------|------|-------|
| A1 Commit/stabilize Garmin+sleep+reports на feature branch | P0 | M | — | working tree | PR открыт; verify green | existing + garmin/day-report |
| A2 Document snapshot v18 + import max version | P0 | S | A1 | `types`, `importExport`, `garmin-personal-sync.md` | docs=code | import-export tests |
| A3 Persist smoke: export → wipe → import на device | P0 | S | A1 | — | checklist signed | manual |
| A4 Add-guard / no invented nutrition regression | P1 | S | — | domain nutrition | verify | nutrition tests |

### B. Единая дизайн-система
**Цель:** primitives + tokens Premium Minimal Utility.

| Задача | Prio | Сложность | Depends | Файлы | DoD | Тесты |
|--------|------|-----------|---------|-------|------|-------|
| B1 Approve + apply token deltas | P0 | M | DS approve | `src/design-system/tokens.ts`, docs/04 | one palette | nf-fit-phase0 |
| B2 AppButton supersedes PrimaryButton | P0 | M | B1 | design-system, sweep PrimaryButton | no new PrimaryButton | compile |
| B3 Field, Chip, Segment, ChartFrame, ErrorBanner | P1 | L | B1 | `apps/mobile/src/design-system/*` | story/usage on 1 screen | unit smoke |
| B4 Ban hex outside tokens (checklist + sample lint) | P1 | S | B1 | AGENTS / PR template | documented | — |

### C. Полный визуальный редизайн экранов
**Цель:** один язык; без смены domain.

| Задача | Prio | Сложность | Depends | Файлы | DoD | Тесты |
|--------|------|-----------|---------|-------|------|-------|
| C1 DayChrome unify (kill DateSwitcher dual) | P0 | M | B1 | DayStrip, food/activity/today | one date UI | — |
| C2 Today fold redesign | P0 | L | B2,C1 | `index.tsx`, StatCards, TodayActivity | one primary CTA | — |
| C3 Food diary/catalog visual | P0 | L | C1 | `food.tsx`, FoodCatalogList | segments + DS | phase1 UI test |
| C4 Activity+Sleep merge IA (вариант A) | P1 | L | approve IA | tabs layout, sleep.tsx | 5 tabs | — |
| C5 Progress overview polish | P1 | M | B3 | `progress.tsx` | ≤3 top segments | — |
| C6 Profile regroup | P1 | M | B2 | `profile.tsx` | Goals→Integrations→Data | — |
| C7 Sheets visual (AddFood/Confirm) | P0 | L | B2 | diary sheets | DS compliance | add-guard |
| C8 Plan/Recipes pass | P2 | L | B3 | plan/*, recipes/* | consistent lists | — |

### D. Дневник и быстрый повтор
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| D1 Repeat yesterday meal UX (one clear path) | P0 | M | C3 | ≤10s path documented + device timed | repeat-meal |
| D2 Saved meal / recent strip density | P1 | S | C3 | visible above fold in Food | — |
| D3 Virtualize catalog when N>threshold | P1 | M | C3 | FlatList | — |

### E. Рецепты и приготовление
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| E1 Recipe hub spacing + Field forms | P1 | M | B3 | visual QA | recipe tests |
| E2 Cook-again discoverability from Today/Food | P2 | S | E1 | entry points ≤2 taps | cook-again |

### F. Garmin, сон, активность
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| F1 Device verify sleep summaries mapping | P0 | M | A1 | real night shows stages | garmin-sync fixtures |
| F2 Sync status UX (collapsible warnings) | P1 | S | C6 | clear last sync | — |
| F3 Workout detail chart tokens | P2 | S | B3 | ChartFrame | — |
| F4 Zepp CSV discoverability | P2 | S | C6 | profile card OK | zepp tests |

### G. Месячная аналитика и челленджи
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| G1 Month overview (weight/sleep/sport/nutrition) | P1 | L | C5 | one month screen/section | flexible-report |
| G2 Personal challenges UX (self-challenge without shame) | P1 | M | C5 | create/review easy | sprint4 |
| G3 ChatGPT period copy presets (7/30d) | P2 | S | — | already partial | day-report |

### H. Food Planner
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| H1 Hub IA: demote stores; clarify planned≠eaten | P1 | M | C8 | copy + order | — |
| H2 Eat Now + pantry coverage polish | P1 | M | H1 | useful empty states | eat-now |
| H3 Shopping missing-only + budget labels | P2 | M | H1 | no fake live prices | shopping/budget |
| H4 Purchase import path clarity | P2 | M | H1 | preview confirm | purchase-import |

### I. Android polish & final testing
| Задача | Prio | Сложность | Depends | DoD | Тесты |
|--------|------|-----------|---------|------|-------|
| I1 Device dogfood 15min checklist | P0 | M | C*,D1,F1 | signed checklist | manual |
| I2 Widget visual + refresh verify | P1 | M | A1 | home screen OK | — |
| I3 TalkBack sample pass | P1 | M | C* | critical paths labeled | manual |
| I4 Visual audit pack Android Pass | P1 | M | C* | PNGs + APK sha | — |
| I5 Update stale docs (PRD/UX/SCREEN-AUDIT) | P0 | S | approve | docs=code | — |

---

## 3. Первые 5 задач для реализации (после approve Этапа 0)

| # | Задача | Почему первая | Этап |
|---|--------|---------------|------|
| **1** | **A1 — Закоммитить и открыть PR** текущего Garmin/sleep/UX working tree | Иначе overhaul строится на песке | A |
| **2** | **I5/A2 — Синхронизировать docs + snapshot v18 notes** | Убрать drift PRD/TAB_SHELL/SCREEN-AUDIT | A |
| **3** | **B1 — Токены Premium Minimal Utility** (после approve DS) | Без этого редизайн разъедется снова | B |
| **4** | **C1 — Единый DayChrome** | Склейка Сегодня/Питание/Движение | C |
| **5** | **C2+C7 kickoff — Today fold + AddFoodSheet visual shell** | North-star путь логирования | C/D |

**Не начинать** C4 (merge Sleep) и полный Plan redesign до approve IA варианта A/B.

---

## 4. Ограничения (повтор)

- Android only; no backend; no forced cloud.  
- No third-party personal data without explicit user action (Garmin key / clipboard paste to ChatGPT).  
- No invented КБЖУ; unknown ≠ 0.  
- Planned ≠ diary.  
- No dangerous migrations without human.  
- No auto-merge; no Play production.  
- No store scraping.  
- No medical diagnosis / shame motivation.

---

## 5. Definition of Done для всего Overhaul

1. 5 root tabs (или явно approved 6) с одной DS.  
2. Device dogfood: лог еды ≤10s измерен хотя бы основателем.  
3. Garmin sleep+workouts verified on device.  
4. `npm run verify` green; docs обновлены.  
5. Visual audit pack Android Pass.  
6. Snapshot export/import round-trip без потери v18 полей.
