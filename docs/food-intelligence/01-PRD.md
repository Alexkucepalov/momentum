# PRD — Food Intelligence (connected purchases → cook → budget)

**Status:** Draft · founder approval required before schema / OCR / paid APIs  
**Supersedes (partially):** aspirational parts of `docs/20-FOOD-PLANNER-PRD.md` while keeping ADR-008 principles.

## Problem

Модули Плана уже существуют, но **покупка не питает запасы**, а запасы слабо питают рекомендации. Пользователь ведёт дневник, но снова вручную набивает холодильник и бюджет.

## Goals

| ID | Goal | Measure (dogfood) |
|----|------|-------------------|
| FI-G1 | Подтверждённая покупка → строки в pantry + расход | ≤3 мин от загрузки до confirm (после парсера) |
| FI-G2 | Match продуктов с confidence; правки руками | % auto-match ≥X; corrections / order tracked |
| FI-G3 | Eat Now / Recipes учитывают pantry coverage | Время до полезного блюда ≤30 с при непустом pantry |
| FI-G4 | Shopping только needToBuy | Список actionable; checkoff → offer purchase |
| FI-G5 | Budget: actual vs projected vs eaten (labeled) | Нет stale «live» цен |

## Non-goals (v1 connected slice)

- Live retailer SKU APIs without license  
- Scraping Samokat / X5 / etc.  
- Auto-log planned meals  
- Cloud AI OCR without explicit consent screen  
- Fabricated nutrition or prices  
- Treating cart/wishlist as purchased  

## Principles (inherit + extend ADR-008)

1. Offline-first SQLite; enrich online optionally.  
2. `unknown ≠ 0`; nullable everywhere missing.  
3. Deterministic domain for qty / cost / nutrition math.  
4. **Draft → user confirm** for purchases and AI suggestions.  
5. **Purchase state machine** (cart → submitted → paid → delivered → fiscal) — only confirmed stages write pantry/spend.  
6. Canonical product ≠ retailer listing ≠ price observation.  
7. Nutrition entry snapshots unchanged.

## Personas / jobs

- После доставки: «занести заказ в приложение без 40 ручных строк»  
- Вечер: «из того что привезли — что съесть под белок»  
- Выходные: «меню + добор в магазин только дыр»  
- Конец месяца: «сколько реально ушло на еду»

## Success for first vertical slice

- [ ] Import: paste text **or** image → structured draft lines  
- [ ] Editable preview (exclude non-food, fix qty/price)  
- [ ] Confirm → pantry deltas + expense (+ optional price observations)  
- [ ] Dedupe same receipt fingerprint  
- [ ] Offline review of draft; enrichment deferred  
- [ ] Tests: ambiguity, duplicates, partial, unknown nutrition  
- [ ] Android dogfood script for this slice only  

## Risks

| Risk | Mitigation |
|------|------------|
| OCR quality RU receipts | On-device first; consent for cloud; always editable |
| Legal retailer data | Sources matrix; no scrape; OFF/Open Prices + user history |
| Snapshot size growth | Purchase entities lean; ADR migration; soft-delete |
| Scope explosion | One vertical slice; serial PRs |
| Quality Freeze conflict | Diary dogfood stays open; FI ships after approve, not as fake “quality done” |

## Related

- Audit: `00-AUDIT.md` · Journeys: `02-JOURNEYS.md` · ADR: `05-ADR-PURCHASES.md`  
