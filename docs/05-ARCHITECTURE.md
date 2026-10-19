# Technical architecture (incremental)
## v0.1: local first, no backend required
Expo React Native + Expo Router; TypeScript strict; SQLite (`expo-sqlite`) for journal and domain objects; TanStack Query only for remote APIs in next version; pure domain package `src/domain/nutrition.ts` built now.
All edits write transactionally to local SQLite; journal is canonical for device; UI derives daily aggregations via selectors. Stable UUIDs, created_at/updated_at/deleted_at and timezone-aware day key.

## Upgrade path
Optional Supabase Auth + Postgres remote sync; backend Fastify or NestJS with scoped APIs, row-level authorization, idempotency keys, versioned records and outbox. Server is not required for anonymous offline mode. Conflicts: independent records merge by ID; simultaneous edits flagged for review, not silently overwritten. No background unprompted cloud upload.

## Folders (target after bootstrap)
apps/mobile/app; apps/mobile/src/{components,features,navigation,storage,integrations}; src/domain; packages/shared (future); backend (future). Avoid premature monorepo complexity.

## Data flows
User add -> validate with Zod -> SQLite transaction -> update local selectors -> optional sync outbox -> server acknowledgement.
Barcode -> on-device scan -> local index -> cached OFF proxy/query with rate limits -> product preview -> user confirms -> snapshot in FoodEntry.
Workout import -> native/user file -> normalize units -> source/external ID -> dedupe -> preview -> persisted workout.
AI (opt-in) -> redact/limit user context -> orchestrator with scoped tools -> typed proposal -> human confirmation -> domain validation -> DB write.

## Tradeoffs
Avoid remote-first architecture that fails on poor connectivity. SQLite migration versioning and Android backup controls are mandatory. Use hosted remote CI/EAS; do not expose service credentials in Expo client. Runtime frameworks should be checked against latest Expo SDK and Android API 36 in bootstrap PR.
