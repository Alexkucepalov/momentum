# Feasibility — OCR, OFF enrichment, retailer catalogs

**Status:** research only · **no implementation in #67** · no paid AI · no scrape  
**Extends:** `04-SOURCES.md`

## 1. OCR for Russian receipts & delivery screenshots

| Option | RU text | Privacy | Cost | Fit |
|--------|---------|---------|------|-----|
| **Paste from delivery apps** | High | Best (local) | Free | **Shipped (slice 1) — primary** |
| **ML Kit Text Recognition v2 (on-device)** | **Cyrillic not in supported scripts** (Latin/CJK/Devanagari/Japanese/Korean only, Google docs 2025–26) | On-device | Free | **Not viable for RU receipts as-is** |
| **On-device ExecuTorch OCR_RUSSIAN** (#84) | Cyrillic; quality varies on Samokat/METRO UI | On-device (+ optional model download) | Free + native size | **Shipped** — preview-edit required |
| **Tesseract-rus** | Possible alternative | On-device | Free + APK | Superseded by ExecuTorch for this slice |
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

### Product necessity (founder priority)

Dogfood и матчинг заказов **требуют** ассортимента уровня реальных витрин доставки/гипермаркета. Приоритетные источники каталога:

| Priority | Retailer | Role |
|----------|----------|------|
| P0 | **METRO** | Крупный формат, вес/фасовки |
| P0 | **Самокат** | Q-commerce заказы → paste/import |
| P0 | **Яндекс Лавка** | Q-commerce; соседний ассортимент |

**Необходимость ingest / «парсинга каталога»:** да (название, фасовка, barcode/SKU если есть, цена только с датой наблюдения).  
**Канал:** официальный API / partner feed / лицензированный дамп после BD+legal.  
**Не канал:** неавторизованный scrape HTML/app, MitM, серые дампы — даже если founder «разрешил» внутри репо.

| Retailer | Public product API for our use? | Verdict |
|----------|----------------------------------|---------|
| **METRO** | Not verified public; B2B feed possible | **P0 need** · `needs-human` BD · no scrape |
| **Самокат** | App/session typically | **P0 need** · `needs-human` BD · no scrape |
| **Яндекс Лавка** | App/session typically | **P0 need** · `needs-human` BD · no scrape |
| Пятёрочка / Чижик (X5) | Not verified public | Secondary · blocked without license |
| Красное&Белое / others | Same | Secondary · no scrape |

**Allowed without contract:** user-confirmed purchase lines (first-party), OFF/Open Prices, manual catalog.  
**After contract:** one retailer vertical at a time → local SQLite seed → match on purchase confirm.

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
2. Paste remains fallback; **on-device ExecuTorch OCR_RUSSIAN** shipped (#84) — **not** ML Kit v2 for Cyrillic.  
3. Cloud OCR only with consent + spend approve.  
4. OFF barcode enrichment with attribution.  
5. **Parallel BD (founder):** licensed catalog ingest for **METRO → Самокат → Яндекс Лавка** (P0 product necessity). Agents do not scrape; stop with `needs-human` until contract/API exists. See [`11-RETAILER-CATALOG-INGEST-ANALYSIS.md`](./11-RETAILER-CATALOG-INGEST-ANALYSIS.md) (VkusVill MCP as reference; BD templates; forbidden gray APIs).

**Hard stops unchanged:** no unauthorized scrape, no unpaid cloud AI in product, no production secret changes. Founder priority ≠ retailer authorization.
