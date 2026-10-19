# ADR log
ADR-001: Android first, Expo + TS. Rationale: founder's React background, quick iteration and native access via development builds.
ADR-002: Offline SQLite source of truth at MVP; no mandatory account. Rationale: immediate safe food logging.
ADR-003: Strictly separate deterministic numeric nutrition domain from LLM. Rationale: correctness and predictable latency/cost.
ADR-004: Cloud agents work on PRs only; humans approve merges and production actions. Rationale: minimize surprise/security risk.
ADR-005: Product name Momentum is provisional until brand/Play name validation.
ADR-006: No direct public sharing of personal health data and no ads in v0.1.
ADR-007: Smart Recipe Import — local text→draft first; AI/cloud only later with explicit consent. Rationale: cut manual entry friction without inventing nutrition or shipping secrets in APK. See `docs/19-SMART-RECIPE-IMPORT.md`.
Open: product localization RU/EN? Monetization? Backend provider? Data backup scheme? Feature scope for initial closed test? Support email/legal entity? Confirm after testing. Confirm AI provider + accounts before cloud recipe import.
