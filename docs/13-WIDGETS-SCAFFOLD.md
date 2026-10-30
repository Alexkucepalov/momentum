# Android home-screen widgets — scaffold plan (nf-fit)

**Status:** research + plan only (Phase 0). Implementation deferred until Today metrics are trustworthy.  
**ADR:** ADR-010 in `docs/14-DECISIONS.md`.

## Product requirement

Home-screen widgets are in scope: calories (when known), water, next meal hint, logging streak. Geometry/contrast from Nothing OS reference (`design/references/519af874-…png`). **Never** render unknown nutrients as `0`.

## Expo / Android approach (2026)

Expo SDK does **not** ship first-party App Widget APIs. Practical paths:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Config plugin + native `AppWidgetProvider`** (Kotlin) + shared SQLite/Room or ContentProvider read of `store_snapshot` / future tables | Full Android control; works with Expo prebuild / EAS | Requires `expo prebuild` / dev client; dual UI (RN + remote views) | **Preferred long-term** |
| **B. Community lib** e.g. `react-native-android-widget` (+ Expo config plugin) | Faster RN-side widget UI | Extra native dep; must validate Expo 57 / RN 0.86 | Acceptable Phase 6 spike |
| **C. Glance (Jetpack) via thin Expo module** | Modern Android widgets | More native surface; still needs data bridge | Alternative to A |

**Not viable alone:** Expo Go / Expo Web — widgets need a development build / APK.

## Scaffold steps (later PR)

1. Add Android `app.nffit.dogfood` widget provider stub via config plugin under `apps/mobile/plugins/` (empty RemoteViews layout).
2. Define **read-only** widget data contract: `{ dateLocal, energyKcal: number \| null, waterMl: number \| null, streakDays: number \| null }` — nulls stay null.
3. Expose snapshot fields through a tiny native reader or file/SharedPreferences mirror updated on diary save (offline-first).
4. Ship 2×2 metric pill + 4×2 Today strip matching design tokens (light surface, coral accent sparingly).
5. Maestro/manual: install APK → add widget → force-stop app → widget still shows last known values.

## Phase 0 deliverable

This document + ADR-010. No production widget binary yet.
