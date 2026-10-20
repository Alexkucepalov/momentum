# Automation setup status

Last updated: Autonomous Sprint Dispatcher v1 (dry-run default).

## In-repo

- [x] CI + dispatcher workflow (`.github/workflows/ci.yml`, `momentum-dispatcher.yml`)
- [x] Dispatcher code: `automation/dispatcher/*` + `npm run automation:dispatch`
- [x] Docs: `docs/AUTONOMOUS-DEVELOPMENT.md`
- [x] Labels: `agent-ready`, `agent-running`, `agent-review`, `agent-failed`, `needs-human`, `dogfood`, `p0`, `p1`
- [x] `npm run verify` DoD gate
- [x] Cursor rule/skill for local agents

## GitHub

- [x] Private repo: https://github.com/Alexkucepalov/momentum
- [x] Secret `CURSOR_API_KEY` (set via founder; **rotate if ever pasted in chat**)
- [x] Variables `DISPATCH_ENABLED=false`, `DISPATCH_DRY_RUN=true`
- [ ] Branch protection (needs GitHub Pro on private)

## Go-live checklist

- [ ] Keep Cursor Automation **Momentum agent-ready** Inactive while dispatcher is primary
- [ ] Dry-run Action once (manual workflow_dispatch)
- [ ] Founder approves live: set `DISPATCH_DRY_RUN=false` and `DISPATCH_ENABLED=true`
- [ ] First live issue = small docs-only task
- [ ] Spend limits in Cursor dashboard

## Operating rule

Agent / dispatcher: feature branch + PR only. Human: merge, secrets, Play.
