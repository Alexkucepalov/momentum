# Food Intelligence — Product Overhaul

**Status:** Design package for founder review · **no implementation started** · **no auto-merge**  
**Branch / PR:** docs only  
**Relation to Quality Freeze:** diary UX S2 is on `main`; device dogfood gate remains open. This package designs the **next product arc** (purchases → pantry → cook → shop → budget) without claiming Android Pass.

## North star

Купил → загрузил чек/заказ → подтвердил → запасы и траты обновились → что приготовить / съесть → план недели → список только недостающего → понятный бюджет.

Каждый шаг **переиспользует** данные предыдущего. Не семь изолированных экранов.

## Deliverables (Phase 1 + 6)

| Doc | Content |
|-----|---------|
| [00-AUDIT.md](./00-AUDIT.md) | Аудит 7 модулей as-is |
| [01-PRD.md](./01-PRD.md) | Product requirements |
| [02-JOURNEYS.md](./02-JOURNEYS.md) | End-to-end journeys |
| [03-IA-WIREFRAMES.md](./03-IA-WIREFRAMES.md) | IA + wireframes + states |
| [04-SOURCES.md](./04-SOURCES.md) | Catalog / retail source matrix |
| [05-ADR-PURCHASES.md](./05-ADR-PURCHASES.md) | ADR draft: purchases & matching (needs approval) |
| [06-BACKLOG.md](./06-BACKLOG.md) | Prioritized vertical slices |
| [07-QA-DOGFOOD.md](./07-QA-DOGFOOD.md) | QA + Android dogfood plan |
| [08-QA-INTEGRATION-REPORT.md](./08-QA-INTEGRATION-REPORT.md) | Quality Sprint report (slices 1–4) |
| [09-ANDROID-E2E-SMOKE.md](./09-ANDROID-E2E-SMOKE.md) | Device smoke — Pass only on phone |
| [10-FEASIBILITY-OCR-CATALOG.md](./10-FEASIBILITY-OCR-CATALOG.md) | OCR / OFF / retailer feasibility |

## Existing baseline (code)

Уже в snapshot **v13** / UI «План»:

- Eat Now, Pantry, Weekly plan, Shopping, Budget, Stores preferences  
- Manual receipt stub → `FoodExpense` only (не pantry lines)  
- Recipes hub + import text/archive  
- Domain: `remainingMacros`, `scoreEatNow`, `aggregateShopping`, …

См. ADR-008 в `docs/14-DECISIONS.md`, устаревшие куски в `docs/20–22` (audit snapshot там говорит «нет pantry» — **устарело**).

## First vertical slice (после approve)

**Receipt / order text or screenshot → editable purchase preview → confirmed pantry + expenses.**

Только после approve ADR + OCR/consent решений. Не семь экранов параллельно.

## Hard stops (founder)

- Paid AI / cloud OCR without consent UX  
- Scrape / reverse-engineer retailer apps  
- Destructive migration / snapshot rewrite without ADR sign-off  
- Auto-merge to `main`  
- Claiming device Pass without Android run  
