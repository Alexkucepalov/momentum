# UX — Momentum Food Planner

**Style:** Nothing-inspired — ч/б, крупная типографика, минимум декора. Раздел **План** внутри питания (не новая root tab).

## Navigation

```
Питание
  └─ План
       ├─ Что приготовить?     → Recipe Picker
       ├─ Что съесть сейчас? → Eat Now
       ├─ Меню на неделю     → Weekly Planner
       └─ Мои покупки        → Shopping (+ Бюджет later)
```

Sub-nav copy: `Рецепты · Неделя · Покупки · Бюджет`

## Screen: Eat Now («Что съесть сейчас?»)

### Header

- Title: «Что съесть вечером?» / «Что съесть сейчас?»
- Remaining strip (only known fields):
  - `# 480 ккал` (or «ккал неизвестны» if target or totals unknown)
  - `Б 35 г · Ж 15 г · У 50 г` — omit unknown macros; never show `0` for unknown

### Filters (chips, multi)

| Chip | Meaning |
|------|---------|
| Все | default |
| Дома | pantry / cooked batches / recipes with available ingredients |
| Купить | proposals that may need store items (v1: label only, no live SKUs) |
| Без готовки | prep ≤ 5 min / ready products |
| До 15 мин | cook time |
| Побольше белка | rank by protein density vs remaining |
| До N ₽ | only if user prices known |

**Rule:** exceeding daily target does **not** hide food. Show soft copy: «Остаток — ориентир, не запрет.»

### Result cards

Each card **must** show:

- Name + short reason (тип: быстрый / из холодильника / из магазина)
- Time estimate
- **Calculated** portion grams + KBJU for that portion (domain)
- Source badge: recipe / product / pantry batch
- CTA: «В дневник» (confirm grams) · secondary «В план»

Empty / partial:

- No targets set → explain how to set goals; still allow browse
- No known remaining → «Нужны цели и записи за день»
- Candidates with unknown KBJU → excluded or marked «КБЖУ неполные», not ranked as fit

## Screen: Recipe Picker («Что приготовить?»)

- Search personal recipes
- Filters: cook time, known KBJU only, pantry match %
- Portion scaler (1× / cook-for-N-days)
- Plate constructor (later sprint): protein + side + veg + sauce → recomputed KBJU

## Screen: Weekly menu

### Create sheet

- Period: 3 / 5 / 7 days
- Budget (optional, user number)
- Cook sessions / week (e.g. 2)
- Diversity: balanced / fewer dishes

CTA: «Спроектировать план» → **draft** list, not auto-save.

### Day board

Per meal slot: dish name, grams, KBJU (known only).

Actions per planned meal:

1. Replace
2. Change portion
3. Move to another day/slot
4. Log to diary (explicit) — **planned ≠ eaten**

Banner: «Запланированное не считается съеденным.»

## Screen: Shopping

- Aggregated lines: `Куриная грудка · 1,5 кг`
- Optional price: user-entered or «оценка по прошлым покупкам · дата»
- Progress: `0/6 куплено`
- Total estimate only when prices present; else «сумма неизвестна»
- Checkbox toggle; undo snackbar

## Screen: Budget (Sprint 5+)

- Monthly plan amount (user)
- Spent (purchases) vs cost of eaten (amortized) — two metrics, labeled clearly
- Forecast: honest when data sparse

## Stores (UI only until Sprint 6)

List: Пятёрочка, Чижик, Красное & Белое, METRO, Самокат, Другие — **preference tags**, not live catalogs.

Copy: «Актуальные цены появятся после разрешённых источников. Сейчас — ваши цены и чеки.»

## Accessibility

- 44pt targets, TalkBack labels on chips and remaining strip
- High contrast B/W; no color-only status
- Confirm before destructive clear plan / clear list

## Copy tone

Neutral, practical. No guilt for overshooting. No medical claims.
