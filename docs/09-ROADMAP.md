# Roadmap & backlog (sequence not promises)
## Phase 0 — skeleton / 3–5 working sessions
P0-01 Expo Android scaffold targeting API 36-compatible SDK, Router, lint/typecheck/tests; verify EAS. AC: app opens Android emulator/device.
P0-02 Domain nutrition library & unit tests. AC: per100g/recipe cooked yield calculations, unknown fields, bad input.
P0-03 Local SQLite schema and migrations. AC: restart and offline edits persist.
## Phase 1 — daily diary
P1-01 Today / Food / Activity / Progress navigation.
P1-02 Manual products & custom kcal/macros.
P1-03 Food diary add/edit/delete/undo by local day.
P1-04 Recents and favorites one-tap flow.
P1-05 Recipe builder with cooked yield.
P1-06 Local export/delete and accessibility tests.
**Gate**: founder uses daily for 14 days without spreadsheet backup.
## Phase 2 — enrichment
P2-01 Barcode scanner + local fallback.
P2-02 OFF caching, error handling, source attribution.
P2-03 Habit and flexible challenge engine.
P2-04 Workout manual tracker and progress charts.
**Gate**: 8 external user tests, usability issues triaged.
## Phase 3 — integrations
P3-01 Health Connect read consent and selective scopes.
P3-02 FIT/GPX/TCX import + workout dedupe.
P3-03 Optional sync design/implementation.
P3-04 AI natural language parser with confirmation.
## Phase 4 — Google Play
P4-01 Privacy policy, deletion/export, data safety & health declaration.
P4-02 Crash and accessibility audit, emulator/device suite.
P4-03 Store artwork, listing and signed AAB.
P4-04 Internal -> closed test 12 opted-in 14 days if personal account qualifies -> access request -> production manually.
## Do not parallelize
Storage schema before diary features; privacy design before health access; tested recipe calculations before AI estimation.
