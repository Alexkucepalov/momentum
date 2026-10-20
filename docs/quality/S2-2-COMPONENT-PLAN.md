# S2-2 — План изменений (Food only)

**Approve IA:** сегменты Дневник | Каталог · default Дневник · одна date-nav · поиск в Каталоге.

## Компоненты

| Компонент | Изменение |
|-----------|-----------|
| `FoodSegmentTabs.tsx` | Новый tablist Дневник / Каталог |
| `food.tsx` | Взаимоисключающие виды; DateSwitcher; без WeekNutritionStrip |
| `TodayPlanStrip` | Только в Дневнике (не конкурирует с каталогом) |
| Search / `FoodCatalogList` | Только сегмент Каталог |

## Не трогаем

AddFoodSheet tabs · snapshot v13 · Today (S2-1) · Dispatcher

## Регрессии

- Sticky Add + barcode  
- MealSection edit/delete/repeat/save  
- Portion confirm из каталога  
- dateLocal при смене сегмента  
- Copy yesterday  
