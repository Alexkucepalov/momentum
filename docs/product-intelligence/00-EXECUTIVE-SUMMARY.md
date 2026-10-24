# Momentum — Executive Summary (Product Intelligence)

| Field | Value |
|-------|--------|
| **Audit date (UTC)** | 2026-10-24T07:57:39Z |
| **HEAD `main`** | `1da2d0acb3c15bf68a9d009d19758d68406ce979` |
| **HEAD message** | Merge PR #88 chore(apk) dogfood APK meta |
| **Snapshot schema** | **v14** (`StoreSnapshot.version`) |
| **Evidence class** | Code + unit tests + Expo web Visual Audit Pack (47 PNG) |
| **Android device Pass** | **Not claimed** — issues #36–#38 open |

**Label legend used across this pack:** FACT · OBSERVED · HYPOTHESIS · UNVERIFIED · PROPOSED

---

## What Momentum is (FACT)

Offline-first **nutrition / habits / fitness** companion for Android (Expo RN). North-star: **repeat food log ≤10s**, privacy-local data, no shame copy, **unknown ≠ 0**, **planned ≠ eaten**. No backend for the vertical slice. Source of truth for rules: `AGENTS.md`, `docs/01-PRD.md`.

Persistence: in-memory domain repository + **full JSON snapshot** in SQLite (`apps/mobile/src/storage/expoFoodStore.native.ts` → table `store_snapshot`).

---

## Strengths (FACT / OBSERVED)

1. **Deep food planner stack shipped** — pantry, Eat Now scorer, week plans, shopping reconcile, purchase import→catalog, budget views (issues/PRs #13–#19, #58–#64, #69/#83, #81/#82).
2. **Strong domain purity** — nutrition/Eat Now/purchase parse covered by large Node test suite (`tests/*.mjs`, `npm run verify`).
3. **Honest product constraints documented** — no scrape retailers, no invent macros, OCR cloud deferred (`docs/food-intelligence/04-SOURCES.md`, #84 on-device OCR only).
4. **Quality freeze awareness** — Visual Audit Pack + status reports exist; Android gates explicitly open.
5. **Dogfood APK pipeline** — local release APK + meta (`docs/quality/apk/DOGFOOD-APK.md`, ~220MB including ExecuTorch OCR).

---

## Weaknesses (FACT / OBSERVED / HYPOTHESIS)

1. **IA overload** — Today vs Food overlap; Plan hub is a second “app”; Stores is a thin tag screen. OBSERVED in pack + hub code (`apps/mobile/app/plan/index.tsx`).
2. **Unverified on real Android** — kill-app, ≤10s repeat, Maestro smoke not Pass (#36–#38). FACT: protocols exist, measurements empty (`PERFORMANCE-BASELINE.md`).
3. **Full-snapshot persist** — every mutation serializes entire v14 graph. Node D10k ~3.8MB / tens of ms; device UI impact HYPOTHESIS.
4. **Retail catalogs blocked** — METRO/Samokat/Lavka need BD; seed catalog (~198) + purchase upsert only. FACT: `storeCatalogAdapter` throws; `11-RETAILER-CATALOG-INGEST-ANALYSIS.md`.
5. **OCR quality unverified on device** — shipped ExecuTorch RU (#84/#85) but web stub; real Samokat/METRO accuracy UNVERIFIED.
6. **God-object repository** — `foodRepository.ts` ~3.3k LOC. Risk of regression cost; not alone proof of user bugs.

---

## Top product risks

| Risk | Class | Why it matters |
|------|-------|----------------|
| Ship without Android dogfood Pass | FACT | North-star ≤10s and durability unproven |
| Feature surface > dogfood capacity | HYPOTHESIS | FI + habits + challenges + budget compete for attention |
| Price/catalog honesty | FACT | Live shelf prices forbidden; budget can look “broken” with incomplete prices |
| OCR/model download first-run | FACT | Network for weights; users may think OCR is cloud |

---

## Confirmed vs not

| Claim | Status |
|-------|--------|
| Offline diary + recipes + planner domains in code | Confirmed |
| Unit/integration Node verify green historically | Confirmed (re-run recommended per release) |
| Web visual pack 47 screens | Confirmed OBSERVED |
| Android UI Pass / TalkBack E2E | **Not confirmed** |
| Repeat meal ≤10s | **Not measured** |
| Real-user analytics | **None** (by design) |

---

## Read next

1. [`14-CHATGPT-HANDOFF.md`](./14-CHATGPT-HANDOFF.md) — self-contained brief for external AI  
2. [`01-FEATURE-INVENTORY.md`](./01-FEATURE-INVENTORY.md) — capability catalog  
3. [`11-ISSUE-REGISTER.md`](./11-ISSUE-REGISTER.md) — problem registry  
4. [`12-FOUNDER-DECISIONS.md`](./12-FOUNDER-DECISIONS.md) — decisions only founder can take  

**This pack does not approve a roadmap.** Priorities in `13-RECOMMENDED-PRIORITIES.md` are PROPOSED only.
