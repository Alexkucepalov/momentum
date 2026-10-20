# Feasibility — OCR, OFF enrichment, retailer catalogs

**Status:** research only · **no implementation in #67** · no paid AI · no scrape  
**Extends:** `04-SOURCES.md`

## 1. OCR for Russian receipts & delivery screenshots

| Option | RU text | Privacy | Cost | Fit |
|--------|---------|---------|------|-----|
| **Paste from delivery apps** | High | Best (local) | Free | **Shipped (slice 1) — primary** |
| **ML Kit Text Recognition v2 (on-device)** | **Cyrillic not in supported scripts** (Latin/CJK/Devanagari/Japanese/Korean only, Google docs 2025–26) | On-device | Free | **Not viable for RU receipts as-is** |
| **On-device Tesseract / similar with `rus` model** | Possible; quality varies; APK size ↑ | On-device | Free / eng | Candidate after dogfood; spike required |
| **Apple Vision (iOS later)** | Check Cyrillic support before committing | On-device | Free | Spike when iOS |
| **Cloud Vision / LLM structure** | Higher on messy RU receipts | **Consent required**; no raw receipt in telemetry | Paid | Founder approval only |
| **ФНС fiscal QR** | Verification ≠ product OCR | Highly sensitive | TBD legal | Research; no fake badge |

**Implication:** do **not** plan “ML Kit on-device” as the RU OCR answer. Prefer paste + parser; spike Tesseract-rus or consented cloud only after Android dogfood Pass.

**Pipeline if OCR approved:** OCR text → existing `parsePurchasePaste` → preview → confirm.  
**Do not** upload images without consent UI + privacy copy.

**Risks:** Cyrillic OCR errors; multi-screenshot stitching; Samokat table layouts; ML Kit false hope for RU.

## 2. Open Food Facts enrichment

| Item | Detail |
|------|--------|
| API | v3 product + search; rate limits (~15 reads/min/IP; prefer dumps) |
| License | ODbL — attribution + share-alike on DB extracts |
| RU coverage | Partial crowdsource; barcode better than name |
| Nutrition | Variable; **unknown ≠ 0** |
| Recommendation | Offline seed from RU-biased dump + on-demand barcode cache; UI attribution «Open Food Facts» |

**Not:** invent macros when OFF incomplete.

## 3. Open Prices

Observation-dated prices only. Label «наблюдение · дата», never live shelf. Prefer Parquet dumps over crawl.

## 4. Russian retailer catalogs

| Retailer | Public product API for our use? | Verdict |
|----------|----------------------------------|---------|
| Пятёрочка / Чижик (X5) | Not verified public | **Blocked** without license |
| METRO | B2B feeds possible via partnership | `needs-human` BD |
| Самокат | App/session typically | No scrape |
| Красное&Белое / others | Same | No scrape |

**Allowed without contract:** user-confirmed purchase lines (first-party), OFF/Open Prices, manual catalog.

## 5. Privacy & consent

| Data | Rule |
|------|------|
| Receipt images / paste | Local by default; never in logs/fixtures |
| Cloud OCR | Opt-in consent; purpose «разбор чека»; retention policy; kill-switch |
| Analytics | Aggregate only; no raw line items |

## 6. Cost / limits (order of magnitude)

| Path | CapEx / OpEx |
|------|----------------|
| Paste + parser | Already paid (eng time) |
| On-device OCR | Eng + APK size; $0 inference |
| OFF dumps | Storage + refresh job; $0 API |
| Cloud OCR/LLM | Per-image $; needs budget approve |
| Retailer feed | Contract + integration |

## 7. Recommended sequence (after Android dogfood Pass)

1. Close UX/import defects from dogfood notes.  
2. Keep paste-first; spike **Tesseract-rus** (or equivalent) on-device — **not** ML Kit v2 for Cyrillic.  
3. Cloud OCR only with consent + spend approve.  
4. OFF barcode enrichment with attribution.  
5. BD for licensed retailer feeds — parallel, not blocking.

**Hard stops unchanged:** no scrape, no unpaid cloud AI in product, no production secret changes.
