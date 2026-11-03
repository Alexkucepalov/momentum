# Friends Beta — release status

**Updated:** 2026-11-01  
**Verdict: BLOCKED** (device Pass)

Один документ решения после Product Overhaul Stages 1–11. Не новый roadmap. Aesthetic preferences и «ещё полирнуть» — не blockers.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| Branch | `main` |
| Commit (tip) | `f8787f8` (merge #180 Stage 10–11) |
| Overhaul | Stages **1–11** on main (#174–#180) |
| Tabs | Сегодня · Питание · Движение · Прогресс · Профиль |
| Snapshot | **v18** |
| `npm run verify` | **PASS** (local + CI on #180) |
| Open product PRs | none (stale #133/#135 closed) |

---

## 2. Features in this beta (frozen scope)

Included:

- Offline diary, catalog/search (FlatList), Add Food + portion, recent/favorites, copy yesterday + undo  
- Recipes, pantry / Eat Now / week plan / shop / budget (plan ≠ diary)  
- Movement = Activity \| Sleep; Garmin Personal API (SecureStore) + Zepp CSV  
- Progress month overview + reports (PDF / ChatGPT clipboard — no direct API)  
- Local JSON export/import; Android widget scaffold  

Explicitly out: Play production, required cloud/auth, store scraping, invented КБЖУ, silent ChatGPT API, endless redesign before device Pass.

---

## 3. Evidence

| Journey | Code evidence | Device evidence |
|---------|---------------|-----------------|
| Fast repeat ≤10s | Stage 5 (#175) | **BLOCKED** — `DEVICE-DOGFOOD-15MIN.md` |
| Persist / force-stop | SQLite snapshot persist | **BLOCKED** |
| Movement + sleep | Stage 3 + Garmin Stage 7 | **BLOCKED** (Garmin L1–L5 manual) |
| Visual / TalkBack | DS + a11y labels | **BLOCKED** — Visual Audit Android Pass open |

Code / `npm run verify` ≠ Android Pass.

---

## 4. Confirmed release blockers

| ID | Blocker |
|----|---------|
| B1 | Physical Android Pass not run (`docs/quality/DEVICE-DOGFOOD-15MIN.md`) |
| B2 | Keyboard / Back / modal IME unproven on device |
| B3 | Crash / data-loss gate unproven on device |

**Not blockers for dogfood:** denser polish, smarter week generator, new challenges, further AddFood redesign.

---

## 5. APK

| Field | Value |
|-------|--------|
| Artifact | `apps/mobile/dist/momentum-dogfood.apk` (gitignored) |
| Meta | `docs/quality/apk/DOGFOOD-APK.md` |
| bytes | 216680813 |
| sha256 | `f862de7138f35a924f1a19edbb5b9362439742a079b128a029873fba55f986e9` |
| git (JS in APK) | `f935f04` (#183) |
| build_date | 2026-11-03T06:27:25Z |
| Build | `cd apps/mobile && npm run build:apk:local` |
| dogfood_gate | **pending** until human Pass |

---

## 6. Minimal human actions (to flip READY)

1. Install fresh APK (`adb install -r` or file).  
2. Run `docs/quality/DEVICE-DOGFOOD-15MIN.md` (+ optional Garmin QA).  
3. Report pass/fail; on green → update this file to **READY** and `dogfood_gate: pass` in DOGFOOD-APK.md.

---

## 7. Release Lock

Until B1–B3 clear:

- No Play production  
- No new major features / tabs / backend  
- Only: device-proven bugs, data-loss fixes, or this status update  

Status source of truth: **this file**.

---

## 8. Verdict

**BLOCKED** — overhaul code baseline on `main`; Friends Beta / dogfood ship waits on human Android Pass.
