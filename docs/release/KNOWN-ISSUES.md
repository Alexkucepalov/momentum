# Known issues — Friends Beta

Last updated: 2026-10-24 · Follow-up [#122](https://github.com/Alexkucepalov/momentum/issues/122) after [#120](https://github.com/Alexkucepalov/momentum/issues/120) / #121

## Fixed in #121 (merged)

| Issue | Fix |
|-------|-----|
| Portion copy «с упаковки» on recipes | Separate lead text for recipe vs product |
| Empty week shown as 0 kcal | «Нет записей»; empty days not summed as known energy |
| Habits «N из 157» | Count habits that met weekly goal, not sum of quantity units |
| Eat Now miss on aliases / ingredients | Query matches aliases + ingredient names; search expands catalog hits |

## Fixed / improved in #122

| Issue | Fix |
|-------|-----|
| Empty recipe photo hero | Hero only when photo exists |
| Oversized recipe list cards | Denser rows; title up to 3 lines; no empty thumb/chevron |
| Eat Now empty / search miss | EmptyState with reset filter or next catalog action |
| Backup path unclear for testers | Tester instructions clarify Profile → export JSON |

## Open / accepted for beta

| Issue | Severity | Notes |
|-------|----------|-------|
| Android device Pass not run | Blocker | #92/#93/#38 needs-human |
| Add Food multi-path still denser than ideal wireframe | P1 | Unified sheet exists; further simplify post-device feedback |
| Macro targets vs 4/9/4 mismatch unexplained | P1 | Independent user numbers by design |
| Week menu generator repeats | P2 | Prefer manual edit for beta |
| Expo Web screenshots only for visual pack | Info | Not Android evidence |

## Won’t fix for Friends Beta

Restoring pantry / shop / budget / receipts (ADR-009). Cloud sync. Invented nutrition.
