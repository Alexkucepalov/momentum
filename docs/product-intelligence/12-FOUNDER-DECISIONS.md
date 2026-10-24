# Founder Decisions Required

**HEAD:** `1da2d0ac`  
These items **must not** be decided by agents alone (AGENTS.md + product risk).

---

## D1 — Product focus vs surface area

**Question:** For next 4–8 weeks, is Momentum primarily (A) fastest honest food diary, (B) full FI planner suite, or (C) balanced dogfood of both?  
**Why founder:** Determines hide/defer of Plan hub depth, Challenges, Stores.  
**Inputs:** `09-PRODUCT-GAPS.md`, Visual Audit density.

---

## D2 — Information architecture change

**Question:** Approve unifying Today/Food log paths and/or demoting Plan hub / Stores?  
**Why:** Navigation rewrite affects all dogfood muscle memory.  
**Inputs:** `03-INFORMATION-ARCHITECTURE.md`, PI-UX-01/02/08.

---

## D3 — Retail catalogs & pricing

**Question:** Pursue business-development for METRO/Samokat/Lavka (or other) official data, keep seed+purchase-only, or drop Stores entirely?  
**Why:** Legal/ToS, credentials, scrape ban.  
**Inputs:** FI retailer docs, PI-EXT-01.

---

## D4 — OCR positioning

**Question:** Market on-device screenshot OCR as core moat, keep experimental, or invest in accuracy eval budget?  
**Why:** APK size (~OCR models), first-run download, user trust.  
**Inputs:** #84/#85, PI-ARCH-05, PI-MISS-04.

---

## D5 — Analytics / crash reporting

**Question:** Allow any off-device telemetry? If yes, what red lines?  
**Default recommendation:** local-only until explicit yes (`10-ANALYTICS-STRATEGY.md`).

---

## D6 — Schema / persistence migration

**Question:** Approve research spike or implementation to leave full-snapshot JSON for relational/incremental persist?  
**Why:** Destructive migration risk; data loss.  
**Inputs:** PI-ARCH-01, #36 results first.

---

## D7 — Production release

**Question:** When to Play/EAS production?  
**Gate:** Android dogfood Pass #36–#38 + Visual Audit A + privacy checklist.  
**Agents must not** ship production.

---

## D8 — Automation / Dispatcher

**Question:** Enable autonomous issue queue / auto-merge?  
**Current:** `DISPATCH_ENABLED=false`. Keep off until quality gates green.

---

## D9 — Challenges & secondary fitness

**Question:** Keep, hide, or remove Challenges / expand activity?  
**Why:** Tone (no shame) + attention budget.

---

## D10 — Budget honesty bar

**Question:** Is “incomplete prices” acceptable with explicit UI, or hide budget until priced coverage threshold?  
**Inputs:** PI-UX-06, PI-DATA-02.

---

## Decision log (fill in workshops)

| ID | Decision | Date | Notes |
|----|----------|------|-------|
| D1 | | | |
| D2 | | | |
| … | | | |
