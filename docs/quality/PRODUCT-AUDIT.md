# Momentum — Product Quality Audit

**Дата:** 2026-10-20 (baseline) · **Refresh:** 2026-11-01 (Stage 1 docs sync)  
**Статус baseline:** утверждён 2026-10-20.  
**Актуальный overhaul SoT:** `docs/PRODUCT-OVERHAUL-AUDIT.md`, `docs/PRODUCT-ROADMAP.md`, `docs/DESIGN-AUDIT.md`.  
**Метод baseline:** static + code/docs review. Device E2E по-прежнему не закрыт.

### Факт на 2026-11-01 (не заменяет детальный overhaul-audit)

| Слой | Факт |
|------|------|
| Ветка | `feat/garmin-personal-sync` (+ dogfood Garmin/sleep/reports) |
| Tabs | 6 temporary (Сон отдельной вкладкой); target = 5 «Движение» |
| Snapshot | **v18** (sleepNights + dailyActivityStats + garminSync) |
| SQL migrations stub | SCHEMA_VERSION **8** (не путать со snapshot) |
| Integrations | Garmin Personal API (SecureStore); Zepp CSV; OFF barcode |
| Reports | PDF + plain text clipboard for ChatGPT (no direct API) |
| Persist | Full JSON snapshot per mutation (risk noted; no rewrite without metrics) |

Связанные артефакты: `UX-FLOWS.md`, `SCREEN-AUDIT.md`, `DESIGN-SYSTEM-AUDIT.md`, `PERFORMANCE-BASELINE.md`, `TECHNICAL-AUDIT.md`, `E2E-TEST-MATRIX.md`, `QUALITY-BACKLOG.md`, `QUALITY-ROADMAP.md`, `docs/garmin-personal-sync.md`.

---

## Executive Summary — 10 самых серьёзных проблем (2026-10-20; many still open)

| # | Проблема | Доказательство | Тип |
|---|----------|----------------|-----|
| 1 | **Feature creep без склейки JTBD** — Food Planner (FP-1…7), budget, stores, archive, challenges добавлены подряд; north-star «повтор ≤10 с» не измерен на устройстве | `docs/17-DEV-PLAN.md` epic Done; merged PRs #21–#33 за ~1 день; PRD north-star гипотеза | Evidence (код/история) + Hypothesis (реальный dogfood) |
| 2 | **Today перегружен конкурирующими CTA** — shortcuts, ring, plan strip, add block, habits, water, favorites, journey chips | `apps/mobile/app/(tabs)/index.tsx` (~386 строк): JourneyShortcuts + TodayPlanStrip + AddFoodBlock + TodayChecklist + … | Evidence |
| 3 | **Food tab = дневник + каталог + план + поиск** на одном скролле; dual path с Today для add | `food.tsx` (~514 строк): DateSwitcher, WeekStrip, KcalRing, TodayPlanStrip, meals, catalog, search | Evidence |
| 4 | **AddFoodSheet монолит ~842 LOC** — главный путь логирования; высокий риск регрессий и медленных правок | `apps/mobile/src/features/diary/AddFoodSheet.tsx` | Evidence |
| 5 | **Нет виртуализации списков** — FormScrollView везде; при росте дневника/каталога UI деградирует | `rg FlatList` ≈ нет в UI; каталог рендерит массивы в ScrollView | Evidence; perf на 10k — Hypothesis |
| 6 | **Persist = полный JSON snapshot в SQLite** на каждое изменение — O(size) write; нет посущностных запросов | `expoFoodStore.native.ts` `writeSnapshot` всей `StoreSnapshot` | Evidence; latency — Hypothesis |
| 7 | **God-repository ~2760 LOC** — вся доменная мутация в одном файле | `src/storage/foodRepository.ts` | Evidence |
| 8 | **Дизайн-система расходится с docs** — код Nothing-mono (`#111`), docs draft teal/gold | `apps/mobile/src/theme/tokens.ts` vs `docs/04-DESIGN-SYSTEM.md` | Evidence |
| 9 | **Нет E2E / device perf baseline** — unit ~169 pass ≠ удобство; `docs/11-QUALITY.md` цели не измерены | нет Maestro/Detox; `PERFORMANCE-BASELINE.md` | Evidence |
| 10 | **Planner глубина ≠ ценность** — budget/stores/receipt есть, но «стоимость съеденного» зависит от цен/имён; Eat Now без целей слабый | `foodBudget.ts`, `monthEatenCostEstimate`; `eat-now.tsx` empty states | Evidence + Hypothesis (dogfood) |

---

## Phase 0 — Состояние продукта и заморозка

### Актуальное состояние (факт)

| Слой | Факт |
|------|------|
| Платформа | Expo Router; **2026-11-01:** 6 tabs incl. Sleep (target 5) |
| Стек | React Native + strict TS + in-memory repo + SQLite snapshot persist |
| Snapshot | **`version: 18`** (sleepNights; was 13 at baseline audit) |
| Domain | ~32 TS модуля в `src/domain` |
| UI | ~55 TSX в `apps/mobile/src`; 25 shared components |
| Тесты | ~35 `tests/*.mjs`, `npm run verify` зелёный на CI |
| Offline | Базовый лог без сети; OFF нужен только barcode lookup |

### Roadmap / Issues / PR (2026-10-20)

| Состояние | Элементы |
|-----------|----------|
| Open issues | **#5** Food catalog polish (agent-review); **#10** founder ritual docs (`agent-ready`) |
| Open PR | **#20** Cloud Agent: FoodCatalogList polish (CI green) — **не feature**, visual/a11y |
| Dispatcher | `DISPATCH_ENABLED=false`, `DISPATCH_DRY_RUN=true` (`automation/setup-status.md`) |
| Недавний feature burst | FP epic #21–#27 + dogfood #28–#33 |

### Заморозка — **утверждена** 2026-10-20

1. Feature freeze 2–3 недели; без `agent-ready` на product features.
2. Разрешено: quality Sprint 1 (baseline, P0, измерения), polish review #20, docs.
3. Dispatcher dry-run; без auto-merge; без включения Dispatcher.
4. Измерения и E2E **до** масштабного UX-редизайна Today/Food/AddFoodSheet.
5. Не rewrite foodRepository / normalized SQLite без доказанной нужды.
6. Эталон качества = food log path; остальные модули — после.

### Что не делать сейчас

- Не rewrite приложения.
- Не параллельные redesign PR.
- Не auto-merge (в т.ч. #20 — только после review).
- Не выдавать unit-green за UX-pass.

---

## Phase 1 — JTBD (кратко; детали в UX-FLOWS.md)

| JTBD | Вердикт функции | Рекомендация |
|------|-----------------|--------------|
| 1 Быстрый лог | Core path существует (Recent / copy yesterday / portion sheet), но размазан по Today+Food+Sheet | **Упростить и измерить ≤10s** — P1 |
| 2 Что приготовить | Recipes + pantry + Eat Now «Дома» частично | Склеить discovery; не плодить picker screens |
| 3 Перекус / Eat Now | Экран есть; нужен target KBJU иначе «пустой» | Улучшить empty→profile; не добавлять AI |
| 4 Неделя | Week/shop/budget shipped | **Dogfood validate** перед FP-8; упростить hub copy |
| 5 Прогресс | Charts + habits + challenges + PDF | Скрыть/свернуть challenges если не используются |
| 6 Не вводить повторно | Saved meals, import, cook-again, aliases | Держать; polish discovery, не новые import channels |

### Функции под сомнением (не удалять без согласования)

| Функция | Проблема | Опция |
|---------|----------|-------|
| Stores preferences | Tags без эффекта на shop/Eat Now | Hide или wire to shop filter |
| Budget «стоимость съеденного» | Часто «нужны цены» | Clarify UX; или defer metric |
| Challenges | Конкурирует с habits на Progress | Progressive disclosure |
| JourneyShortcuts на Today | Дубли tab bar | Сократить до 2–3 или убрать |
| Receipt stub | Manual only — OK, но deep in stores | Keep as secondary |

---

## Критерий успеха аудита

Momentum становится **проще, быстрее и полезнее**, а не больше. Следующий шаг после approve: Quality Sprint по `QUALITY-ROADMAP.md` маленькими PR.
