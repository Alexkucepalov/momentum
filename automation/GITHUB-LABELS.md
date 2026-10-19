# GitHub labels for agent workflow

Create these labels in the private repo (Settings → Labels or `gh label create`):

| Label | Color | Purpose |
|-------|-------|---------|
| `agent-ready` | `#0E8A16` | Triggers Cursor Automation to open implementation PR from issue |
| `needs-human` | `#D93F0B` | Agent stopped; architecture/product decision required |
| `dogfood` | `#1D76DB` | Phase 1 daily-diary / founder use |
| `p0` | `#B60205` | Skeleton / blocking |
| `p1` | `#FBCA04` | Daily diary epic |

Issue body should link the matching file under `prompts/` and acceptance criteria from `docs/17-DEV-PLAN.md`.
