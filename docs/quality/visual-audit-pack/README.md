# Visual Audit Pack

**Среда:** Expo web · viewport 390×844 @2x.  
**Не** physical Android Pass — для Pass: `android-device/` + dogfood APK.

**Индекс:** [../VISUAL-AUDIT-PACK.md](../VISUAL-AUDIT-PACK.md)  
**Скрипт:** `scripts/capture-visual-audit-pack.mjs`  
**Синтетика:** демо 2 недели + `docs/fixtures/synthetic-purchases.json`.

## Каталог (47 PNG)

| Файл | Состояние |
|------|-----------|
| `01-today-empty.png` | Сегодня · empty |
| `02-food-empty.png` | Питание · empty |
| `02b-food-search-no-results.png` | Питание · каталог · поиск без результатов |
| `03-activity-empty.png` | Активность · empty |
| `04-progress-empty.png` | Прогресс · empty |
| `05-profile.png` | Профиль |
| `10-recipes-empty.png` | Рецепты · empty |
| `11-recipe-form-empty.png` | Форма нового рецепта |
| `12-recipe-import-text-empty.png` | Импорт из текста · empty |
| `13-recipe-import-personal.png` | Архив личных рецептов |
| `13b-recipe-import-personal-ready.png` | Архив · к импорту |
| `20-plan-hub.png` | План · хаб |
| `21-eat-now-empty.png` | Eat Now · empty |
| `22-pantry-empty.png` | Запасы · empty + форма |
| `23-week-menu-empty.png` | Меню · композер |
| `24-shop-empty.png` | Покупки · empty |
| `25-budget-empty.png` | Бюджет · empty + формы |
| `26-stores.png` | Магазины |
| `27-purchase-import-empty.png` | Импорт покупки · paste |
| `27b-purchase-manual-form.png` | Импорт покупки · вручную |
| `30-modal-add-food.png` | Модалка · Добавить еду |
| `30b-modal-add-food-quick.png` | Модалка · быстрый ввод |
| `31-modal-habit-composer.png` | Модалка · привычка |
| `31b-modal-challenge-composer.png` | Модалка · челлендж |
| `32-modal-workout.png` | Модалка · тренировка |
| `40-recipes-filled.png` | Рецепты · filled |
| `40b-recipes-search.png` | Рецепты · поиск |
| `41-recipe-detail.png` | Рецепт · деталь |
| `41b-recipe-recook-modal.png` | Рецепт · Приготовить снова |
| `41c-recipe-portion-modal.png` | Рецепт · порция в дневник |
| `42-recipe-form.png` | Форма рецепта |
| `43-recipe-import-text-filled.png` | Импорт текста · filled |
| `43b-recipe-import-text-preview.png` | Импорт текста → редактор |
| `50-purchase-paste-filled.png` | Импорт покупки · paste filled |
| `51-purchase-preview.png` | Импорт покупки · превью |
| `52-pantry-after-purchase.png` | Запасы · после покупки |
| `52b-pantry-add-form-filled.png` | Запасы · форма filled |
| `52c-pantry-filled.png` | Запасы · filled |
| `53-week-composer.png` | Меню · композер |
| `54-week-menu-filled.png` | Меню · filled |
| `55-shop-filled.png` | Покупки · filled |
| `56-budget-filled.png` | Бюджет · filled |
| `57-eat-now-filled.png` | Eat Now · filled |
| `58-plan-hub-after.png` | План · хаб после наполнения |
| `60-food-filled.png` | Питание · filled |
| `60b-food-search-results.png` | Питание · поиск с результатами |
| `61-today-filled.png` | Сегодня · filled |

## Пересъёмка

```bash
cd apps/mobile && npx expo start --web --port 8081
node scripts/capture-visual-audit-pack.mjs
```
