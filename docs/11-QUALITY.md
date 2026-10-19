# Quality strategy
## Unit
Numerical properties: portion scaling, cooked recipe yield, macro accumulation, null nutrition handling, monotonic scaling, malformed negative/NaN rejection, kcal/macros discrepancy.
## Integration
SQLite transactions and migrations; date keys across timezone and daylight saving; import duplicate matching; offline sync outbox idempotence and retry.
## E2E
Android emulators + real midrange Android phone. Onboarding skip, entry in airplane mode, recipe and quick repeat, permissions denied, screen reader, process kill/restart, backups.
## Nonfunctional target proposals
Warm start under 2 sec on reference phone; local add screen interactive under 300ms; 0 network calls for manual add; no data loss under process restart; safe rollback for schema migrations.
## Security
No credentials/mobile client, permissions scoped to purpose, privacy threat model before sync, never log nutritional details/weight in CI telemetry, dependency and secret scans, no prod fixtures in PRs.
## Mandatory PR evidence
Acceptance criteria checklist, passing CI, before/after screenshots for UI, known limitations, data/privacy impact statement, manual test steps, fallback.
