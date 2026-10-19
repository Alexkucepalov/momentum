# GitHub labels for agent workflow

Create these labels in the private repo (Settings → Labels or `gh label create`):

| Label | Color | Purpose |
|-------|-------|---------|
| `agent-ready` | `#0E8A16` | Approved for Autonomous Dispatcher (or manual `/momentum-run` Automation) |
| `agent-running` | `#5319E7` | Cloud agent actively implementing |
| `agent-review` | `#FBCA04` | PR open; awaiting human merge |
| `agent-failed` | `#B60205` | Agent/run failed; needs triage |
| `needs-human` | `#D93F0B` | Agent stopped; architecture/product decision required |
| `dogfood` | `#1D76DB` | Phase 1 daily-diary / founder use |
| `p0` | `#B60205` | Skeleton / blocking |
| `p1` | `#FBCA04` | Daily diary epic |

Issue body should include `## Acceptance` checklist. Optional: `Depends-on: #N`. See `docs/AUTONOMOUS-DEVELOPMENT.md`.

Keep Cursor Automation **Momentum agent-ready** Inactive while the GitHub Actions dispatcher is the primary launcher (avoids duplicate agents).
