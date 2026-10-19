# Momentum — product & engineering starter kit
Status: **Expo Android dogfood app under `apps/mobile` + pure TypeScript nutrition/storage domain**. Not a Play Store release.

## Product
Privacy-first, low-friction Android-first nutrition, habits, challenges and fitness tracker. Offline-first; AI is optional and never required to log food.

## Start here
1. Read `docs/00-NAVIGATION.md`, `docs/17-DEV-PLAN.md`, `docs/01-PRD.md`, `AGENTS.md`.
2. Install Node 24 and run `npm install && npm run verify`.
3. Mobile app:
   ```bash
   cd apps/mobile && npm install && npx expo start
   ```
4. Automation setup tracker: `automation/setup-status.md` (GitHub protection + Cursor Automations are human one-time steps).
5. Connect Expo EAS manually before Android store builds; never commit secrets.

## Boundaries
Do not expose user health data in AI prompts by default. No credentials in git. PR only for agent-generated changes. No autonomous production publication or database migrations.
