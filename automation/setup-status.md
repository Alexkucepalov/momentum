# Automation setup status

Last updated with Phase 0–1 dogfood implementation. Human-only steps stay unchecked until done in GitHub / Cursor / Expo UI.

## In-repo (automated / committed)

- [x] CI workflow: `.github/workflows/ci.yml` (typecheck, test, secret scan; mobile typecheck when `apps/mobile` exists)
- [x] Android staging workflow template: `.github/workflows/android-build.yml`
- [x] PR + issue templates under `.github/`
- [x] Agent prompts: `prompts/01`–`07`
- [x] Cursor Automations copy/paste: `automation/cursor-prompts.md`
- [x] Project hook: `.cursor/hooks.json` injects `docs/17-DEV-PLAN.md` + `AGENTS.md` on session start
- [x] Living plan: `docs/17-DEV-PLAN.md`
- [x] Labels guide: `automation/GITHUB-LABELS.md`
- [x] Local `git init` on `main` (no remote yet)
- [x] Expo app scaffold + Phase 1 diary in `apps/mobile`

## Human one-time (cannot be done by agent alone)

- [ ] Create **private** GitHub repository; push this package
- [ ] Enable `main` branch protection + required CI status checks
- [ ] Link repo to Cursor Cloud Agents; set spend limits; no production credentials
- [ ] Create Cursor Automations from `automation/cursor-prompts.md` (PR review, `agent-ready`, weekday triage, pre-release)
- [x] Local dogfood APK pipeline (`apps/mobile/eas.json`, `npm run build:apk:local`)
- [ ] Configure Expo account + `eas init` projectId + cloud EAS preview
- [ ] Add `EXPO_TOKEN` GitHub Actions secret; manually dispatch staging build
- [ ] Play developer account + privacy before closed testing

## Operating rule

Agent: feature branch + PR only. Human: merge, secrets, Play, dangerous migrations.
