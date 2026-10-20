# ADR draft — Purchases, line items, matching (snapshot)

**Status:** Proposed · **founder approval required** before migration  
**Date:** 2026-10-21  
**Extends:** ADR-008 Food Planner · snapshot currently **v13**

## Context

We need durable, offline-first records of **confirmed purchases** that update pantry and spend without inventing nutrition/prices. Manual receipt stub only stores a single `FoodExpense`.

## Decision (proposed)

Introduce snapshot **v14** entities (names indicative):

### `purchases`

| Field | Notes |
|-------|-------|
| id, status | `cart` \| `submitted` \| `paid` \| `delivered` \| `fiscal_receipt` \| `cancelled` |
| storePreferenceId / storeLabel | nullable |
| purchasedOn | YYYY-MM-DD |
| currency | `RUB` |
| totalRub | null if incomplete |
| sourceKind | `manual` \| `paste` \| `photo` \| `screenshots` \| `qr` |
| fingerprint | hash for dedupe (normalized totals+date+store+line count) |
| rawPayloadRef | local file uri(s) — **never upload without consent** |
| parseConfidence | 0–1 null |
| confirmedAt | null until user confirms |
| expenseId | link to FoodExpense when created |
| createdAt, updatedAt, deletedAt | soft delete |

Only statuses in `{delivered, fiscal_receipt}` (and user-confirmed `paid` if opted) apply pantry + expense writes.

### `purchase_lines`

| Field | Notes |
|-------|-------|
| id, purchaseId | |
| rawName | as parsed |
| displayName | user-edited |
| quantity, unit | nullable; never fake |
| packageSizeText | nullable |
| unitPriceRub, lineTotalRub, discountRub | nullable |
| isFood | bool |
| excluded | bool |
| productId | matched canonical nullable |
| barcode / retailerSku | nullable |
| matchConfidence | null if manual |
| pantryItemId | set when applied |
| createdAt… | |

### Matching helpers (domain, not necessarily new tables)

- `canonical_products` continue as `FoodProduct`  
- `product_prices` already exists — write observations from confirmed lines  
- Separate retailer listing cache **deferred** (v15+) if licensed feeds appear  

## Consequences

- Migration v13→v14 additive; no destructive wipe  
- Receipt stub migrates conceptually to Purchase with one expense link  
- Pantry `source` expands: `user` \| `purchase`  
- Tests required before enable  

## Alternatives rejected

| Alt | Why not |
|-----|---------|
| Only FoodExpense notes | No pantry loop |
| Auto-write pantry from OCR | Violates confirm + unknown≠0 |
| Cloud-only parse | Breaks offline-first & privacy default |
| Normalized Postgres now | Out of freeze; separate sync ADR |

## Approval checklist

- [ ] Founder OK on v14 fields  
- [ ] Consent UX for any cloud OCR  
- [ ] No retailer scrape in scope  
- [ ] Dogfood plan for slice 1 attached  

**Until approved: implement nothing that bumps snapshot version.**
