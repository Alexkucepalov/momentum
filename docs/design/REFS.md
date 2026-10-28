# Design references

**Canonical shell:** Nutrition Soft Light — see [`CONTRACT.md`](CONTRACT.md).  
Audit: [`docs/quality/DESIGN-RESET-AUDIT.md`](../quality/DESIGN-RESET-AUDIT.md).

| File | Role under the contract |
|------|-------------------------|
| [`refs/07-nutrition-light.png`](refs/07-nutrition-light.png) | **Etalon** — canvas, cards, calorie hero, macros, list rows, black FAB. |
| [`refs/08-wellness-home-light.png`](refs/08-wellness-home-light.png) | Soft header / spacing cue for Today (compose under 07). |
| [`refs/09-soft-onboarding-mono.png`](refs/09-soft-onboarding-mono.png) | Circular glyphs + black pill CTA. |
| [`refs/01-home-light.png`](refs/01-home-light.png) | Today job density — under 07. |
| [`refs/04-weight-log-dark.png`](refs/04-weight-log-dark.png) | Dark **log sheet** only. |
| [`refs/05-workouts-bento-dark.png`](refs/05-workouts-bento-dark.png) | Metric density → light `BentoStat`, not dark tab shell. |
| [`refs/10-activity-neumorph-bento.png`](refs/10-activity-neumorph-bento.png) | **Not a shell** — do not reintroduce neumorph masonry. |
| [`refs/06-pacefuel-dark.png`](refs/06-pacefuel-dark.png) | Density cue only — no glow/3D. |

## Rules

1. One system (`CONTRACT.md`). No parallel Pinterest languages.
2. Raised UI → `AppCard`. Metrics → `BentoStat`. Rows → `ListRow`.
3. ≤1 black primary CTA per job. Coral = today / trend only.
4. No invented nutrition values or metrics.
