# Product / price source feasibility matrix

**Rule:** do not scrape authenticated retailer apps or ToS-protected HTML without a **retailer contract / official API / licensed dump**. Prefer licensed/open + user-observed data. Founder product priority does **not** replace retailer authorization.

| Source | Availability | Auth | Legal / license | Commercial OK? | Rate limits | RU coverage | Price freshness | Store geo | IDs | Nutrition | Reliability |
|--------|--------------|------|-----------------|----------------|-------------|-------------|-----------------|-----------|-----|-----------|-------------|
| **Open Food Facts API v3** | Public | None for read; register reuse form recommended | ODbL + DbCL; images CC-BY-SA; attribution + share-alike | Yes with ODbL duties | ~15 product reads/min/IP; search ~10/min; bulk via dumps | Partial crowdsourced (`cc=ru`) | N/A (nutrition-focused) | Weak | GTIN/barcode | Variable completeness; unknown≠0 | High infra; data quality variable |
| **OFF nightly dumps** | Public | None | Same ODbL | Yes | Prefer dumps over crawl | Same | Snapshot daily | — | GTIN | Same | Best for offline catalog seed **now** |
| **Open Prices** | Public API + HF Parquet dumps | Bearer for some writes; reads often open | ODbL family (OFF ecosystem) | Yes with attribution | Prefer **Parquet dump** over paginated crawl | Growing; not RU-complete | Observation-dated | OSM shop when present | barcode / category | Via OFF link | Good for **observations**, not “shelf now” |
| **User purchases / receipts** | First-party | Local | User owns; privacy critical | Yes | Local | Exact for that user | As-of purchase date | From user/store tag | SKU/barcode if parsed | From match | **Highest trust for that household** |
| **METRO** | **No verified public product API** | App/session or B2B | ToS; scrape unauthorized without deal | Only with contract | Per deal | Strong hypermarket | Live in-app | Yes | Private SKUs | Rarely OFF-grade | **Product-critical · needs-human BD** |
| **Самокат** | **No verified public product API** | App/session | ToS; scrape unauthorized without deal | Only with contract | Per deal | Strong q-commerce RU | Live in-app | Yes | Private SKUs | Rarely OFF-grade | **Product-critical · needs-human BD** |
| **Яндекс Лавка** | **No verified public product API** | App/session | ToS; scrape unauthorized without deal | Only with contract | Per deal | Strong q-commerce RU | Live in-app | Yes | Private SKUs | Rarely OFF-grade | **Product-critical · needs-human BD** |
| **Пятёрочка / Чижик / others** | Same class | App/session | ToS | Only with contract | N/A | Strong | Live | Yes | Private | Rare | Secondary to METRO / Самокат / Лавка |
| **Official partner feeds** | BD | Contract | License TBD | Only with contract | Per deal | Per deal | Per SLA | Per deal | Per deal | Per deal | **Target channel** for the three stores above |

---

## Product necessity — retailer assortments (founder priority)

Для dogfood и повседневного сценария «заказ → запасы → Eat Now / покупки» **нужен** каталог, сопоставимый с реальным ассортиментом доставки/гипермаркета, а не только ручной `commonFoodCatalog`.

| Priority | Retailer | Why |
|----------|----------|-----|
| P0 | **METRO** | Крупные фасовки, B2B-подобные позиции, вес/кг |
| P0 | **Самокат** | Типичный q-commerce чек; имена/SKU из заказов |
| P0 | **Яндекс Лавка** | Тот же класс доставок; пересечение SKU с Самокатом частичное |

**Необходимость получения данных (ingest / «парсинг каталога» в продуктовом смысле):**  
да — синхронизация ассортимента и идентификаторов (название, фасовка, barcode/SKU при наличии, опционально цена с датой) с этих трёх источников.

**Допустимый способ:** только после разрешения ритейлера:

1. Официальный product / catalog API, или  
2. B2B / partner feed (CSV/JSON/SFTP), или  
3. Лицензированный дамп ассортимента.

**Запрещено агентам и CI без контракта:** HTML scrape витрин, MitM приложений, неофициальные «API» с GitHub, серые дампы.

Пока контракта нет: статус **`needs-human` (BD + legal)**. Реализация ingest в коде **не начинается**. Параллельно — OFF RU dump + first-party purchase lines.

---

## Recommendations

1. **Сейчас (без контракта):** OFF dump subset (RU-biased) + on-demand barcode; attribute OFF; purchase paste → catalog/pantry.  
2. **Цены:** user receipt lines + Open Prices as «наблюдение · дата», never «цена сейчас».  
3. **METRO / Самокат / Лавка:** founder opens BD; document access in ADR when signed; then one vertical: authorized ingest → local SQLite seed → match on purchase import. Полный разбор каналов (и эталон **ВкусВилл MCP**): [`11-RETAILER-CATALOG-INGEST-ANALYSIS.md`](./11-RETAILER-CATALOG-INGEST-ANALYSIS.md).  
4. **Matching:** GTIN → OFF/local; else name+brand+size + confidence; user confirm below threshold.  
5. **Agents:** do not implement retailer scrape; stop and label `needs-human` if asked.

## OCR / text extraction (purchase import)

| Approach | Feasibility RU | Privacy | Cost | Verdict |
|----------|----------------|---------|------|---------|
| On-device ML Kit Text Recognition v2 | **Cyrillic not supported** | Best | Free | **Not viable for RU** — see `10-FEASIBILITY-OCR-CATALOG.md` |
| On-device Tesseract-rus / similar | Spike required | Best | Free + APK size | Candidate after dogfood |
| Paste text from delivery apps | High | Best | Free | **Ship in slice 1** — primary bridge until retailer feeds exist |
| Cloud Vision / LLM parse | Higher accuracy possible | Consent + no raw receipts in telemetry | Paid | Optional; founder approval |
| Fiscal QR (ФНС) | Needs lawful path | Sensitive | TBD | Research only |

## Explicit non-sources (until licensed)

- Unofficial “X5 / Samokat / Lavka / METRO API” GitHub scrapers  
- MitM of retailer apps  
- Purchased gray-market product dumps without license  
- Rewriting this file to claim “founder said OK” = scrape authorization — **invalid**; retailer must authorize
