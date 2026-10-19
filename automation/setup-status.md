# Automation setup status

Last updated: cloud-first loop bootstrap (local verify + GitHub private repo).

## In-repo (automated / committed)

- [x] CI workflow: `.github/workflows/ci.yml` (typecheck, test, secret scan; mobile typecheck when `apps/mobile` exists)
- [x] Android staging workflow template: `.github/workflows/android-build.yml`
- [x] PR + issue templates under `.github/`
- [x] Agent prompts: `prompts/01`–`07`
- [x] Cursor Automations copy/paste: `automation/cursor-prompts.md` (+ `CLOUD-SETUP.md`)
- [x] Project hook: `.cursor/hooks.json` injects `docs/17-DEV-PLAN.md` + `AGENTS.md` on session start
- [x] Living plan + **Backlog (next agent-ready)**: `docs/17-DEV-PLAN.md`
- [x] Labels guide: `automation/GITHUB-LABELS.md`
- [x] DoD script: `npm run verify` (`scripts/verify.mjs`)
- [x] Cursor rule: `.cursor/rules/automation.mdc`
- [x] Cursor skill: `.cursor/skills/momentum-dev-loop/`
- [x] Expo app scaffold + dogfood domain in `apps/mobile` / `src/`

## GitHub (this machine)

- [x] Private repo: https://github.com/Alexkucepalov/momentum
- [x] Initial `main` push (includes workflows; `gh` token needs `workflow` scope)
- [x] Labels: `agent-ready`, `needs-human`, `dogfood`, `p0`, `p1`
- [ ] **Branch protection / rulesets** — blocked on free private repos (GitHub Pro required, or make repo public — **not recommended** for health app). Soft guardrails: AGENTS.md + Cloud prompts forbid agent merge.
- [ ] Optional later: upgrade to GitHub Pro → require PR + status check `verify` + no force-push

## Human one-time (Cursor UI — agents sleep-work)

Follow `automation/CLOUD-SETUP.md` and `automation/bootstrap-checklist.md`:

- [ ] Link repo to Cursor Cloud Agents; set spend limits; no production credentials
- [ ] Create 4 Cursor Automations from `automation/cursor-prompts.md` (PR review, `agent-ready`, nightly triage, pre-release)
- [ ] Smoke: issue with `agent-ready` produces a PR while founder is offline
- [ ] Local dogfood APK pipeline already present (`npm run build:apk:local`)
- [ ] Configure Expo account + `eas init` projectId + cloud EAS preview (later)
- [ ] Add `EXPO_TOKEN` GitHub Actions secret; manually dispatch staging build (later)
- [ ] Play developer account + privacy before closed testing (later)

## Operating rule

Agent: feature branch + PR only. Human: merge, secrets, Play, dangerous migrations.  
Without GitHub Pro, enforce “no direct push to main” via discipline + Cloud prompts until protection is enabled.
