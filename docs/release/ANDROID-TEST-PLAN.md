# Android test plan — Friends Beta

**Status:** Device execution **BLOCKED** until a human installs Preview/dogfood APK on physical devices.  
Do not mark PASS from Expo Web or CI alone.

## Builds

| Artifact | Doc | Notes |
|----------|-----|-------|
| Local dogfood APK | `docs/quality/apk/DOGFOOD-APK.md` | arm64; ~58 MB recent cut |
| EAS Preview | `apps/mobile/eas.json` profile `preview` | Requires credentials — human only |

Record: APK sha256, git SHA, build date, device model, Android version.

## Devices (minimum)

1. Mid-range Android 12+  
2. Second device (different OEM or Android major)

## Scenarios

1. **Cold install** — install APK, grant only needed permissions, open app.  
2. **Skip goals** — dismiss targets → add food from Today or Food.  
3. **Search + portion** — find product, set grams, save; diary updates.  
4. **Quick repeat** — next day (or change date) use last portion + ; no double entry on double tap.  
5. **Own product** — batch import names; unknown macros stay unknown.  
6. **Recipe** — import/create → cook or add portion → diary.  
7. **Eat Now** — with and without targets; search «творог» / known recipe name.  
8. **Keyboard** — ConfirmPortion + AddFood: fields visible above IME; dismiss sheet.  
9. **System Back** — closes sheet, does not exit app unexpectedly mid-form.  
10. **Persistence** — force-stop app; reopen; entries/settings intact.  
11. **Export** — JSON backup from Profile; optional restore on clean install.  
12. **Regression** — water +, habit check, one workout.

## Pass criteria

See `FRIENDS-BETA-CHECKLIST.md`. Any data loss or blocker crash → FAIL and new GitHub issue with APK version + device + steps.
