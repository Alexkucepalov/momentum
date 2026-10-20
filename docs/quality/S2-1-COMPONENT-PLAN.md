# S2-1 — План изменений компонентов (Today only)

**Approve:** meal chips off fold · empty plan = text link · hierarchy KBJU → Add → Recent.

## Компоненты

| Компонент | Изменение |
|-----------|-----------|
| `app/(tabs)/index.tsx` | Новый порядок зон; без JourneyShortcuts chips; plan ниже Recent |
| `AddFoodBlock.tsx` | `showMealChips={false}` на Today; фокус на «Недавно» + copy yesterday secondary |
| `TodayPlanStrip.tsx` | Empty → одна text-link; filled без изменения логики |
| `JourneyShortcuts` | Не использовать на Today fold; опционально text-links локально |
| `DataContext` / domain | `mealSlotForNow()` — default meal по часу; chips остаются в AddFoodSheet |
| `KcalRing` | Без смены API; остаётся compact status |

## Не трогаем (S2-2+)

`food.tsx`, AddFoodSheet структура tabs, plan hub, snapshot v13, repo.

## Регрессии проверить

- Footer «Добавить еду» + barcode  
- Recent one-tap + guard  
- Copy yesterday  
- Favorites → portion sheet  
- Habits / water ниже fold  
- Meal в sheet всё ещё меняется вручную  
