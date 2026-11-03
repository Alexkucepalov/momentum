# Android home-screen widgets — scaffold plan (nf-fit)

**Status:** Config plugin ships **5** Nothing-light AppWidgets (Day / Kcal / Steps / Water / Sleep) + Press Start 2P numerals. Device Pass still human.  
**ADR:** ADR-010 in `docs/14-DECISIONS.md`.  
**Contract:** `src/widgets/todayWidgetContract.ts`  
**Style:** light squircle `#F7F7F5`, ink `#0A0A0A`, accent dot `#D71921`, pixel font OFL.

## Product requirement

Home-screen widgets: calories (when known), water, steps, sleep. Geometry from Nothing OS light reference. **Never** render unknown nutrients as `0`.

## Expo / Android approach (2026)

Expo SDK does **not** ship first-party App Widget APIs. Practical paths:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Config plugin + native `AppWidgetProvider`** (Kotlin) + shared SQLite/ContentProvider | Full Android control; Expo prebuild / EAS | Dev client; dual UI | **Preferred** |
| **B. Community lib** e.g. `react-native-android-widget` | Faster RN widget UI | Validate Expo 57 | Acceptable spike |
| **C. Glance via thin Expo module** | Modern widgets | More native surface | Alternative to A |

**Not viable alone:** Expo Go / Expo Web.

## Phase 6 scaffold (done)

1. `TodayWidgetPayload` + `formatTodayWidgetDisplay` / `widgetEnergyFromTotals` (null-safe).
2. `apps/mobile/plugins/withNfFitWidgets.js` stamps `extra.nfFitWidgets` (no receiver yet).
3. Wired in `apps/mobile/app.json` plugins list.

## Remaining (APK / human)

1. Kotlin `AppWidgetProvider` + RemoteViews layouts (2×2 + 4×2).
2. Mirror Today metrics on diary save (SharedPreferences / ContentProvider).
3. Maestro: install APK → add widget → force-stop → values persist; unknown still «—».
