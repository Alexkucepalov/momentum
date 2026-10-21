# Product Quality Status — overnight overhaul

**Дата:** 2026-10-21 (утро)  
**main SHA:** `e18dba3`  
**Verdict:** ключевые P0/P1 + morning UX (week edit / recipe density) в `main`. **Android device Pass не утверждается** — нужен dogfood на телефоне.

---

## Completed PRs (merged this night)

| PR | Title | Focus |
|----|-------|--------|
| [#72](https://github.com/Alexkucepalov/momentum/pull/72) | purchase preview layout + recipe kcal seed | P0 overflow; label kcal vs Atwater |
| [#73](https://github.com/Alexkucepalov/momentum/pull/73) | Eat Now meal portions + pantry-first | P1 meal cap ~700 kcal; pantry inventory first; location suggest |
| [#74](https://github.com/Alexkucepalov/momentum/pull/74) | shopping / budget / week UX | empty+manual shop; forecast ≥7d; week CTA; stores demoted |
| [#75](https://github.com/Alexkucepalov/momentum/pull/75)–[#76](https://github.com/Alexkucepalov/momentum/pull/76) | border-box + docs/after | preview clip; status pack |
| [#53](https://github.com/Alexkucepalov/momentum/pull/53)/[#56](https://github.com/Alexkucepalov/momentum/pull/56) | QS tokens + Profile links | merged morning |
| [#77](https://github.com/Alexkucepalov/momentum/pull/77) | week edit-mode + recipe density | view/edit meals; compact library |

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

- Eat Now empty still nudges goals (candidates still listed).
- Analog product merge intentionally not auto.
- Dispatcher still `DISPATCH_ENABLED=false`.
- Physical Android Visual Audit column `A` empty.

---

## Device gates pending

1. Install fresh dogfood APK (`docs/quality/apk/DOGFOOD-APK.md`).
2. Purchase paste → preview (320–390dp) → pantry locations.
3. Eat Now with high remaining → meal-sized portion.
4. Shop without week plan; week «Изменить» reveals secondary actions.
5. Budget early-month → «мало данных».

---

## Next prioritized tasks

1. **Android dogfood** → mark Visual Audit `A` (blocked without device/adb).
2. Eat Now empty / goals UX soften.
3. Optional: rebuild release asset on GitHub Releases.

---

## Rollback

```bash
git revert 82a3d33 51df8c3 0874252   # or revert individual squash merges
```

No schema migration in this night’s PRs beyond additive shopping APIs (snapshot v14 preserved).

**main SHA (report close):** `4b1884edd2ca922fc0957057f72f4b701bbfd9db`
