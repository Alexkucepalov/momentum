# План качества Friends Beta — исполнение 2026-11-08

**Статус:** active  
**Направление UI:** вариант A — практичный минимализм  
**Источник:** полный аудит 2026-11-08 + UI/architecture/security deep-dives + ревью скриншотов + уточнения основателя  

Код меняется **только** пакетами ниже, по одному PR. WIP-фичи (streak/weight/pixel widgets) не смешивать.

Связано: `FULL-AUDIT-2026-11-08.md`, `DEVICE-DOGFOOD-15MIN.md`, `FRIENDS-BETA-STATUS.md`, issues `#92` `#93`.

---

## Принципы

1. North-star: повтор еды ≤10 с; plan ≠ diary; `unknown ≠ 0`.  
2. Один PR = один пакет; verify зелёный; merge после verify (по разрешению основателя 2026-11-08).  
3. Visual / data / wipe — отдельные PR.  
4. Backup/heal **не доказывает** wipe — нужна проверка. JSON snapshot ≠ P0 сам по себе.  
5. Пиксельный widgets-preview — product decision, не блокер беты, пока не в native release.

---

## Порядок пакетов

| № | Pri | Пакет | Критерий готовности | Статус |
|---|-----|-------|---------------------|--------|
| **0** | — | Базовые состояния + план + mobile Today reshoot | Документ плана; набор состояний для QA | **done** (план) |
| **1** | P0/P1 | Данные: snapshot / wipe / sync | Force-stop держит записи; wipe чистит SecureStore + snapshot + widget; удалённое не возвращается; stale sync не пишет после wipe | **done** (#190) |
| **2** | P1 | Общие компоненты: tab labels, contrast, touch | 5 подписей читаются; muted ≥4.5:1; 48dp | next |
| **3** | P1 | Today / Food / Каталог | FoodQuickStrips выше приёмов; компактные empty | next |
| **4** | P1 | Добавление еды `04–07` | Разделить режимы; независимые ккал; MFP copy убрать | later |
| **5** | P1 | План / неделя | Вертикальный день; явное «Перенести» | later |
| **6** | P2 | Подбор / запасы / покупки / магазины | Один CTA на empty | later |
| **7** | P1 | Рецепты / импорт | Расчётный выход помечен; verify before save | later |
| **8** | P1 | Бюджет / покупки | Нет «≈0 ₽» без данных; confirm import | next (с 10) |
| **9** | P2 | Движение / сон | Прямой Garmin; минимум полей | later |
| **10** | P1 | Progress | Нет ложного «ср. 0»; экспорт в Отчёты; покрытие | **in PR** (avg only) |
| **11** | P2 | Профиль / Garmin UX | Секции; явный save | later |
| **12** | P2 | Виджеты native | Один стиль; stale/wipe | later |
| **13** | Gate | Android dogfood Pass | APK SHA-256 + `DEVICE-DOGFOOD-15MIN` заполнен | after 1–4,8,10 |

**Ближайшая последовательность:** `0 → 1 → 2 → 3 → 10(+avg) → 8(minimal) → 13`.  
Параллельно: secret scan / OCR telemetry check (security track, мелкие PR).

---

## Пакет 1 — проверяемые правила

- Добавленное переживает force-stop / kill.  
- Удалённая запись **не** возвращается из backup.  
- Wipe очищает: repo snapshot, Garmin SecureStore (key+bearer), widget JSON, (если есть) diary backup.  
- Синхронизация, стартовавшая до wipe, **не** пишет после wipe (generation / cancel).  
- Ошибка сохранения видна пользователю.  
- Двойной тап не создаёт неожиданный дубликат (где уже есть debounce — сохранить).

---

## Пакет 3 — Food fold (вариант A)

Порядок diary: **сводка → Повторить (FoodQuickStrips) → приёмы → footer Add**.  
Пустая история: короткое first-add, не пустой блок «Повторить».

---

## Пакет 10 — Progress averages

`averageKnownKcal` / UI: дни с `entryCount === 0` **не** участвуют в среднем (даже если `energyKcal === 0`).  
Без данных: «—»; с данными: среднее + покрытие `N/7`.

---

## Device dogfood поправки (пакет 13)

1. Swipe из Recent ≠ force-stop — отдельные строки.  
2. ≤10 с: от открытия вкладки **и** от найденной кнопки — отдельно.  
3. Все 5 замеров + медиана + max.  
4. Recent на Today сейчас нет — путь через Food.  
5. APK SHA-256 + состав ветки; battery optimization — отдельная пометка.

---

## WIP вне плана

Ветка/stash `fix/dogfood-scan-widget-sleep-recipe` (streak, weight goal, pixel widgets) — **не** вливать в пакеты 1–4. Разбирать отдельными issue после gate или отложить.
