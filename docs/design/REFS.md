# Design references

**Canonical shell:** Nutrition Soft Light — see [`CONTRACT.md`](CONTRACT.md).  
Audit: [`docs/quality/DESIGN-RESET-AUDIT.md`](../quality/DESIGN-RESET-AUDIT.md) · Kit: [`MOMENTUM-UI-KIT.md`](MOMENTUM-UI-KIT.md).

## Repo etalons

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

## User moodboard 2026-10-29

| File | Role |
|------|------|
| [`refs/user-2026-10-29/05-light-gray.png`](refs/user-2026-10-29/05-light-gray.png) | **Shell cue** — light gray canvas + content density |
| [`refs/user-2026-10-29/06-soft-white.png`](refs/user-2026-10-29/06-soft-white.png) | **Shell cue** — soft white surfaces / quiet chrome |
| [`refs/user-2026-10-29/04-bw-square.png`](refs/user-2026-10-29/04-bw-square.png) | Contrast / black primary CTA language |
| [`refs/user-2026-10-29/01-dark-phone.png`](refs/user-2026-10-29/01-dark-phone.png) | Dark **sheet** only (with ref 04) |
| [`refs/user-2026-10-29/02-dark-contrast.png`](refs/user-2026-10-29/02-dark-contrast.png) | Dark sheet density / white on black |
| [`refs/user-2026-10-29/03-warm-taupe.png`](refs/user-2026-10-29/03-warm-taupe.png) | **Ban as shell** — cream/taupe competing language |

## Rules

1. One system (`CONTRACT.md`). No parallel Pinterest languages.
2. Raised UI → `AppCard`. Metrics → `BentoStat`. Rows → `ListRow`.
3. ≤1 black primary CTA per job. Coral = today / trend only.
4. No invented nutrition values or metrics.
5. Dark = focused WeightLog (and equivalent log sheets) only — never tab shells.
