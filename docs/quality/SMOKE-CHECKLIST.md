# Android UI Smoke Checklist

**Status:** protocol only — **not run** in CI unless marked Pass below.  
Alternative automation: `maestro/food-add-smoke.yaml` (requires Maestro + device/emulator).

## Environment

| Field | Value |
|-------|-------|
| Date | |
| Build | Expo Go / APK dogfood / … |
| Device / emulator | |
| Network | online / airplane |

## Critical path (food log)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Cold launch | App opens, Today visible | |
| 2 | Tap add / recent | Sheet or portion opens | |
| 3 | Confirm grams | Entry appears in Food diary same day | |
| 4 | Force-stop app | — | |
| 5 | Relaunch | Entry still present; totals match | |
| 6 | Rapid double-tap Add (5×) | ≤1 new entry | |

## Timing (optional stopwatch)

| Metric | Trial 1 | 2 | 3 | Notes |
|--------|---------|---|---|-------|
| Repeat recent E2E (s) | | | | Goal ≤10s |
| Open AddFoodSheet (s) | | | | |

## Sign-off

Tester: ________  Result: Pass / Fail / Partial  
Evidence: screenshot / video link ________
