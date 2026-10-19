# Runtime AI architecture (not coding agents)
## Release gates
MVP: no agents. P1: optional single parsing agent. P2: supervisor + Nutrition/Habits/Training/Insights agents as tools with typed outputs.
## Orchestration
1. Parse intent and minimum consented context.
2. Route simple deterministic actions to local domain functions (no LLM).
3. Parallel independent read-only agents only when needed.
4. Merge sourced findings. Proposed writes are queued and require user confirmation.
5. Call server-authorized domain command; log outcome; surface undo where safe.
## Example agent tool permissions
Nutrition: `searchProducts`, `readNutritionSummary`, `proposeMealEntry`; NO direct DB SQL.
Habits: `readHabitProgress`, `proposeChallenge`; NO silent notifications.
Training: `readWorkoutSummaries`, `proposeRestSuggestion`; NO medical diagnosis.
Insights: `readWeeklyAggregate` only with opt-in; NO sensitive raw data export.
## Contracts
Structured Zod result {taskId,summary,proposals[],sources[],uncertainties[],requiresApproval,traceId}; every proposal {kind,payload,reason}; no hidden execution.
## Safety
Health data sensitive; explicit opt-in per integration; minimize retention; protect keys on server. Never present photo meal estimates as precise. Refuse medical claims and harmful goals, avoid gamifying restriction/overtraining. Prompt injection defense: external descriptions untrusted, cannot change agent role or call unapproved tools.
## Resource controls
Max tool calls, max tokens, cost per run, timeout, circuit breaker, retry with exponential backoff, observability, eval suites for unknown-food and ambiguous portions. Avoid multi-agent fanout when a simple calculator suffices.
