# Product / price source feasibility matrix

**Rule:** do not scrape authenticated retailer apps or ToS-protected HTML. Prefer licensed/open + user-observed data.

| Source | Availability | Auth | Legal / license | Commercial OK? | Rate limits | RU coverage | Price freshness | Store geo | IDs | Nutrition | Reliability |
|--------|--------------|------|-----------------|----------------|-------------|-------------|-----------------|-----------|-----|-----------|-------------|
| **Open Food Facts API v3** | Public | None for read; register reuse form recommended | ODbL + DbCL; images CC-BY-SA; attribution + share-alike | Yes with ODbL duties | ~15 product reads/min/IP; search ~10/min; bulk via dumps | Partial crowdsourced (`cc=ru`) | N/A (nutrition-focused) | Weak | GTIN/barcode | Variable completeness; unknown≠0 | High infra; data quality variable |
| **OFF nightly dumps** | Public | None | Same ODbL | Yes | Prefer dumps over crawl | Same | Snapshot daily | — | GTIN | Same | Best for offline catalog seed |
| **Open Prices** | Public API + HF Parquet dumps | Bearer for some writes; reads often open | ODbL family (OFF ecosystem) | Yes with attribution | Prefer **Parquet dump** over paginated crawl | Growing; not RU-complete | Observation-dated | OSM shop when present | barcode / category | Via OFF link | Good for **observations**, not “shelf now” |
| **User purchases / receipts** | First-party | Local | User owns; privacy critical | Yes | Local | Exact for that user | As-of purchase date | From user/store tag | SKU/barcode if parsed | From match | **Highest trust for that household** |
| **Pyaterochka / Chizhik / METRO / Samokat / Krasnoe&Beloe** | **No verified public product API for our use** | Typically app/session | ToS; scraping unauthorized | **Do not assume** | N/A | Strong in RU apps | Live in-app | Yes in-app | Private SKUs | Rarely full OFF-grade | Unreliable / legal risk if scraped |
| **Official partner feeds** | Unknown / BD | Contract | License TBD | Only with contract | Per deal | Per deal | Per SLA | Per deal | Per deal | Per deal | **needs-human** BD |

## Recommendations

1. **v1 catalog enrichment:** OFF dump subset (RU-biased) + on-demand v3 barcode lookup; cache on device; attribute OFF in UI.  
2. **v1 prices:** user receipt lines + optional Open Prices observations labeled «наблюдение · дата», never «цена в магазине сейчас».  
3. **Retailer live catalogs:** blocked until founder secures licensed access — document as `needs-human`.  
4. **Matching:** GTIN → OFF/local product; else normalized name+brand+size with confidence; user confirm below threshold.

## OCR / text extraction (purchase import)

| Approach | Feasibility RU | Privacy | Cost | Verdict |
|----------|----------------|---------|------|---------|
| On-device ML Kit / Apple Vision / similar | Moderate for clear screenshots; weaker for crumpled fiscal receipts | Best | Free/device | **Prefer for screenshots** |
| Paste text from delivery apps | High | Best | Free | **Ship in slice 1** |
| Cloud Vision / LLM parse | Higher accuracy possible | Requires **consent** + no logs of raw receipts in our telemetry | Paid | Optional fallback behind consent; founder approval for spend |
| Fiscal QR (ФНС) | Needs lawful verification path | Sensitive | TBD | Research only; no fake “verified” badge |

## Explicit non-sources

- Unofficial “X5 API” GitHub scrapers  
- MitM of retailer apps  
- Purchased gray-market product dumps without license  
