# Product Quality Status — overnight overhaul

**Дата:** 2026-10-21  
**main SHA: `4b1884edd2ca922fc0957057f72f4b701bbfd9db`
**Verdict:** ключевые P0/P1 из Visual Audit закрыты в коде и влиты в `main`. **Android device Pass не утверждается** — нужен dogfood на телефоне. APK обновляется отдельно.

---

## Completed PRs (merged this night)

| PR | Title | Focus |
|----|-------|--------|
| [#72](https://github.com/Alexkucepalov/momentum/pull/72) | purchase preview layout + recipe kcal seed | P0 overflow; label kcal vs Atwater |
| [#73](https://github.com/Alexkucepalov/momentum/pull/73) | Eat Now meal portions + pantry-first | P1 meal cap ~700 kcal; pantry inventory first; location suggest |
| [#74](https://github.com/Alexkucepalov/momentum/pull/74) | shopping / budget / week UX | empty+manual shop; forecast ≥7d; week CTA; stores demoted |

---

## User problems → what changed

| Need | Change |
|------|--------|
| Что съесть сейчас? | Portions sized for one sitting; explanation includes kcal rationale |
| Записать / запасы после покупки | Preview fits mobile; confirm → pantry flash; fridge/freezer/шкаф guess |
| Что купить? | Empty/manual list without week plan; reconcile on purchase |
| Меню на неделю | Week surface + empty CTA (composer not always-on) |
| Сколько трачу? | Forecast hidden until ≥7 days history («мало данных») |
| КБЖУ рецепта | Seed no longer overwrites declared kcal with Atwater |

---

## Evidence

| Kind | Status |
|------|--------|
| Unit / `npm run verify` | Pass on each PR (last: 213+ tests) |
| Web screenshots (before) | `docs/quality/visual-audit-pack/` (47 PNG, Expo web) |
| Web screenshots (after) | `docs/quality/visual-audit-pack/after/` |
| Android emulator | Not run |
| Physical Android | **Pending** — use dogfood APK |

---

## Known remaining UX (not DONE)

- Recipe cards / editor still heavy (P1 polish deferred).
- Week meal row still has many actions (edit-mode collapse partial).
- Eat Now empty still nudges goals (candidates still listed).
- Analog product merge intentionally not auto.
- Conflicting cloud PRs #70/#71 superseded by #72–#74 — close manually if still open.
- Dispatcher still `DISPATCH_ENABLED=false`.

---

## Device gates pending

1. Install fresh dogfood APK (`docs/quality/apk/DOGFOOD-APK.md`).
2. Purchase paste → preview (320–390dp) → pantry locations.
3. Eat Now with high remaining → meal-sized portion.
4. Shop without week plan.
5. Budget early-month → «мало данных».

---

## Next prioritized tasks

1. Android dogfood pack → mark Visual Audit `A` column.
2. Recipe library card density + import text “only ambiguous fields”.
3. Week meal edit-mode vs view-mode.
4. Close stale cloud PRs #70/#71/#53–#56 after review.

---

## Rollback

```bash
git revert 82a3d33 51df8c3 0874252   # or revert individual squash merges
```

No schema migration in this night’s PRs beyond additive shopping APIs (snapshot v14 preserved).

**main SHA (report close):** `4b1884edd2ca922fc0957057f72f4b701bbfd9db`
