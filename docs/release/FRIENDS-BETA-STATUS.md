# Friends Beta — release status

**Updated:** 2026-11-04  
**Verdict: BLOCKED** (device Pass — needs-human)

Один документ решения после Product Overhaul + audit remediation #186. Не новый roadmap. Aesthetic preferences и «ещё полирнуть» — не blockers.

---

## 1. Baseline

| Field | Value |
|-------|--------|
| Branch | `main` (merge tip after #186) |
| Commit (tip pre-#186) | `076c3bc` (widgets #185) |
| Overhaul | Stages **1–11** on main (#174–#180) + dogfood #183–#185 |
| Audit code | #186 P0–P2 food speed / undo / persist / docs |
| Tabs | Сегодня · Питание · Движение · Прогресс · Профиль |
| Snapshot | **v18** |
| Dogfood APK | `apps/mobile/dist/momentum-dogfood.apk` · arm64 · sha256 `37cf486c…` |
| Open product PRs | see #186 |

---

## 2. Features in this beta (frozen scope)

Included:

- Offline diary, catalog/search (FlatList), Add Food + portion, recent/favorites, copy yesterday + undo  
- Today recent strip + one-tap «+»; compact diary rows; undo on sheet/barcode/recipe adds  
- Recipes, pantry / Eat Now / week plan / shop / budget (plan ≠ diary)  
- Movement = Activity \| Sleep; Garmin Personal API (SecureStore) + Zepp CSV  
- Progress week overview + primary ChatGPT day copy; PDF in Reports  
- Local JSON export/import; Android Nothing-light widgets (5 variants) in APK  

Explicitly out: Play production, required cloud/auth, store scraping, invented КБЖУ, silent ChatGPT API, FoodRepository split, normalized SQLite.

---

## 3. Evidence

| Journey | Code evidence | Device evidence |
|---------|---------------|-----------------|
| Fast repeat ≤10s | Stage 5 + #186 Today recent / undo | **BLOCKED** — `DEVICE-DOGFOOD-15MIN.md` + stopwatch n≥10 |
| Persist / force-stop | SQLite snapshot + coalesce microtask | **BLOCKED** |
| Movement + sleep | Stage 3 + Garmin Stage 7 + repeat yesterday workouts | **BLOCKED** (Garmin L1–L5 manual) |
| Visual / TalkBack | DS + a11y labels | **BLOCKED** — Visual Audit Android Pass open |

Code / `npm run verify` ≠ Android Pass.

---

## 4. Release Lock

Until device Pass is signed by a human on physical Android: **no** Play upload, **no** new feature stages, **no** secret rotation, **no** normalized SQLite rewrite.

---

## 5. Human checklist (unblocks Friends Beta)

1. Install current dogfood APK (arm64).  
2. Run `docs/quality/DEVICE-DOGFOOD-15MIN.md`.  
3. Stopwatch: Recent «+» and «Повторить вчера» ×10 — median ≤10s.  
4. Force-stop → reopen: diary intact.  
5. Garmin sync smoke if key available.  
6. TalkBack smoke on Today + Food add.  
7. Update this file: Verdict **READY**, tip commit, attach evidence notes.
