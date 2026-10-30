# nothing fit / nf-fit — PROJECT BLUEPRINT

Версия: 1.0  
Платформа: Android  
Технологии: Expo, React Native, TypeScript, Expo Router, SQLite  
Архитектурный принцип: offline-first, feature-oriented, domain-driven  
Статус: проектирование новой реализации  
Имя продукта: **nf-fit** (не Momentum)

Полная спецификация из kickoff (2026-10-31). Ниже — канонический blueprint; при конфликте с кодом Momentum приоритет у этого документа и ADR в `13-DECISIONS`.

---

## 1. PRODUCT IDENTITY

### 1.1. Что такое nf-fit

Персональное приложение для питания, активности, привычек и прогресса. Не медицина, не соцсеть, не перегруженный счётчик калорий.

### 1.2. Принципы

1. Повторный приём ≤10 секунд.
2. Состояние дня понятно за несколько секунд.
3. Никогда не придумывать калории/БЖУ.
4. Offline-first.
5. Экспорт, импорт, полное удаление данных.
6. Без стыда за пропуски.
7. Функции важнее количества экранов.
8. Единая визуальная система.

### 1.3. Навигация

Tabs: Today · Food · Activity · Progress · Profile  
Из экранов: Plan · Recipes · Shopping · Pantry · Budget (не вкладки).

---

## 2. REPOSITORY STRUCTURE

Целевая структура — как в kickoff (`app/`, `src/core`, `src/design-system`, `src/domain`, `src/features`, `docs/`, `design/references/`, `tests/`, `scripts/`). Файлы не создавать заранее без необходимости.

Имя пакета / Expo slug / branding: **nf-fit**.

---

## 3. MODULES (кратко)

- **Today** — статус дня, вода, активность, привычки, быстрый add food, ссылки Plan/Recipes.
- **Food** — дневник, 4 приёма, undo, copy yesterday, favorites; add flow ≤10s.
- **Activity** — тренировки; калории тренировок не вычитаются из цели автоматически.
- **Progress** — вес, streaks записей, habits, charts; absence ≠ zero.
- **Profile** — goals, export/import/delete, privacy.
- **Recipes** — CRUD, cooked yield, import; no invented nutrients.
- **Plan** — Eat Now, Week planner (DnD + button fallback), Pantry, Shopping, Budget, Stores. Plan ≠ diary.

---

## 4. DATA RULES

Stable IDs; FoodEntry nutrient snapshots; null/unknown ≠ 0; validate masses/macros; recipe via cooked yield; planned ≠ eaten; timezone-aware local dates; versioned SQLite migrations.

Entities: UserProfile, NutritionTarget, FoodProduct, FoodEntry, MealTemplate, Recipe, RecipeIngredient, RecipeSnapshot, WaterEntry, WeightEntry, Workout, Habit, HabitLog, Challenge, MealPlan, PlannedMeal, PantryItem, ShoppingList, ShoppingItem, Store, ProductPrice, BudgetEntry.

---

## 5. DESIGN — Minimal Soft Utility

Light neutral canvas, white surfaces, clear type hierarchy, restrained palette, large readable metrics, shared components. No neumorphism, glow, random gradients, mixed dark-bento + pastel skins.

Подробности и разбор референсов: [visual-direction.md](./visual-direction.md), [05-DESIGN-REFERENCES.md](./05-DESIGN-REFERENCES.md).

---

## 6. QUALITY & DoD

Offline persistence; deterministic calc; empty/loading/error/filled; design-system UI; tests; Android verification; screenshot review for UI PRs; no fake production demo metrics.

---

## 7. ROADMAP

0 Foundation → 1 Nutrition → 2 Recipes → 3 Today+Profile → 4 Activity+Progress → 5 Planner → 6 Quality+Beta (+ home widgets).

**Android home-screen widgets** — product requirement; scaffold/API research in Phase 0–1, ship useful widgets when Today metrics are real.

---

## 8. AGENT RULES

Read AGENTS.md + docs before coding; one module per PR; no duplicate components; no invented nutrition; Expo Web ≠ Android proof; stop on conflicting requirements. Agent may open/review/merge routine PRs when authorized; human gate for production Play/EAS, new permissions, health sharing, dangerous migrations.
