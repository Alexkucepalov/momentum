# Visual screens — 2026-10-24

**Среда:** Expo web · 390×844 @2x · `BASE_URL=http://localhost:8002`  
**HEAD:** после merge #117 / #115 (Plan tab, My products, ADR-009 cut).  
**Не** physical Android Pass — для Pass: dogfood APK + device.

**Скрипт:** `scripts/capture-screens-2026-10-24.mjs`

## Каталог (39 PNG)

| Файл | Состояние |
|------|-----------|
| `01-today-empty.png` | Сегодня · пусто · CTA «Что съесть сейчас» |
| `02-food-empty.png` | Питание · пусто |
| `03-plan-hub.png` | План · хаб (вкладка) |
| `04-progress-empty.png` | Прогресс · пусто |
| `05-profile.png` | Профиль · ссылки План/Активность |
| `06-activity-hidden-tab.png` | Активность · экран без вкладки |
| `10-recipes-empty.png` | Рецепты · пусто |
| `11-recipe-form-empty.png` | Новый рецепт · форма |
| `12-recipe-import-text-empty.png` | Импорт из текста · пусто |
| `13-recipe-import-personal.png` | Архив личных рецептов |
| `20-eat-now-empty.png` | Что съесть сейчас · пусто |
| `21-my-products-empty.png` | Мои продукты · пусто |
| `22-week-empty.png` | Меню на неделю |
| `23-redirect-pantry.png` | Deep link /plan/pantry → хаб |
| `24-redirect-shop.png` | Deep link /plan/shop → хаб |
| `25-redirect-budget.png` | Deep link /plan/budget → хаб |
| `26-redirect-receipt.png` | Deep link /plan/receipt → Мои продукты |
| `27-redirect-stores.png` | Deep link /plan/stores → хаб |
| `02b-food-search-no-results.png` | Питание · каталог · поиск без результатов |
| `33-progress-sport.png` | Прогресс · Спорт → вход в Активность |
| `35-my-products-import-preview.png` | Мои продукты · предпросмотр импорта |
| `40-recipe-import-personal-ready.png` | Архив · готово к импорту |
| `41-recipes-filled.png` | Рецепты · заполненные |
| `41b-recipes-add-funnel.png` | Рецепты · воронка Добавить |
| `41c-recipes-search.png` | Рецепты · поиск |
| `42-recipe-detail.png` | Рецепт · деталь |
| `43-recipe-import-text-filled.png` | Импорт из текста · заполнено |
| `43b-recipe-import-text-editor.png` | Импорт из текста · редактор |
| `50-my-products-filled.png` | Мои продукты · после импорта |
| `51-week-composer.png` | Меню · композер / доска |
| `52-eat-now-filled.png` | Что съесть сейчас · с данными |
| `52b-eat-now-search.png` | Что съесть сейчас · поиск |
| `53-plan-hub-filled.png` | План · хаб после наполнения |
| `60-food-filled.png` | Питание · с демо |
| `60b-food-catalog.png` | Питание · каталог |
| `60d-food-search-results.png` | Питание · поиск с результатами |
| `61-today-filled.png` | Сегодня · с демо · primary Eat Now |
| `62-progress-filled.png` | Прогресс · с демо |
| `63-profile-filled.png` | Профиль · после демо |

## Как переснять

```bash
cd apps/mobile && npx expo start --web --port 8081
node scripts/capture-screens-2026-10-24.mjs
```
