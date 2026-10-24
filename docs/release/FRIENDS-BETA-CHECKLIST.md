# Friends Beta readiness checklist

Interactive prep list — code prep advanced; **device columns stay BLOCKED** until #92/#93.

| # | Criterion | Status |
|---|-----------|--------|
| 1 | APK installs and launches on two different Android devices | BLOCKED (APK built; install unproven) |
| 2 | New user can skip goals and add food immediately | CODE: OK (#121+); DEVICE: BLOCKED |
| 3 | Product found and logged with correct portion | CODE: Add Food + portion grams CTA (#127); DEVICE: BLOCKED |
| 4 | Yesterday’s product repeat without re-entering macros | CODE: quick + / last grams; DEVICE: BLOCKED |
| 5 | Recipe save, edit, use in diary | CODE: import draft persist (#125); DEVICE: BLOCKED |
| 6 | After restart, records and settings remain | CODE: snapshot tests; DEVICE: BLOCKED (#92) |
| 7 | Unknown КБЖУ never masked as zeros in summaries | CODE: #121 weekly + Eat Now explain (#127); DEVICE: BLOCKED |
| 8 | Modals work with Android keyboard and system Back | BLOCKED |
| 9 | No blocking crashes / unintended data loss | BLOCKED |
| 10 | Tester instructions + feedback channel | DOC: OK (`TESTER-INSTRUCTIONS.md`) |

## Product timing goals (measure on device)

| Metric | Target |
|--------|--------|
| Familiar product add | ≤ 10 s |
| Last portion repeat | ≤ 2 taps in flow |
| Manual new product | ≤ 30 s base row |
| Recipe from structured text | ≤ 60 s if parsed |
| Cold start mid Android | ≤ 3 s to usable UI |
| Data-loss bugs | 0 |
| Blocking defects before invite | 0 |
