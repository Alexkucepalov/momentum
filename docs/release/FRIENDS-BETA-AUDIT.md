# Friends Beta — audit (2026-10-24)

**Issue:** [#120](https://github.com/Alexkucepalov/momentum/issues/120)  
**Evidence:** code on `main` after #117/#115; visual pack `docs/quality/visual-audit-pack/2026-10-24-screens/` (Expo Web 390×844 @2x).  
**Rule:** Expo Web ≠ Android Pass. Device gates #92/#93/#38 remain `needs-human`.

## Current implemented surface

| Area | Status | Notes |
|------|--------|-------|
| Today | Working | Week strip, kcal ring, quick repeat, water/habits, Eat Now CTA |
| Food diary + AddFoodSheet | Working | Search, tabs (Недавние/Избранное/Мои/Каталог/Рецепты), portion confirm |
| My products | Working | Batch name import; unknown macros preserved |
| Recipes | Working | Manual, text import, personal archive, cook batch, portion → diary |
| Eat Now | Working | Pool from personal/frequent/recipes/batches; scoring vs remaining |
| Week menu | Working | Draft plan; edit/move; no auto-log to diary |
| Progress | Working | Weight, habits, challenges, weekly insight, PDF/JSON export |
| Profile | Working | Targets, units, backup export/import |
| Activity / water / habits | Working | Sufficient for beta; no new mechanics planned |
| Pantry / shop / budget / receipts | **Intentionally removed** | ADR-009; redirects only — not bugs |

## Navigation (five tabs)

Сегодня · Питание · План · Прогресс · Профиль. Activity is nested (href null), not a sixth peer tab.

## Confirmed defects (code evidence)

| ID | Finding | Files | Severity |
|----|---------|-------|----------|
| C-01 | Portion sheet always says «Сколько съел с упаковки?» including for recipes | `apps/mobile/src/features/diary/ConfirmPortionSheet.tsx` (~226–228) | P0 UX |
| C-02 | Empty week with no food entries can show «Ккал за неделю: 0» (empty days contribute 0) | `src/domain/weeklyInsight.ts` | P0 data |
| C-03 | Habit line «N из 157» sums quantity targets (ml) — confusing metric | `src/domain/weeklyInsight.ts` | P0 UX/copy |
| C-04 | Eat Now search is title-substring only; seed/catalog aliases and recipe ingredients ignored; default pool excludes unused seeds → «творог» can look empty | `src/domain/eatNowPool.ts`, `apps/mobile/app/(tabs)/plan/eat-now.tsx` | P0 Bug/UX |
| C-05 | Today duplicates Food/Recipes CTAs already on tabs/footer | `apps/mobile/app/(tabs)/index.tsx` | P1 UX |
| C-06 | Profile lists tab destinations again | `apps/mobile/app/(tabs)/profile.tsx` | P1 UX |
| C-07 | Recipes list: header `+` and large «Добавить рецепт» duplicate | `apps/mobile/app/recipes/index.tsx`, `RecipeHubActions.tsx` | P1 UI |

## Suspected UX (need device / product verify — not claimed as code bugs)

- Calendar header vertical cost on Today (visual pack).
- Oversized recipe cards / empty photo hero.
- Add Food still multi-path; unified sheet exists but secondary modes compete.
- Eat Now empty when macros unknown — may be eligibility, not search alone.
- Macro targets independent of 4/9/4 kcal — UI does not explain mismatch (Profile screenshot 2200 vs ~2070).

## Persistence / data correctness

| Topic | Assessment |
|-------|------------|
| Snapshot store + migrations | Soft-retain; ADR-009; do not invent destructive migrations |
| Unknown ≠ 0 | Domain generally correct; weekly empty-day sum was the hole (C-02) |
| Diary snapshot on log | ConfirmPortion → entry stores per-portion macros |
| Import/export | JSON snapshot; Friends Beta needs documented backup path |
| Restart survival | Covered by unit/integration tests; **Android cold start BLOCKED** without device |

## Android-specific risks (BLOCKED until device)

- Keyboard + sheet insets (ConfirmPortion, AddFood).
- System Back vs modal dismiss.
- TalkBack / large font.
- APK install on ≥2 devices; data survive process kill.
- List performance (catalog / search) on mid-range SoC.

Current dogfood APK note: `docs/quality/apk/DOGFOOD-APK.md` (~58 MB arm64, git 69b6198) — dogfood_gate **pending**.

## Intentionally out of scope for Friends Beta

Pantry, shopping, budget, receipts, stores, marketplace, mandatory auth/cloud, AI agents, shame streaks, fake nutrition fill.

## Release blockers vs non-blockers

**Blockers (P0):** C-01…C-04; persistence smoke (M-01/M-02); goals-optional path (M-06); Android Pass (M-04/M-16) — last two need human device.

**Non-blockers:** P2 Eat Now explainability polish; week-menu generator intelligence; PDF report prominence; returning cut features.

## Visual audit limitation

51 screens from Expo Web. Use for UX prioritization only. Do not mark Android checklist PASS from this pack.
