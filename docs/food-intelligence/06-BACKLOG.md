# Food Intelligence — prioritized backlog

**Rule:** one GitHub issue → one branch → one PR. No parallel isolated screens. Quality Freeze for unrelated work still applies.

## Slice order (must follow)

| Order | Slice | Outcome | Status |
|------:|-------|---------|--------|
| **1** | Purchase import → preview → pantry + expense | #58 / PR #59 | **Done** |
| **2** | Pantry ↔ Recipes ↔ Eat Now coverage | #60 / PR #63 | **Done** |
| **3** | Weekly plan → shopping missing-only | #61 / #64 | **Done** |
| **4** | Budget: actual / projected shop / consumed | #62 / #64 | **Done** |
| **3b** | Shopping variants (empty / recipe / reconcile) | #69 | This PR |
| **5** | Enrichment (OFF / Open Prices) | Consent + rate limits | Deferred |
| **6** | OCR / multi-screenshot / QR | Consent + lawful path | Deferred `needs-human` |

## Issue-ready candidates (draft titles)

1. **FI-1** Schema ADR approve + `purchases` / `purchase_lines` migration v14 + domain types  
2. **FI-2** Manual + paste import → PurchasePreview screen (no OCR yet)  
3. **FI-3** Confirm purchase → pantry lines + FoodExpense (dedupe fingerprint)  
4. **FI-4** Photo / screenshot OCR pipeline (on-device first; cloud only with consent)  
5. **FI-5** Product match: GTIN → name normalize → confidence UI · **#81 purchase→catalog upsert (ship)**  
6. **FI-6** Eat Now / Recipes ranking by pantry coverage  
7. **FI-7** Plan → shopping reconcile packages  
8. **FI-8** Budget views: actual vs projected vs consumed  
9. **FI-9** Partial delivery / refund / substitution flows  
10. **FI-10** Android dogfood gates for FI metrics  

## Explicitly deferred / needs-human

- Licensed retailer APIs (Pyaterochka, Chizhik, METRO, Samokat, K&B)  
- Paid cloud AI OCR/LLM parse  
- Production secrets / Play release  
- Destructive migrations  
- Scraping authenticated storefronts  

## Success metrics (instrument later)

- Time upload → confirm  
- % lines matched without edit  
- Corrections per order  
- Time pantry → meal suggestion  
- Time plan → actionable shop list  
- Price provenance accuracy  
- Android task completion (dogfood)
