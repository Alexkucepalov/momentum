# Конкурентный разбор → пробелы Momentum (2026-10-17)

Гипотезы по публичным обзорам/help-центрам MFP, FatSecret, Yazio, Lifesum, Cronometer, Lose It — не измеренная доля рынка. Цель: выбрать **удобные** фичи под north-star ≤10 с и offline-first, без стыда и без AI-угадываний.

## Что уже закрыто у Momentum

| Фича конкурентов | У нас |
|---|---|
| Дневник 4 приёма + macros | ✅ |
| Recent / favorites | ✅ |
| Recipes + cooked yield | ✅ (сильнее среднего) |
| Copy yesterday / repeat meal | ✅ |
| Barcode + OFF | ✅ |
| Water / weight / BMI | ✅ |
| Manual daily КБЖУ targets | ✅ |
| Flexible habits (не streak) | ✅ |
| Offline + export/delete | ✅ (дифференциатор) |

## Где конкуренты быстрее / удобнее

| Gap | Кто делает хорошо | Почему больно без этого | Приоритет dogfood |
|---|---|---|---|
| **Saved meals** (именной набор позиций → 1 тап) | MFP My Meals, FatSecret Saved Meals | Повтор «яйца+тост+кофе» сейчас = 3 действия или только вчера целиком | **P0** |
| **Quick Add** (ккал/КБЖУ без карточки продукта) | MFP Quick Add | Кафе / «съел что-то» без этикетки тормозит лог | **P0** |
| **Неделя ккал vs цель** | MFP / Yazio week views | Сегодня видно хорошо, неделя — нет | **P0** |
| Copy from arbitrary date | MFP / FatSecret Premium | Есть только «вчера» | P1 |
| Most eaten (частотность) | FatSecret | Recent ≠ частота | P1 |
| Micronutrients | Cronometer | Вне scope v0.1 | P2 |
| AI photo / voice | все Premium | Запрет silent AI; после dogfood gate | P2 |
| Meal plans / fasting | Yazio / Lifesum | Не наше позиционирование | out |

## Решение на этот спринт

1. Сохранённые приёмы — сохранить текущий слот → логировать целиком.
2. Быстрый ввод — ккал (± БЖУ) без продукта.
3. Недельный обзор — 7 дней еды vs личная цель (нейтрально, без «провала»).

Не делаем сейчас: уведомления, Health Connect, AI-скан, микронутриенты.
