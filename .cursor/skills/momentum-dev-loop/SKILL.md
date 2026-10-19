---
name: momentum-dev-loop
description: >-
  Implements one Momentum GitHub issue end-to-end: branch, code, tests, verify,
  PR with checklist. Use for agent-ready issues, Cloud Automations, dogfood
  feature work, or when the user asks to run the Momentum development loop.
---

# Momentum development loop

## Preconditions

1. Read `AGENTS.md`, `docs/17-DEV-PLAN.md` (Backlog row for this issue), and the issue body / linked `prompts/*.md`.
2. Confirm scope is a single issue. If ambiguous → stop, ask or mark `needs-human`.

## Loop

1. **Branch** from latest `main`: `feat/<issue-number>-short-slug` (or `fix/` / `chore/`).
2. **Implement** only acceptance criteria. Preserve `unknown ≠ 0`; no invented kcal; offline-first; synthetic fixtures only.
3. **Tests** for domain/pure logic; UI gets a11y labels and manual screenshot notes.
4. **Verify**: `npm run verify`. Do not claim green without running it.
5. **PR**: title = issue intent; body = Summary + Test plan + AGENTS checklist; link issue. Never merge.
6. **CI feedback**: at most **2** fix-push cycles for failures caused by this PR. Then comment blocker and stop.

## Report format (end of run)

- Changed files (paths)
- Commands run + pass/fail
- Screenshots / how to demo (UI)
- Risk + rollback
- Scope deviations / open questions

## Hard stops

- Merge to `main`, secrets, Play publish, production credentials
- Unbounded agent loops or spend beyond configured limits
- Reading/writing real personal health records into prompts or fixtures
