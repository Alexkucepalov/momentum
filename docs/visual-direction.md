# nf-fit — Visual Direction

Источник: 5 референсов в `design/references/` + blueprint Minimal Soft Utility.  
Цель: одно фирменное лицо, не смесь dark-bento и soft-utility по вкладкам.

## Вердикт

**Default skin = Minimal Soft Utility (светлый).**  
Из тёмных референсов берём только информационную архитектуру и геометрию карточек, не тёмный canvas как базу.

## Общее из всех референсов

| Паттерн | Берём |
|---|---|
| Bento / soft squircles | Единые карточки с большим radius, равные внутренние отступы |
| Иерархия цифр | Крупное значение → мелкий label → вторичный meta |
| Плоскость | Без glow, neumorphism, случайных градиентов, тяжёлых теней |
| Акцент | Один яркий цвет, точечно (активный день, alert, primary highlight) |
| CTA | Один доминирующий pill (чёрный или белый high-contrast), не несколько конкурирующих |
| Компактные метрики | Круги / pills для единичных показателей (виджеты, chips) |
| Навигация | Нижний tab bar, 4–5 пунктов, ясный active state |

## По файлам референсов

См. `design/references/NOTES.md` и `docs/05-DESIGN-REFERENCES.md`.

## Фирменные токены (старт)

- `canvas`: светлый нейтральный серый (cool) `#F3F4F6`
- `surface`: `#FFFFFF`
- `ink`: `#000000` / secondary cool gray
- `accent`: нейтральный ink `#111827` (без coral/red chrome)
- `radius.card`: высокий squircle (~24–28)
- `radius.pill`: stadium
- `type.label`: geometric sans, small caps / uppercase labels ok
- `type.metric`: monospace или soft numeric for крупных чисел
- `elevation`: почти flat; максимум лёгкая hairline / subtle shadow

## Запреты

Neumorphism · glow · 3D buttons · random gradients · разные радиусы без причины · dark bento как default theme · wellness pastel / mixed skins per tab.

## Home widgets

Геометрия и контраст — из Nothing-референса; данные — из Today (калории, вода, следующий приём, streak). Без выдуманных нутриентов; unknown не показывать как 0. См. ADR-010 в `docs/14-DECISIONS.md`.
