# Android E2E smoke — Grocery-to-Meal (device only)

**Pass only on physical Android.** Emulator/CI ≠ Pass.  
**APK:** `docs/quality/apk/DOGFOOD-APK.md` / release `dogfood-fi-*`.  
**Fixtures:** paste from `docs/fixtures/synthetic-purchases.json` (Чижик or Самокат). No real receipts.

## Preconditions

- Fresh install or wipe app data.  
- Airplane mode ON after first open (offline-first).  
- Do not claim Pass without filling the table below with date + device model.

## Script (~20 min)

| # | Action | Expect | ☐ |
|---|--------|--------|---|
| 1 | Cold start → План → Импорт покупки | Screen opens offline | ☐ |
| 2 | Paste **chizhik** fixture → К проверке | 3 food lines; edit one qty | ☐ |
| 3 | Confirm «Доставлено» | Flash pantry + expense; Запасы show items `source` purchase | ☐ |
| 4 | Same paste again → confirm | Error duplicate; pantry count unchanged | ☐ |
| 5 | Eat Now filter «Дома» | Useful options or honest empty — not crash | ☐ |
| 6 | Recipes: badge «N/M дома» if pantry non-empty | Visible on matching recipes | ☐ |
| 7 | Week menu → create draft → Shop from plan | List missing only; covered ings absent | ☐ |
| 8 | Budget | Фактически / Прогноз корзины / Съеденное; no «цена сегодня» | ☐ |
| 9 | Force-stop app → reopen | Pantry + expense + plan persist | ☐ |
| 10 | METRO paste (null totals) | Pantry fills; expense may be absent if incomplete | ☐ |

## Hard fails

- Null price shown as 0  
- Duplicate import doubles pantry or expenses  
- Planned meal appears in diary without explicit log  
- Crash / blank screen on any step  
- Receipt text in logcat

## Result log (founder)

```
date:
device:
apk_sha256:
steps_passed: /10
verdict: Pass | Fail
notes:
```

Until this block is filled on a real device: **dogfood_gate = pending**.
