# Visual screens — 2026-10-24

**Среда:** Expo web · 390×844 @2x · http://localhost:8081  
**HEAD:** main после #117 / #115 (Plan tab, My products, ADR-009).  
**Не** physical Android Pass.

**Скрипт:** `scripts/capture-screens-2026-10-24.mjs` + досъёмка missing states.

## Каталог (51 PNG)

| Файл | Состояние |
|------|-----------|
| `01-today-empty.png` | Сегодня · пусто · CTA «Что съесть сейчас» |
| `01b-today-empty-no-onboarding.png` | Сегодня · пусто без онбординга целей |
| `02-food-empty.png` | Питание · пусто |
| `02b-food-search-no-results.png` | Питание · каталог · поиск без результатов |
| `03-plan-hub.png` | План · хаб (вкладка) |
| `04-progress-empty.png` | Прогресс · пусто |
| `05-profile.png` | Профиль · ссылки План/Активность |
| `06-activity-hidden-tab.png` | Активность · экран без вкладки |
| `10-recipes-empty.png` | Рецепты · пусто |
| `11-recipe-form-empty.png` | Новый рецепт · форма |
| `12-recipe-import-text-empty.png` | Импорт из текста · пусто |
| `13-recipe-import-personal.png` | Архив личных рецептов |
| `20-eat-now-empty.png` | Что съесть сейчас · пусто |
| `20b-eat-now-empty-filters.png` | Eat Now · фильтры |
| `21-my-products-empty.png` | Мои продукты · пусто |
| `22-week-empty.png` | Меню на неделю |
| `23-redirect-pantry.png` | Deep link /plan/pantry → хаб |
| `24-redirect-shop.png` | Deep link /plan/shop → хаб |
| `25-redirect-budget.png` | Deep link /plan/budget → хаб |
| `26-redirect-receipt.png` | Deep link /plan/receipt → Мои продукты |
| `27-redirect-stores.png` | Deep link /plan/stores → хаб |
| `30-modal-add-food.png` | Модалка · Добавить еду (Недавние) |
| `30b-modal-add-food-mine.png` | Модалка · таб Мои |
| `30d-modal-add-food-favorites.png` | Модалка · Избранное |
| `30e-modal-add-food-recipes.png` | Модалка · Рецепты |
| `31-today-cta-eat-now.png` | Сегодня · primary CTA → Eat Now |
| `33-progress-sport.png` | Прогресс · Спорт → вход в Активность |
| `34-modal-workout.png` | Модалка · тренировка |
| `35-my-products-import-preview.png` | Мои продукты · предпросмотр импорта |
| `40-recipe-import-personal-ready.png` | Архив · готово к импорту |
| `41-recipes-filled.png` | Рецепты · заполненные |
| `41b-recipes-add-funnel.png` | Рецепты · воронка Добавить |
| `41c-recipes-search.png` | Рецепты · поиск |
| `42-recipe-detail.png` | Рецепт · деталь |
| `42b-recipe-recook-modal.png` | Рецепт · Приготовить снова |
| `42c-recipe-portion-modal.png` | Рецепт · порция в дневник |
| `43-recipe-import-text-filled.png` | Импорт из текста · заполнено |
| `43b-recipe-import-text-editor.png` | Импорт из текста · редактор |
| `50-my-products-filled.png` | Мои продукты · после импорта |
| `51-week-composer.png` | Меню · композер / доска |
| `51b-week-filled.png` | Меню на неделю · после генерации |
| `52-eat-now-filled.png` | Что съесть сейчас · с данными |
| `52b-eat-now-search.png` | Что съесть сейчас · поиск |
| `53-plan-hub-filled.png` | План · хаб после наполнения |
| `60-food-filled.png` | Питание · с демо |
| `60b-food-catalog.png` | Питание · каталог |
| `60c-food-catalog-mine.png` | Каталог · попытка Мои (если чип не виден — all) |
| `60d-food-search-results.png` | Питание · поиск с результатами |
| `61-today-filled.png` | Сегодня · с демо · primary Eat Now |
| `62-progress-filled.png` | Прогресс · с демо |
| `63-profile-filled.png` | Профиль · после демо |

## Заметки для анализа

- Онбординг целей перекрывает первый кадр Today — см. `01` vs `01b`.
- Вкладка **План** (compass) вместо Активности; Активность — `06` без tab highlight.
- Deep links pantry/shop/budget/stores/receipt → редиректы `23–27`.
- Primary CTA Today: «Что съесть сейчас» (`61`, `31`).
- Таб «Мои» в AddFood: `30b`.

## Как переснять

```bash
cd apps/mobile && npx expo start --web --port 8081
node scripts/capture-screens-2026-10-24.mjs
```
