# Founder weekly operating model
- Mondays: inspect issue board and AI/CI failure summary; select at most 2 `agent-ready` issues.
- Midweek: asynchronous agent PR creation + CI + review. No agent-generated production merge.
- Weekends: 30–60 min app dogfood + video PR reviews; capture friction points.
- Monthly: privacy/security/policy/dependency audit; cost limits and scope review.
## Access setup
GitHub linked to Cursor cloud; code agent access scoped to repo, no production secrets. Expo access token in GitHub secret only when build configured. Never upload personal user data as fixture.
## Definition of done
Acceptance checks pass; developer preview on Android; accessible UX; offline case; audit of data changes; screenshots/videos and PR review; docs updated.
## Failure handling
Red CI: agent can propose a fix PR; do not rerun expensive loops indefinitely. Cloud service unavailable: next scheduled run can resume; project remains reproducible locally. If EAS fails, keep tag/artifacts and revert via manual action.
