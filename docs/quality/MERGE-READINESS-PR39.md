# Merge-readiness — PR #39

**Дата проверки:** 2026-10-20  
**Вердикт:** **Ready to merge** после unit verify + явного контракта guard (ниже).  
**Device Pass:** нет (ожидает `DEVICE-DOGFOOD-15MIN.md`).

---

## 1. Изменённые файлы и риски регрессии

| Область | Файлы | Риск |
|---------|-------|------|
| Guard core | `src/domain/addGuard.ts`, `useAddGuard.ts`, `tests/add-guard.test.mjs` | Низкий — чистая логика |
| Diary CTA wiring | Today, Food (уже был), AddFoodSheet, CopyYesterday, TodayPlanStrip, week, barcode, recipe detail | Средний — поведение add; нужен device smoke |
| Docs / quality | `docs/quality/*`, DEV-PLAN, NAV | Нет runtime |
| Perf scripts | `scripts/perf/*`, `package.json` | Нет runtime app |
| Maestro skeleton | `maestro/food-add-smoke.yaml` | Не в CI |

**Не менялось:** snapshot schema / `version: 13`, migrations, SQLite shape, nutrition math.

---

## 2. Контракт `createAddGuard`

| Сценарий | Поведение |
|----------|-----------|
| Двойной тап &lt;500 ms | 1-й проходит, остальные `false` → нет дубля |
| Намеренно 2-й раз после ≥500 ms | Разрешено (тот же продукт снова) |
| `reset()` | Снимает lock (тесты / будущий UX) |

**Не блокирует продукт навсегда.**  
«Две порции залпом» &lt;0.5 s на одном CTA — намеренно ограничено; нормальный путь: пауза после flash или граммы ×2 в portion sheet.

**Silent on block:** повторный тап в cooldown просто `return` без второго flash — первая операция уже дала feedback. Это не silent failure первой записи.

---

## 3. CTA coverage (код)

| CTA | Guard |
|-----|-------|
| Today Recent / portion / copy yesterday | ✅ |
| Food repeat / portion | ✅ (до PR) |
| AddFoodSheet recent/search/manual/quick/saved | ✅ |
| Eat Now → diary | ✅ |
| Plan strip / week → diary | ✅ |
| Barcode / recipe detail → diary | ✅ |
| Eat Now → «В план» | n/a (не diary) |

Inventory: `docs/quality/ADD-GUARD-INVENTORY.md`.

---

## 4. Silent failures / double save

| Check | Status |
|-------|--------|
| Double save within cooldown | Blocked (unit) |
| First add still writes + flash | Code path unchanged except early return on 2nd tap |
| No invented macros | Untouched |

---

## 5. Snapshot v13 / existing data

- Нет bump version, нет normalize breaking changes в этом PR.
- Persist hook / `StoreSnapshot` shape не менялись.
- **Compatible** with existing installs on v13.

---

## 6. Что подтверждено чем

| Утверждение | Доказательство |
|-------------|----------------|
| Unit guard allow/block/re-add | `tests/add-guard.test.mjs` |
| `npm run verify` | Run before merge |
| Node serialize ~3.8 MB D10k | `perf:bench` (earlier) — **not** SQLite write time |
| No double diary on rapid tap | Unit + **needs Android §2a** |
| Intentional 2nd add | Unit after 500 ms + **needs Android §2b** |
| Kill-app durability | **Device only** — not claimed |
| ≤10 s repeat | **Device only** — not claimed |
| Maestro E2E | Skeleton only |

---

## 7. Post-merge next step

Основатель: `docs/quality/DEVICE-DOGFOOD-15MIN.md` (15–20 мин) → прислать таблицы → заполнить Device column в PERFORMANCE-BASELINE.
