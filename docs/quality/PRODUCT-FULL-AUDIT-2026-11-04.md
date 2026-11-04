# nf-fit — полный продуктовый аудит

**Дата:** 2026-11-04  
**Ветка факта:** `main` @ `076c3bc` (#185 widgets)  
**APK dogfood:** `apps/mobile/dist/momentum-dogfood.apk` (arm64-v8a, ~89 MB)  
**Метод:** код + docs (PRD, UX, overhaul, design, screen proposals) + route/sheet inventory.  
**Не заменяет:** device walkthrough, stopwatch ≤10 с, TalkBack, Garmin live sync, cold-start на телефоне.

Связанные артефакты: `docs/01-PRD.md`, `docs/03-UX.md`, `docs/PRODUCT-OVERHAUL-AUDIT.md`, `docs/DESIGN-AUDIT.md`, `docs/quality/SCREEN-IMPROVEMENT-PROPOSALS.md`, `docs/release/FRIENDS-BETA-STATUS.md`.

---

## 0. Вердикт одной страницей

**nf-fit — сильный offline-first companion для личного dogfood:** вертикальный срез еды/рецептов/привычек/Garmin/отчётов реально собран, дизайн-система сведена к одному языку, 5 вкладок совпадают с целевой IA, verify зелёный.

**Но продукт ещё не «закрыт» как ежедневный инструмент скорости записи.** Северная звезда PRD (повтор еды ≤10 с на midrange Android) **в коде почти достижима** (copy yesterday, Recent «+», saved meals), но **не доказана на устройстве**. Today как командный центр перегружен метриками и отодвигает быстрый лог. Инженерия держится на god-object + full-JSON snapshot — ок для dogfood, риск для роста истории.

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| Соответствие vision / PRD P0 | **A−** | MVP shipped; P1 partial |
| UI / визуальная цельность | **B** | DS есть; fold/иерархия CTA слабее |
| UX скорость лога (код) | **B+** | Fast paths есть; Today не заточен |
| UX скорость лога (device) | **?** | Friends Beta BLOCKED |
| Пользовательский путь «день» | **B** | Общая дата ок; Plan рядом путает |
| Рацион / рецепты / batch | **A−** | Yield + snapshot сильные |
| Движение / сон / Garmin | **B** | IA ок; device/Garmin unverified |
| Прогресс / отчёты | **B−** | Функции есть; экран плотный |
| Инженерия / архитектура | **B−** | Domain A; persist/repo C+ |
| Приватность | **A−** | SecureStore; shallow secret scan |
| Готовность Friends Beta | **BLOCKED** | Нужен device Pass |

**Итог:** продукт готов к **основательскому dogfood на APK**, не к раздаче друзьям без ручного Pass. Главный рычаг ценности сейчас — не новые фичи, а **ускорение и доказательство повторного лога + прореживание Today/Food**.

---

## 1. Продукт vs обещание

### North-star (PRD)
1. Повтор еды **≤10 с**  
2. Прогресс «с первого взгляда»  
3. Маленькие достижимые привычки без наказания  
4. Данные у пользователя (export / clipboard ChatGPT, без silent cloud)

### Что уже хорошо совпадает
- Offline дневник, 4 приёма, edit/soft-delete, КБЖУ дня, `unknown ≠ 0`.
- Ручные продукты, порции, source metadata, snapshot КБЖУ при записи.
- Рецепты: сырьё → cooked yield → порция с историческим snapshot.
- Sticky **Добавить еду** + сканер на Сегодня/Питание.
- **Повторить вчера** (1 тап + undo).
- Recent «+» в `AddFoodSheet` = instant add прошлой порции.
- 5 tabs: Сегодня · Питание · Движение · Прогресс · Профиль; сон внутри Движения.
- Garmin Personal API key в SecureStore; отчёты PDF + plain text clipboard.
- Android home widgets (5 light Nothing-style) в свежем APK.

### Что обещано, но слабо или не доказано
| Обещание | Факт |
|----------|------|
| Median repeat ≤10 с на device | Только code path; `#37` / DEVICE-DOGFOOD open |
| Today = быстрый лог above fold | Recent strip wired (`fix/today-recent-strip-wire`); device timing still open |
| Понять прогресс at a glance | Progress сегментирован, но «стена» карточек |
| ≥20/30 дней founder dogfood | Процессный gate, не метрика в репо |
| 0 data-loss / 95% save reliability | Не измерено после force-stop на device |
| Barcode + OFF | Partial; сеть/latency/fallback многошаговые |
| Виджеты «живые» | Binary в APK есть; UX sync на device — dogfood |

### Non-goals — соблюдены (плюс)
Нет medical coaching, нет silent OpenAI API, нет auto-log plan→diary, нет invented КБЖУ, нет Play production в процессе. Это дисциплина продукта, не слабость.

---

## 2. UI / UX

### 2.1 Информационная архитектура
**Сильная:** 5 root tabs совпадают с roadmap Variant A; stacks Recipes / Plan / Garmin не засоряют tab bar; общая `dateLocal` связывает день.

**Слабая:**
- Иконка **План** (compass) в header Сегодня и Питание стоит рядом с ядром «факт дневника» → риск путаницы plan ≠ diary (особенно Eat Now).
- Рецепты доступны из 3–4 входов (sheet, catalog, `/recipes`, import) — гибко для power-user, шумно для новичка.
- Профиль (~806 LOC UI) = свалка настроек + интеграций + данных.

### 2.2 Сегодня (`(tabs)/index`)
Порядок fold: дата → DayStrip → KcalRing → StatCards (вода/активность/шаги/сон) → Copy yesterday → habits → **избранное**.

| Плюс | Минус |
|------|-------|
| Кольцо + метрики дают «картину дня» | Первый экран отвечает на «как день?», а не «что съесть быстро» |
| Sticky Add + scan | Favorites требуют Confirm; recent above fold нет |
| Copy yesterday mid-scroll | Habits выше favorites — north-star ниже fold |
| Plan в header | Конкурирует за внимание с логом |

**Оценка UX Today: B−** как dashboard, **C+** как speed-logger.

### 2.3 Питание (`(tabs)/food`)
Сегменты Дневник | Каталог — правильное dual model. Sticky Add + scan. MealSection: empty slot → Add с нужным meal; filled → тяжёлые `AppCard`, swipe-delete, copy meal, bookmark.

| Плюс | Минус |
|------|-------|
| Явный дневник дня | Карточки приёмов «шумные» (плотность) |
| Copy yesterday + repeat meal icon | Repeat meal пишет в **global meal**, не в slot секции |
| Catalog FlatList + фильтры | Два «каталога»: Food segment vs AddFoodSheet |
| Scanner справа | Undo на delete есть; на add из sheet — часто нет |

**Оценка: B+** для дневника дня; скорость правки ещё не MyFitnessPal-уровня.

### 2.4 Движение / Прогресс / Профиль
- **Движение:** Activity | Sleep — IA ок; above-fold summary должен сразу отвечать на шаги/минуты/ккал (proposals M1).
- **Прогресс:** много сегментов (неделя/тело/привычки/отчёты); primary action «скопировать для ChatGPT» не всегда доминирует.
- **Профиль:** полный, но перегружен; onboarding лёгкий по PRD — ок, но first-run path до первого лога стоит проверить на device.

### 2.5 Дизайн-система
Токены в `src/design-system/tokens.ts`, primitives App*; Shame-free copy в целом держится.

Остаточный долг (из DESIGN-AUDIT + кода):
- `PrimaryButton` ещё ~19 импортов (wrapper).
- Локальные StyleSheet повсеместно; редкий hex вне tokens.
- Конкурирующие CTA / spacing rhythm / empty-state не везде едины.
- Карточный шум на Food diary.

**Оценка визуала: B** (гораздо лучше pre-overhaul; не «pixel-closed»).

### 2.6 Accessibility / trust
Labels на tabs и ключевых CTA есть. Device TalkBack Pass — **открыт**. Unknown метрики как «—», не 0 — сильный trust-сигнал. Нет красных «провалов» streak — соответствует принципам.

---

## 3. Пользовательские пути и скорость записи

### 3.1 Матрица happy paths (тапы до записи)

| Сценарий | Лучший путь | Тапы | Реализм ≤10 с |
|----------|-------------|------|----------------|
| Повторить вчерашний день | «Повторить вчера» | **1** | Да (если кнопка видна) |
| Повторить приём (иконка copy) | Food diary | **1** | Да* (*slot bug) |
| Повтор продукта Recent «+» | Add → Recent → + | **2** | Да (power-user) |
| Избранное с Today | scroll → item → Confirm → Add | **2 + scroll** | Под вопросом |
| Saved meal | Add → Приёмы → log | **2–3** | Да после setup |
| Новый из поиска | Add → type → Confirm | **3+** | Нет (ввод) |
| Ручной продукт | Вручную → поля → Confirm | **5–8** | Нет |
| Штрихкод hit | Scan → Confirm | **2–3 + camera** | Зависит от сети |
| Штрихкод miss | fallback multi-phase | **4–8+** | Нет |
| Рецепт из sheet | Рецепты → Confirm | **3** | Близко |
| Рецепт из `/recipes` | stack → detail → дневник | **4–5** | Нет как «быстрый» |

### 3.2 JTBD «рацион / batch cook»
Сильная сторона продукта: cooked yield, portion из рецепта, pantry / Eat Now / week plan **отделены** от diary.  
Слабость: когнитивная нагрузка «где планирую vs где уже съел»; Eat Now тоже ведёт в `ConfirmPortionSheet` — правильно технически, но UI должен ещё жёстче говорить «это черновик / это факт».

### 3.3 Типичный день пользователя (идеал vs факт)

**Идеал PRD:** открыл → увидел остаток ккал → 1–2 тапа повтор → totals обновились → undo если ошибка.

**Факт кода:**
1. Открыл Today → сначала ring + 4 метрики + habits.  
2. Быстрый лог либо sticky Add → sheet Recent «+», либо copy yesterday (если заметил).  
3. Undo на sheet-add часто отсутствует → страх «лишней» записи.  
4. Новинка/скан — длиннее, ок; но miss barcode болезненный.

### 3.4 Friction top-10 (продукт)
1. Today fold не заточен под repeat ≤10 с.  
2. Нет recent strip above fold на Today (wireframe ≠ код).  
3. Favorites на Today всегда через Confirm (медленнее sheet «+»).  
4. Undo непоследователен (copy/delete да; AddFoodSheet/barcode/recipe часто нет).  
5. `repeatMealSlot` → неверный meal slot.  
6. Plan icon конкурирует с diary mental model.  
7. Тяжёлые meal cards снижают плотность дневника.  
8. Barcode miss / offline — много фаз.  
9. Progress/Profile cognitive load.  
10. Device timing и persist после kill — не закрыты.

---

## 4. Разработка / инженерия

### 4.1 Архитектура (факт)
```
Screens → DataContext { repo, dateLocal, meal, revision, undo }
       → FoodRepository (~3789 LOC, in-memory Maps)
       → toSnapshot() JSON → expo-sqlite store_snapshot
       → revision → widget JSON sync
Domain pure (nutrition, garmin, planner, reports…)
Garmin secrets → SecureStore only
```

### 4.2 Сильные стороны
- Чистый domain, `unknown ≠ 0`, entry nutrition snapshot.
- Snapshot version 18 + import gate; `npm run verify` (tsc + ~55 test files + security scan + mobile tsc).
- DataContext тонкий; SecureStore для Garmin.
- Overhaul Stages 1–11 + dogfood fixes на main; процесс issue→PR соблюдается.
- Явный Release Lock: не плодить фичи до device Pass.

### 4.3 Риски
| Риск | Почему важно |
|------|----------------|
| Full JSON persist на каждую мутацию | Рост истории → hitch/ANR гипотеза на UI thread |
| God-object `foodRepository.ts` | Blast radius любой правки diary/planner/Garmin |
| Global `revision` fan-out | Любая мутация → перерисовка всех экранов + widget |
| Migrations stub vs blob | Нет partial recovery / indexed queries |
| Крупные UI blobs | AddFoodSheet ~619, Barcode ~661, profile ~806 |
| Planner/FI вес уже в репо | Scope creep при замороженном release |
| Doc drift | FRIENDS-BETA tip `f8787f8` vs real `076c3bc` |
| Тесты | Domain сильный; UI/E2E почти нет |

### 4.4 Оценка инженерии
**Готово к founder dogfood.** Не готово к масштабу «годы истории / много друзей» без persist coalesce + сужения подписок + (позже) split repo. Нормализованный SQLite **не** приоритет, пока device не докажет боль (явно в DEV-PLAN).

---

## 5. Сводная карта экранов (статус)

| Экран | Роль | Статус опыта | Главный gap |
|-------|------|--------------|-------------|
| Сегодня | Hub + fast log | Partial | Fold = metrics, не speed |
| Питание | Diary + catalog | Working+ | Density, undo, slot bug |
| Движение | Activity \| Sleep | Partial | Device/Garmin evidence |
| Прогресс | Trends + reports | Partial | Primary action размыт |
| Профиль | Goals + privacy + sync | Working | Перегруз |
| Recipes | Batch / yield | Working | Много входов |
| Plan/* | Draft ≠ diary | Working | IA confusion risk |
| Garmin/* | Key + sync | Partial | Manual QA |
| Widgets | Glance | Partial | Device sync feel |

---

## 6. Слабые точки — приоритетный бэклог

Шкала: **P0** блокирует доверие/скорость/релиз · **P1** north-star · **P2** ясность · **P3** polish.

### P0 — сделать до Friends Beta
1. **Device Pass** по `DEVICE-DOGFOOD-15MIN.md`: persist после kill, crash, Garmin L1–L5, TalkBack smoke; обновить `FRIENDS-BETA-STATUS.md`.  
2. **Stopwatch n≥10:** Recent «+» и «Повторить вчера» на midrange Android; зафиксировать в PERFORMANCE / issue #37.  
3. **Баг `repeatMealSlot`:** клон приёма в slot секции, не в global `meal`.  
4. **Undo на все add-path’ы** sheet / barcode / recipe detail (симметрия с delete/copy).

### P1 — скорость и ясность лога
5. Today: **recent strip 3–6 above fold** + one-tap «+» — **wired in code** (`fix/today-recent-strip-wire`); device stopwatch still open.  
6. Today: сжать ring+macros; habits ниже fold; favorites/recent выше habits.  
7. Food diary: **компактные строки** вместо тяжёлых AppCard на каждую запись.  
8. Явный caption dual model: Дневник = факт · Каталог = база; Plan — «черновик, не дневник».  
9. Progress: default = 7-day overview + один primary «Скопировать день для ChatGPT».  
10. Persist: debounce/coalesce snapshot writes (без rewrite storage).

### P2 — инженерия и полировка
11. Сузить `revision` подписки (per-area counters).  
12. Split facade `FoodRepository` по bounded context (после device evidence).  
13. Добить PrimaryButton → AppButton; единый empty/error.  
14. FlatList для горячих plan-списков при jank.  
15. Content-aware secret scan; синхронизировать stale docs (STATUS tip, widget `binaryShipped`, TECHNICAL-AUDIT v18).

### P3 — позже (после Pass)
16. Swipe edit / copy-to-day на строках дневника.  
17. Анимация ring pulse после add.  
18. «Повторить вчерашнюю тренировку».  
19. Упрощение входов в Recipes (один канон).  
20. Новые фичи (voice/image/OCR/FI-5+) — только с human approve и после Pass.

---

## 7. Что сознательно НЕ слабость

- Размер APK 89 MB (arm64) vs 206 MB (universal) — фильтр ABI, не «урезанный продукт».  
- Отсутствие cloud sync / social / подписок — non-goal.  
- Confirm portion на novel food — правильный trade-off accuracy vs speed.  
- Release Lock на крупные фичи — зрелость процесса.

---

## 8. Рекомендуемый порядок работ (следующие 2–3 недели)

```
1) Human: поставить свежий APK → device Pass checklist
2) Code: fix repeatMealSlot + undo на add paths          ← P0
3) Code: Today recent above fold + fold reorder          ← P1
4) Code: Food compact rows                               ← P1
5) Eng:  persist coalesce + STATUS/docs sync             ← P1/P2
6) Only then: Friends Beta unblocked → точечный polish
```

**Не начинать:** новый stage фич, Play, нормализованный SQLite «на будущее», ещё один визуальный overhaul без device evidence.

---

## 9. Метод и ограничения этого отчёта

- Опирается на код `main` 2026-11-04 и docs; **не** на свежий timed dogfood на телефоне.  
- Оценки letter-grade — экспертные, не пользовательская выборка.  
- UI proposals детальнее в `SCREEN-IMPROVEMENT-PROPOSALS.md`; engineering — в выводах §4; food timing — §3.

**Авторство:** агентный code/docs audit. Следующий обязательный слой истины — 15–30 мин на физическом Android с секундомером.

---

## 10. Remediation status (2026-11-04 · #186)

| # | Пункт | Статус |
|---|-------|--------|
| 1–2 | Device Pass + stopwatch | **needs-human** |
| 3 | repeatMealSlot → slot | Done |
| 4 | Undo на add paths | Done |
| 5–6 | Today recent + fold | Done |
| 7 | Compact diary rows | Done |
| 8 | Dual-model captions | Done |
| 9 | Progress ChatGPT primary | Done |
| 10 | Persist coalesce | Done |
| 11 | Revision narrowing | Deferred (risk) |
| 12 | Split FoodRepository | Deferred (after device) |
| 13 | PrimaryButton → AppButton | Done (consumers) |
| 14 | Plan FlatList | Deferred (nested scroll) |
| 15 | Secret scan + docs | Done |
| 16 | Swipe copy-to-day | Done |
| 17 | Ring pulse | Done |
| 18 | Repeat yesterday workouts | Done |
| 19 | Recipes canon caption | Done |
| 20 | New feature stages | Skipped (Release Lock) |
