# Low-touch development automation — operating model
## Desired outcome
Founder only makes architecture/product/secret/release decisions and reviews demos. Coding runs remotely in isolated feature branches; no unattended merges to protected main.
## Sequence
A) GitHub repo + branch protection + CI are prerequisites.
B) Cursor Cloud Agent receives a narrow issue prompt (from `prompts/`), edits feature branch, runs lint/typecheck/tests, creates PR with screenshots, notes and risks.
C) GitHub Actions CI validates PR (`.github/workflows/ci.yml`). Separate automated review or Cursor Automation posts feedback; agent resolves comments.
D) Human checks screenshot/video + acceptance criteria. Only human merges after green checks.
E) EAS build is manual dispatch first; schedule pre-release builds later. EAS requires one-time local initial configuration and credentials.
F) Closed Google Play internal/closed test and releases require human sign-off.
## Setup in Cursor (manual UI connection)
Connect GitHub at cursor.com/agents. Start Cloud Agent with `prompts/01-bootstrap-mobile.md`. Connect repository. In Cursor Automations, create events: PR opened/updated -> review against AGENTS.md/PRD/quality; issue label `agent-ready` -> create implementation PR; daily -> triage failing CI and file issue, no auto-merge. Enable spend limits and restrict repo/secrets/network.
Cursor Cloud Agents/Automations can run with laptop closed AFTER setup, with provider-supported costs and limits; agents do not operate until you explicitly connect and configure them.
## Security permissions matrix
| Action | Cloud agent | CI | Human |
|---|---|---|---|
| Code on feature branch | yes | no | yes |
| Open PR | yes | no | yes |
| Merge main | no | no | yes |
| Add/rotate credentials | no | no | yes |
| Production DB migration | no | no | yes |
| Build staging APK/AAB | via approved workflow | manual dispatch | yes |
| Release to Google Play production | no | no | yes |
## Automatable workflows
- PR: lint, strict typecheck, unit test, secret scan, dependency audit, build checks.
- On issue `agent-ready`: conditional external Cursor Automation; template in `automation/cursor-prompts.md`, not auto-enabled.
- Weekday summary: PR status, blockers, test failures, cost; optional email/notification once connected.
- Release candidate: manual dispatch EAS build; internal distribution and store approval remain controlled.
## Guardrails
Never run arbitrary third-party PR code with write credentials. Use minimal GitHub Actions permissions. Avoid `pull_request_target` with untrusted checkout. API usage can bill separately from subscriptions. Review cloud agent data handling before uploading personal health data; use synthetic fixtures in CI.
