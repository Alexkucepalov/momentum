# nf-fit dogfood readiness (Phase 6)

Synthetic / local only — no real health records in fixtures.

## Before friends beta

1. `npm install && npm run verify` at repo root.
2. `cd apps/mobile && npx expo start` (or APK via EAS preview / local — human credentials).
3. Smoke (15 min): Today empty → «—» energy; add food with grams; water +250; recipe portion; plan draft does not fill diary; workout does not cut food kcal; Profile export JSON.
4. Privacy: no account required; delete-all works after export.
5. Widgets: contract only until APK ships `AppWidgetProvider` (`docs/13-WIDGETS-SCAFFOLD.md`).

## Blockers for Play

Privacy policy URL, Data safety form, signed AAB, closed testers — **human**. See `docs/10-PLAY-RELEASE.md` and `docs/PHASE6-QUALITY-BETA.md`.
