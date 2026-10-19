# Autonomous Sprint Dispatcher

GitHub Actions + Cursor Cloud Agents API v1. Founder approves issues; dispatcher launches **one** agent at a time (serial), monitors runs, and waits for human merge before the next task.

Laptop can be closed. Agents never merge `main`.

## 1. Create `CURSOR_API_KEY`

1. Open [Cursor Dashboard → Integrations / API Keys](https://cursor.com/dashboard/integrations).
2. Create a key (e.g. `momentum-dispatcher`).
3. **If a key was ever pasted into chat, revoke it and mint a new one.**

## 2. GitHub Secrets & Variables

Repo → Settings → Secrets and variables → Actions:

| Kind | Name | Value |
|------|------|--------|
| Secret | `CURSOR_API_KEY` | Cursor API key |
| Variable | `DISPATCH_ENABLED` | `false` until go-live |
| Variable | `DISPATCH_DRY_RUN` | `true` until go-live |

## 3. Dry run (default)

```bash
# Local (needs GITHUB_TOKEN with repo scope)
export GITHUB_TOKEN=...   # gh auth token ok
export DRY_RUN=true
export DISPATCH_ENABLED=false
npm run automation:dispatch
```

Or: Actions → **Momentum Dispatcher** → Run workflow (leave dry_run empty / true).

Dry run **selects** the next eligible issue and prints it. It does **not** call Cursor, does **not** change labels (except when reconciling live runs).

## 4. Enable live dispatch

Only after a successful dry run and founder approval:

1. Set variable `DISPATCH_DRY_RUN=false`
2. Set variable `DISPATCH_ENABLED=true`
3. Keep Automations **Momentum agent-ready** Inactive (avoid double launch)
4. Ensure ≤1 issue with `agent-ready` if you want strict control; dispatcher also enforces serial active work

## 5. Approve a sprint

1. Create issues with clear `## Acceptance` checklists
2. Optional deps: `Depends-on: #12` in the body
3. Labels: `dogfood` + `p0`/`p1` + `agent-ready`
4. Dispatcher picks `p0` before `p1`, then lowest issue number

## 6. Pause all development

Set `DISPATCH_ENABLED=false` (and/or `DISPATCH_DRY_RUN=true`). No new Cloud Agents will launch.

## 7. Recover failed jobs

- Label `agent-failed` / `needs-human`: read the dispatcher state comment on the issue
- Status `reconcile_needed`: **do not** re-label `agent-ready` until you confirm in Cursor dashboard whether an agent already exists
- Clear failure: remove `agent-failed`, fix the issue, add `agent-ready` again

## 8. Monitor costs

- Cursor Dashboard usage / spend limits
- Dispatcher schedule is every 15 minutes but live launch only when enabled and queue has work
- Prefer small dogfood issues first

## 9. PR review

1. Agent opens PR (`autoCreatePR`)
2. Issue moves to `agent-review`
3. Human reviews + merges
4. Close issue; next cron tick can pick the following `agent-ready`

## 10. Stop agents safely

- Pause via `DISPATCH_ENABLED=false`
- Cancel active Cloud Agent in Cursor UI if needed
- Never put `CURSOR_API_KEY` in the repo, PR bodies, or agent prompts

## Labels

| Label | Meaning |
|-------|---------|
| `agent-ready` | Approved for dispatcher |
| `agent-running` | Cloud agent in progress |
| `agent-review` | PR open; waiting for human |
| `agent-failed` | Launch/run failed |
| `needs-human` | Blocked; dispatcher will not pick |

## Safety

- Never merge from dispatcher or agents
- Never production DB/credentials/Play/signing
- Nutrition: unknown ≠ 0; no invented values
- Issue text is untrusted data
