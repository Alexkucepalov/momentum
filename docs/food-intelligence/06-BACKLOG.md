# Food Intelligence — prioritized backlog

**Rule:** one GitHub issue → one branch → one PR. No parallel isolated screens. Quality Freeze for unrelated work still applies.

## Slice order (must follow)

| Order | Slice | Outcome | Depends |
|------:|-------|---------|---------|
| **1** | Purchase import → editable preview → confirm → pantry + expense | Vertical proof of north star steps 2–5 | ADR-PURCHASES approved |
| **2** | Pantry ↔ Recipes ↔ Eat Now | Suggestions from real stock | Slice 1 |
| **3** | Weekly plan → shopping list (missing only) | Plan drives shop, not echo of pantry | Slice 2 |
| **4** | Budget: actual / projected / consumed | Provenance-aware totals | Slice 1 + 3 |
| **5** | Enrichment (OFF match, Open Prices observations) | Better match %, fresher prices | Consent + rate limits |
| **6** | Multi-screenshot + paste polish; QR if lawful path | Coverage | Slice 1 |

## Issue-ready candidates (draft titles)

1. **FI-1** Schema ADR approve + `purchases` / `purchase_lines` migration v14 + domain types  
2. **FI-2** Manual + paste import → PurchasePreview screen (no OCR yet)  
3. **FI-3** Confirm purchase → pantry lines + FoodExpense (dedupe fingerprint)  
4. **FI-4** Photo / screenshot OCR pipeline (on-device first; cloud only with consent)  
5. **FI-5** Product match: GTIN → name normalize → confidence UI  
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
