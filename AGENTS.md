# Instructions for ALL coding agents
Project: Momentum. Read `docs/00-NAVIGATION.md` and relevant specifications first. Treat docs as current baseline unless ADR is added.
## Mission
Ship delightful, reliable low-friction offline-first nutrition/habits/fitness Android app. Optimize repeated logging speed and privacy. Do not add feature bloat.
## Rules
1. Implement **one GitHub issue per branch/PR**, with tests and acceptance checklist. No direct merge to main.
2. No fake screen claiming functional backend, no silent AI guesses, no invented nutrition values or sources.
3. No secrets or personal health data in source/tests/logs/screenshots. Use synthetic fixtures only.
4. Default to deterministic pure functions for numbers. Validate inputs; preserve unknown (null) separately from 0.
5. Prefer React Native + Expo + strict TypeScript + SQLite. Do not add backend for first vertical slice.
6. Every mutation has user feedback/undo where possible, persistence across restart and offline test.
7. Avoid medical advice, shame/guilt rhetoric, or gamification rewarding under-eating/over-training.
8. Ask for human approval for dangerous migrations, new permissions, health data sharing, purchases, external side effects or production release.
9. Run `npm run verify` before PR (typecheck + test + security + mobile tsc); if unavailable document blocker, never pretend success.
10. Report changed files, commands/results, screenshots (UI), risk, rollback, scope deviations.
## GitHub PR checklist
- [ ] Issue/acceptance tests linked
- [ ] Tests and typecheck actually run
- [ ] Handles offline and invalid data
- [ ] Accessibility and privacy checked
- [ ] No unapproved dependencies/secrets
- [ ] Real screenshots/demo for UI
