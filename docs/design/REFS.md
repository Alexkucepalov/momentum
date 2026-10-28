# Design references (mandatory)

Ориентир, не pixel-copy. Нет рефа экрана → повторяй **паттерн**, не клеи обёртку.

| File | Role |
|------|------|
| [`refs/09-soft-onboarding-mono.png`](refs/09-soft-onboarding-mono.png) | Soft mono: floating cards, circular icon tiles, stacked soft list rows, black pill CTA. |
| [`refs/10-activity-neumorph-bento.png`](refs/10-activity-neumorph-bento.png) | **Activity masonry:** large ring metric + small soft cells, mono rings/charts, FAB. |
| [`refs/08-wellness-home-light.png`](refs/08-wellness-home-light.png) | Soft shell: oversized radii, greeting, inverse strip, 2-col wellness bento. |
| [`refs/01-home-light.png`](refs/01-home-light.png) | Today density cue — compose with 08/09 softness. |
| [`refs/07-nutrition-light.png`](refs/07-nutrition-light.png) | Food list: calorie hero + macros + rows + black FAB. |
| [`refs/04-weight-log-dark.png`](refs/04-weight-log-dark.png) / [`02`](refs/02-weight-log-dark.png) | Focused dark log sheets. |
| [`refs/05-workouts-bento-dark.png`](refs/05-workouts-bento-dark.png) / [`03`](refs/03-workouts-bento-dark.png) | Density cue for Progress (dark bento). |
| [`refs/06-pacefuel-dark.png`](refs/06-pacefuel-dark.png) | Density only — no 3D/glow copy. |

## Global rules

1. Rebuild **components**, don’t wrap old rows in `surfaceCard`.
2. Light shell for Today / Food / Plan / Profile / Activity. Dark only for focused log sheets.
3. One black primary CTA / FAB per job. Coral = today / trend only (not Activity mono rings).
4. Soft language = large radii + diffused shadow + icon tiles (refs 08–10).
5. Shared primitives live in `apps/mobile/src/ui/`.
6. No invented metrics (no fake steps/goals) — rings use real local data only.
