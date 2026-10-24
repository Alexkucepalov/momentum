# Recommended Priorities (PROPOSED — not approved)

**HEAD:** `1da2d0ac`  
This is a **draft ordering** for founder + ChatGPT workshop. It is **not** a committed roadmap and does **not** create GitHub issues.

---

## Priority bands

### Band 0 — Prove the product works on Android

1. Close **#36** kill-app durability (PI-BUG-01)  
2. Close **#37** ≤10s repeat measurement (PI-MISS-02)  
3. Close **#38** + Visual Audit **Android** column (PI-MISS-03)  
4. Re-check purchase preview on device (PI-BUG-02)

**Rationale:** Without this, strategy debates float on web screenshots.

### Band 1 — Protect north-star diary speed & honesty

1. Unify / clarify Today vs Food log path (PI-UX-01) — needs D2  
2. One-tap recent re-log defaults (PI-OPP-02)  
3. Recipe KBJU single display source (PI-BUG-03)  
4. Raw vs cooked labels (PI-DATA-04)

### Band 2 — Make FI loop trustworthy

1. Pantry list-first (PI-UX-03)  
2. Budget completeness meter / hide false precision (PI-UX-06, D10)  
3. Eat Now entry from Today + stronger empty (PI-UX-05)  
4. Purchase idempotency + shopping merge (PI-DATA-01/03)  
5. Week menu declutter continuation (PI-UX-04)

### Band 3 — Reduce surface / cost

1. Hide or demote Stores (PI-UX-08, D3)  
2. Merge recipe create entries (PI-UX-07)  
3. Challenges hide candidate (D9)  
4. OCR accuracy eval before marketing (D4)  
5. APK size / lazy OCR weights (PI-ARCH-05)

### Band 4 — Architecture (after dogfood evidence)

1. Persist strategy spike only if #36 or D10k device jank proves pain (PI-ARCH-01)  
2. Repository split (PI-ARCH-02) as eng hygiene  
3. FlatList virtualization (PI-ARCH-04)

### Explicitly deferred

- Retail scrape  
- Cloud OCR  
- Telemetry SDK  
- Dispatcher on  
- Play production  

---

## What this ordering optimizes

**Evidence → trust → speed → FI value → cleanup → scale.**

Alternative orderings valid if founder picks D1=(B) FI-first — then Band 2 rises above Band 1 IA work, but Band 0 still first.

---

## Stop condition

Do **not** implement from this list in the intelligence PR. Next step: workshop using `14-CHATGPT-HANDOFF.md` + `12-FOUNDER-DECISIONS.md`.
