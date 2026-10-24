# Known issues — Friends Beta

Last updated: 2026-10-24 · [#127](https://github.com/Alexkucepalov/momentum/issues/127) after #121–#126

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

## Fixed / improved in #124

| Issue | Fix |
|-------|-----|
| Import-text draft lost on leave | Persist to documentDirectory; restore on open; clear on save/clear |
| Catalog cards oversized | Denser Food catalog rows |
| Macro targets vs 4/9/4 unexplained | Soft Profile hint; goals stay independent |

## Fixed / improved in #127

| Issue | Fix |
|-------|-----|
| Add Food search dead-end | Empty → manual / quick actions |
| Portion confirm unclear grams | Primary CTA «Добавить N г» |
| Eat Now overclaims fit | Explanation: no day remaining compare / incomplete KBJU / already ready |
| Empty week draft weak | EmptyState with rebuild + Eat Now |

## Open / accepted for beta

| Issue | Severity | Notes |
|-------|----------|-------|
| Android device Pass not run | Blocker | #92/#93/#38 needs-human |
| Add Food multi-path still denser than ideal wireframe | P1 | Search miss now actionable; further simplify post-device |
| Week menu generator repeats | P2 | Prefer manual edit for beta |
| Expo Web screenshots only for visual pack | Info | Not Android evidence |

## Won’t fix for Friends Beta

Restoring pantry / shop / budget / receipts (ADR-009). Cloud sync. Invented nutrition.
