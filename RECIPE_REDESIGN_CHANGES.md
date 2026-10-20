# Recipe Section Visual Polish — Issue #4

## Изменения

### 1. RecipeHubActions (`src/features/recipes/RecipeHubActions.tsx`)
- Увеличены размеры карточек и иконок для лучшей визуальной иерархии
- Добавлены тени для глубины
- Улучшен spacing между элементами
- Обновлён pressed state с трансформацией

### 2. Recipes Index (`app/recipes/index.tsx`)
- **Hub Card**: добавлена иконка в header, улучшена структура с flex-layout
- **Hub Card**: добавлены тени для визуального выделения
- **Recipe Cards**: увеличены размеры (thumbnail 84x84, padding увеличен)
- **Recipe Cards**: улучшен spacing между элементами (gap, margins)
- **Recipe Cards**: добавлены тени для глубины
- **Empty States**: увеличены иконки и улучшен typography
- Все кнопки и поля сохранили accessibility labels

### 3. Import Text (`app/recipes/import-text.tsx`)
- Steps теперь в отдельной карточке с фоном
- Увеличены размеры шагов и улучшена типографика
- Увеличен минимальный размер input до 240px
- Добавлены тени для всех карточек
- Улучшен spacing и line-height для лучшей читаемости

### 4. Import Personal (`app/recipes/import-personal.tsx`)
- Hero section: увеличены размеры и padding
- Toolbar card: улучшен spacing и добавлены тени
- Recipe cards: увеличен padding и spacing
- Empty state: увеличены иконки и улучшена типографика
- Улучшена визуализация выбранных карточек (border 2px)

## Сохранённая функциональность
- Вся доменная логика питания не изменена
- Offline-сохранение работает как прежде
- Парсер рецептов не изменён
- Все accessibility labels сохранены и проверены
- Не добавлены новые выдуманные КБЖУ значения

## Empty States
Все empty states проверены на отсутствие shame-copy:
- "Ничего не найдено" — нейтрально
- "Пока нет рецептов" — позитивно, без давления
- "В этом фильтре пусто" — нейтрально
- Все тексты информативные и помогающие

## Accessibility
Все интерактивные элементы имеют:
- accessibilityRole (button, tab, checkbox, summary)
- accessibilityLabel с понятным описанием
- accessibilityState где применимо (selected, checked, disabled)
- Минимальные touchMin размеры (48dp)

## Тестирование
- `npm run verify` — ✅ зелёный
- TypeScript typecheck — ✅ без ошибок
- Все существующие тесты проходят
