# One-time setup by owner (required before autonomous work)

## GitHub
- [x] Create GitHub private repository (`Alexkucepalov/momentum`); push this package.
- [ ] Enable main branch protection: require PR, require CI job `verify`, no force-push — **needs GitHub Pro** on private repos (403 on free). Soft rules via AGENTS until then.
- [x] Create labels from `automation/GITHUB-LABELS.md`.

## Cursor Cloud
- [ ] Link GitHub repository to Cursor Cloud Agents (cursor.com/agents).
- [ ] Configure Cloud Agent spend/resource limits; **no** production credentials / Play / EAS prod tokens.
- [ ] Create **4** Cursor Automations from `automation/cursor-prompts.md`:
  1. PR review (PR opened/synchronized)
  2. Issue label `agent-ready` → implement + PR
  3. Nightly triage (cron `0 2 * * *` or weekday 09:00)
  4. Pre-release review (manual)
- [ ] Triggers are NOT provisioned by the markdown files — paste in Automations UI.

## Product / store (later)
- [ ] Configure Expo project, Android package identifier, first local EAS build, signing credentials.
- [ ] Add `EXPO_TOKEN` GitHub Actions secret; manually dispatch Android staging workflow.
- [ ] Create Play developer account and testing group.
- [ ] Verify privacy policy and health declaration before closed testing.

## Daily founder ritual (5–15 min)
- Merge green agent PRs after screenshots/AC check.
- Keep ≤2 issues with `agent-ready` in flight.
- Never paste real health diaries into Cloud prompts.
