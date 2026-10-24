# Friends Beta — backlog

Maps product audit M-01…M-20 to repo work. Avoid duplicating closed GitHub issues; device work stays on #92/#93/#38.

**Sprint issues:** [#120](https://github.com/Alexkucepalov/momentum/issues/120) → [#122](https://github.com/Alexkucepalov/momentum/issues/122) → [#124](https://github.com/Alexkucepalov/momentum/issues/124)

## P0 — Reliability and data correctness

| ID | Task | Acceptance | Code paths | Verify | Deps |
|----|------|------------|------------|--------|------|
| M-01 | Persist/restore core data | Restart keeps diary, recipes, products, profile | `src/storage/*`, export/import | Domain tests + device | — |
| M-02 | CRUD food + no double-tap double entry | Add/edit/delete; rapid + does not duplicate | foodRepository, ConfirmPortion, Today quick+ | Tests + manual | — |
| M-03 | Distinguish 0 / unknown / no data | Empty week ≠ «0 ккал»; unknown not shown as 0 | `weeklyInsight.ts`, daily totals UI | Unit tests | — |
| M-06 | Usable without targets | Skip onboarding → add food | TargetsOnboardingSheet, Today | Manual / UI | — |

## P0 — Core food logging UX

| ID | Task | Acceptance | Code paths | Verify | Deps |
|----|------|------------|------------|--------|------|
| M-05 | Add Food: search → portion → save | Familiar food ≤2 taps when last portion known | AddFoodSheet, ConfirmPortion | Manual | M-03 |
| C-01 | Recipe/product portion copy | Recipe ≠ «с упаковки» | ConfirmPortionSheet | Visual | — |
| C-04 / M-07 | Eat Now search + aliases + ingredients | «творог» finds alias/ingredient matches; empty explained | eatNowPool, eat-now.tsx, commonFoodAliases | Unit + manual | — |

## P0 — Android release blockers

| ID | Task | Acceptance | Verify | Owner |
|----|------|------------|--------|-------|
| M-04 | Modals, keyboard, scroll, tab bar | Sheets usable with IME; Back dismisses | Device | needs-human |
| M-16 | APK install + first session on 2 devices | Cold start; data after kill | Device | needs-human |

## P1 — Recipe / catalog / plan UX

| ID | Task | Acceptance | Code paths |
|----|------|------------|------------|
| M-08 | Compact catalog & recipe list | One create CTA; denser cards | recipes/index, RecipeHubActions |
| M-09 | Remove duplicate CTAs | Today/Profile no tab mirrors | index.tsx, profile.tsx |
| M-10 | Text import draft survival | Leave page → draft kept | import-text flow |
| M-11 | Cook again / portions | Batch ≠ mutate recipe; scale by grams | cook batch domain |
| M-12 | Empty states one next action | Never dead-end | EmptyState usages |
| M-14 | Editable week menu | Move/replace/log-from-plan only on confirm | plan screens |

## P1 — Progress / backup / a11y / perf

| ID | Task | Acceptance |
|----|------|------------|
| M-13 | Honest weekly copy | Habits: N of habits met, not sum of ml |
| M-15 | Backup export/restore docs | Tester can export JSON and restore |
| M-17 | List/search perf | No multi-second freeze on mid device |
| M-18 | a11y | Touch ≥44, TalkBack labels on primary flows |

## P2 — Post-beta

| ID | Task |
|----|------|
| M-19 | Eat Now explanation tiers (ready / incomplete / none) |
| M-20 | Smarter week generation |

## This sprint (#120) implements

- Docs: audit, backlog, Android test plan, checklist, tester instructions, known issues, release notes
- Code: C-01, C-02, C-03, C-04 (+ search pool expand), C-05, C-06, C-07
- Tests for weekly insight + Eat Now query
- `npm run verify`

**Explicitly not in #120:** device Pass, APK redistribute, merge to main, restore ADR-009 cut features.
