# Design references

**Единый эталон shell:** Nutrition Soft Light — [`refs/07-nutrition-light.png`](refs/07-nutrition-light.png)  
Контракт: [`docs/quality/DESIGN-RESET-AUDIT.md`](../quality/DESIGN-RESET-AUDIT.md) §5.

Остальные PNG — **узкие паттерны**, не параллельные системы.

| File | Allowed use |
|------|-------------|
| [`07-nutrition-light.png`](refs/07-nutrition-light.png) | **Shell etalon:** canvas, cards, calorie hero, macros, list rows, black FAB. |
| [`08-wellness-home-light.png`](refs/08-wellness-home-light.png) | Soft header / spacing density on Today only. |
| [`09-soft-onboarding-mono.png`](refs/09-soft-onboarding-mono.png) | Circular glyphs + black pill CTA. |
| [`01-home-light.png`](refs/01-home-light.png) | Today jobs (weight / nutrition / log) — compose under 07. |
| [`04-weight-log-dark.png`](refs/04-weight-log-dark.png) | Focused **dark** log sheet only. |
| [`05` / `03` workouts-bento](refs/05-workouts-bento-dark.png) | Metric density cue — light `BentoStat`, not dark shell. |
| [`10-activity-neumorph-bento.png`](refs/10-activity-neumorph-bento.png) | **Deprecated as shell** — do not reintroduce neumorph masonry. |
| [`06-pacefuel-dark.png`](refs/06-pacefuel-dark.png) | Density only — no glow/3D. |

## Rules

1. One visual system app-wide. Rebuild components — don’t wrap legacy rows.
2. Light shell everywhere except focused dark log sheets.
3. ≤1 black primary CTA / FAB per job. Coral = today / trend only.
4. Primitives: `apps/mobile/src/ui/` (`AppCard`, `ListRow`, `BentoStat`, `CalorieHero`, `Fab`, …).
5. No invented metrics or nutrition values.
