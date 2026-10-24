# Friends Beta — release status

**Updated:** 2026-10-24  
**Verdict: BLOCKED**

Один документ решения. Не новый roadmap. Aesthetic preferences и «ещё полирнуть» — не blockers.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| Branch | `main` |
| Commit (tip) | `c4ebf8d` (merge #132 apk meta) |
| App code in APK | `20fa80d` (merge #131 / Friends Beta through #130) |
| `npm run verify` | **PASS** 2026-10-24 — 190 tests, typecheck, security, mobile tsc |
| Open product PRs | none |
| ADR-009 cut | pantry / shop / budget / receipts — **not restored** |

## 2. Features in this beta (frozen scope)

Included:

- Daily nutrition diary, catalog/search, Add Food + portion, recent/favorites/quick repeat  
- My products + bulk import  
- Recipes, text import (draft persist), prepared batches  
- Eat Now (known data only; no invented nutrition)  
- Basic week plan (manual edit; plan ≠ eaten)  
- Activity, water, habits, progress, profile, local JSON export  

Explicitly out: cloud, auth, restored ADR-009 modules, new tabs, advanced AI, endless redesign.

## 3. Five journeys — evidence

| Journey | Code / domain evidence | Device evidence |
|---------|------------------------|-----------------|
| A First session (skip goals → find/create → portion → diary) | Targets onboarding skip + Add Food + ConfirmPortion (#121–#128) | **BLOCKED** |
| B Daily repeat (≤2 actions via quick + / last grams) | Today AddFoodBlock + AddFoodSheet `onQuickAdd` + addGuard | **BLOCKED** (#93 timing) |
| C Own products (paste → preview → confirm → search → edit → unknown≠0 → restart) | my-products import summary (#130); snapshot/import tests | Restart on device **BLOCKED** (#92) |
| D Recipes (import → save → batch optional → portion → cook again without mutating recipe) | import draft (#125); cookAgain tests; portion/batch copy (#130) | **BLOCKED** |
| E Eat Now (eligible + explain + no invent + fallback) | aliases/ingredients (#121); explain fit (#127); empty CTAs | **BLOCKED** |

Code evidence ≠ Android Pass.

## 4. Confirmed release blockers

| ID | Blocker | Why it blocks ship |
|----|---------|-------------------|
| B1 | Physical Android Pass not run | #92 persist/force-stop; #93 ≤10s repeat; install on ≥2 devices |
| B2 | Keyboard / Back / modal IME unproven on device | Checklist #8 |
| B3 | Crash / data-loss gate unproven on device | Checklist #9 |

**Not blockers for v1:** denser catalog polish, smarter week generator, PDF prominence, synonym search, new challenges, full redesign of portion sheet macros editor.

## 5. Tests actually executed

| Suite | Result |
|-------|--------|
| `npm run verify` (typecheck + 190 node tests + secrets + mobile tsc) | PASS |
| Expo Web visual pack | UX reference only — **not** Android |
| Physical Android install / force-stop / IME / Back | **not run** |

## 6. Android / APK

| Field | Value |
|-------|--------|
| Artifact | `apps/mobile/dist/momentum-dogfood.apk` (gitignored; rebuild via `apps/mobile`: `npm run build:apk:local`) |
| Meta | `docs/quality/apk/DOGFOOD-APK.md` |
| bytes | 58064514 |
| sha256 | `c5847ee08c1b7f7902a9d88805e323d7b438af68c9d06ce2c3dfd302f66b95a8` |
| git (JS in APK) | `20fa80d` |
| build_date | 2026-10-24T13:26:25Z |
| dogfood_gate | **pending** |
| Device Pass | **BLOCKED** |

## 7. Minimal human actions (to flip READY)

1. Install APK on **two** Android devices (`adb install -r` or file).  
2. Run `docs/release/ANDROID-TEST-PLAN.md` scenarios 1–12 (especially 1, 3, 4, 8, 9, 10).  
3. Report pass/fail per scenario (or file issues with sha256 + model + Android + steps).  
4. On full pass: update this file → **READY**, set `dogfood_gate: pass` in DOGFOOD-APK.md, invite 5–8 friends with `TESTER-INSTRUCTIONS.md`.

Do **not** open new redesign/audit issues before step 2–3.

## 8. Release Lock

Until B1–B3 clear:

- No new major features / tabs / backend  
- No full UI redesign  
- Only: device-proven bugs, data-loss fixes, or this status update  

Status source of truth: **this file**.

## 9. Verdict

**BLOCKED** — code baseline + dogfood APK exist; Friends Beta ship waits on human Android Pass (#92 / #93).

**DONE (agent):** verify green; scope frozen; APK built; status documented.  
**NOT DONE:** device gates.  
**NEXT HUMAN ACTION:** install APK → run Android test plan → reply with results.
