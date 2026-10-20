# Information architecture & wireframes

## Proposed IA (progressive disclosure)

```
Питание
├─ Дневник | Каталог          (S2-2 — keep)
└─ План (hub)
    ├─ Сейчас
    │    ├─ Добавить покупку ← NEW primary rail
    │    ├─ Что съесть сейчас
    │    ├─ Запасы
    │    └─ Рецепты
    └─ Неделя и деньги
         ├─ Меню
         ├─ Покупки
         ├─ Бюджет
         └─ Магазины (settings-level)
```

**Remove as top-level prominence:** Stores as fake integration. Receipt entry lives under **Добавить покупку**, not buried in Stores.

## Wireframe A — Purchase import (before → after)

### BEFORE
Stores → «Чек вручную» → name + ₽ rows → one expense total.

### AFTER (first viewport)

```
┌─────────────────────────────┐
│ Добавить покупку            │
│ Статус: [Доставлено ▾]      │
│ Магазин: [Самокат    ▾]     │
│ Дата: 20.10.2026            │
│                             │
│ [Фото] [Скриншоты] [Текст]  │
│                             │
│ Черновик · 12 позиций       │
│ ☑ Куриное филе  0.9 кг 389₽ │
│ ☑ Творог 5%     2 шт  160₽  │
│ ☐ Пакет           1     5₽  │ ← non-food optional
│                             │
│ Итого известных: 549 ₽      │
│ [Отмена]     [Подтвердить]  │
└─────────────────────────────┘
```

Tap line → edit qty/unit/price/match product/confidence.

## Wireframe B — Eat Now after pantry fill

```
Остаток · 480 ккал · Б 35
Из запасов (3)
  Омлет с творогом · 220 г · дома 90%
  [В дневник]
Мало дома
  … · купить 1 позицию
```

## Wireframe C — Shopping

```
Нужно купить (после запасов)
  Куриная грудка · 400 г
  …
[✓] отмечено · ещё не куплено
[Записать покупку] → import flow
```

## Empty / loading / error / offline / success

| State | Purchase import | Eat Now | Shopping |
|-------|-----------------|---------|----------|
| Empty | «Добавь фото или вставь текст заказа» | CTA покупка / pantry | «Меню пусто или всё покрыто» |
| Loading | «Читаем… можно править потом» | skeleton cards | — |
| Error | Parse fail → manual table | No targets → explain | — |
| Offline | Draft saved locally; enrich later | Works if pantry local | Works |
| Success | Flash + pantry count + spend | Flash diary | Flash list |

## Acceptance (IA)

- [ ] One obvious entry «Добавить покупку» on Plan hub  
- [ ] Cart cannot confirm as delivered without explicit status  
- [ ] Confirm writes pantry + expense in one user action  
- [ ] Eat Now / Recipes show pantry coverage when data exists  
- [ ] Shopping offers purchase confirm path  
- [ ] Budget never labels user/OFF prices as live retailer  
