# UI primitives — migration (PR-A)

| Prefer | Avoid |
|--------|--------|
| `AppCard` | Spreading `surfaceCard` into new Views |
| `BentoStat` | `SoftMetricCard` (deprecated alias) |
| `SectionTitle` (`@/src/ui`) | New `SectionHeader` imports (compat only) |
| `ListRow` | Ad-hoc row StyleSheets for food/plan lists |
| `PrimaryButton` (+ `variant="secondary"`) | Second black pill for the same job |
| `EmptyState` | Custom empty cards copying elevation |

Screen migrations are **PR-B+**. Do not blanket-replace call sites in PR-A.
