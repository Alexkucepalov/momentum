# End-to-end journeys

## J1 — Delivery → pantry (primary slice)

```
Buy groceries (external)
  → Open Momentum → План → «Добавить покупку»
  → Choose input: photo | screenshots×N | paste text | (later QR)
  → Parse draft (local / optional cloud with consent)
  → Preview: store, date, lines (name, qty, unit, price, food?)
  → User edits / excludes / marks non-food
  → Confirm status: paid | delivered | fiscal_receipt
  → System writes: Purchase + lines, PantryItem deltas, FoodExpense,
                   ProductPrice observations (dated), match links
  → Success: «N позиций в запасах · M ₽»
  → Soft CTA: «Что съесть сейчас?» / «К рецептам»
```

**Failure paths:** low OCR confidence → manual lines; duplicate fingerprint → block with link to existing; offline → keep draft locally.

## J2 — Pantry → Eat Now

```
Pantry has items
  → Eat Now
  → Rank by coverage + remaining macros
  → Show available / missing badges
  → Confirm portion → diary (planned≠needed)
```

Empty pantry: honest empty + CTA «Добавить покупку» / manual pantry.

## J3 — Week → Shopping → Purchase

```
Create/activate week plan from recipes
  → Generate shopping (needToBuy after pantry cover)
  → Shop externally
  → Check items optional
  → «Записать покупку» → J1 with list context
  → Pantry updates close the loop
```

## J4 — Budget honesty

```
Confirmed purchases → actual spend (sum expenses / purchase totals)
Open shopping with prices → projected cost (known prices only)
Diary + purchase amortize (later) → estimated eaten cost
UI always labels source + as-of date
```

## J5 — Recipe discovery (unchanged north-star)

≤3 taps per `RECIPE-DISCOVERY-MAP.md`; pantry rank is additive.

## State glossary (purchase)

| State | Pantry write? | Expense write? |
|-------|---------------|----------------|
| cart / wishlist | No | No |
| submitted_order | No (optional draft) | No |
| paid | Optional hold | Optional |
| delivered | **Yes** (default confirm) | **Yes** |
| fiscal_receipt | **Yes** | **Yes** |
| refunded / partial | Adjust deltas | Adjust / negative line |

Never auto-promote cart → delivered.
