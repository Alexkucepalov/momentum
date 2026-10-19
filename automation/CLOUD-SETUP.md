# Cursor Cloud Automations — founder checklist

Do this once after `Alexkucepalov/momentum` exists on GitHub and CI is green on `main`.

## 1. Connect

1. Open [Cursor Cloud Agents](https://cursor.com/agents) → connect GitHub → grant access to **private** `momentum`.
2. Set **spend / usage limits** (start low; raise only if overnight work is valuable).
3. Do **not** add Play, EAS production, or personal health data secrets to the agent environment.

## 2. Create four Automations

In Cursor → Automations, create each row. Paste prompts from [`cursor-prompts.md`](cursor-prompts.md).

| # | Name | Trigger | Tools | Prompt section |
|---|------|---------|-------|----------------|
| 1 | Momentum PR review | GitHub: PR opened + synchronized | Comment on PRs | §1 PR review |
| 2 | Momentum agent-ready | GitHub: issue labeled `agent-ready` | Repo write (branch/PR) | §2 Implementation |
| 3 | Momentum nightly triage | Cron `0 2 * * *` (or weekdays 09:00) | Issues + read CI | §3 Triage |
| 4 | Momentum pre-release | Manual | Read-only | §4 Pre-release |

Repo scope: `Alexkucepalov/momentum` only.

## 3. Smoke test (unattended)

1. Create issue from Backlog row 4 (“Agent smoke / docs sync”) or a trivial docs typo fix.
2. Apply labels: `dogfood`, `agent-ready`.
3. Close laptop / leave Cursor. Within the Automation SLA a Cloud Agent should open a PR.
4. Morning: review PR → merge if green. Tick boxes in `setup-status.md`.

## 4. Operating limits

- ≤2 issues with `agent-ready` at once.
- Agents never merge `main`.
- On blocker → `needs-human` (no guesswork).
