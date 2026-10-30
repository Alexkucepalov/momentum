# nf-fit Phase 6 — Quality + Beta checklist

**Status:** Phase 6 foundation (this PR). Production Play / EAS release remains **human-gated**.

## Product DoD (dogfood / closed beta)

- [x] Phases 0–5 merged on `main` (Foundation → Planner)
- [x] `npm run verify` green (typecheck, tests, security, mobile tsc)
- [x] Design system Minimal Soft Utility on shell + core tabs
- [x] `unknown ≠ 0` in diary, recipes, Today, Progress, widgets contract
- [x] Offline snapshot persistence + export/import/delete
- [x] Plan ≠ diary (explicit log only)
- [x] Workouts do not auto-offset food kcal
- [ ] Android device dogfood 15 min (`docs/quality/DEVICE-DOGFOOD-15MIN.md`) — human
- [ ] Home-screen widget binary on APK — scaffold only; see `docs/13-WIDGETS-SCAFFOLD.md`
- [ ] Play Internal / closed test — human (privacy policy, Data safety)

## Widgets (Phase 6 scaffold)

| Item | State |
|------|--------|
| Research ADR-010 | Done (Phase 0) |
| TS contract `TodayWidgetPayload` | Done |
| Expo config plugin metadata | Done (`apps/mobile/plugins/withNfFitWidgets.js`) |
| Native `AppWidgetProvider` | **Not shipped** — needs prebuild + APK |
| Unknown as «—» in formatter | Done |

## Agent boundaries

Routine PRs may merge after green CI. Stop for: dangerous migrations, new dangerous permissions, health sharing, purchases, production Play/EAS.
