# Design references (mandatory)

Ориентир, не pixel-copy. Нет рефа экрана → повторяй **паттерн**, не клеи обёртку.

| File | Role |
|------|------|
| [`refs/01-home-light.png`](refs/01-home-light.png) | Today / shell: soft light canvas, coral today, black pills, Start/Log. |
| [`refs/07-nutrition-light.png`](refs/07-nutrition-light.png) | **Primary list language:** calorie hero + 3 macro cards + food rows (icon · name · P/C/F pills · kcal) + black FAB. |
| [`refs/04-weight-log-dark.png`](refs/04-weight-log-dark.png) / [`02`](refs/02-weight-log-dark.png) | Focused log sheets: black canvas, large number, white Log pill, recent rows. |
| [`refs/05-workouts-bento-dark.png`](refs/05-workouts-bento-dark.png) / [`03`](refs/03-workouts-bento-dark.png) | Progress/Activity density: bento, hero metrics, heatmap, volume strip. |
| [`refs/06-pacefuel-dark.png`](refs/06-pacefuel-dark.png) | Density cue only (data hierarchy) — не копировать 3D/glow. |

## Global rules

1. Rebuild **components**, don’t wrap old rows in `surfaceCard`.
2. Light shell for Today / Food / Plan / Profile. Dark only for focused log sheets.
3. One black primary CTA / FAB per job. Coral = today / trend only.
4. Shared primitives live in `apps/mobile/src/ui/`.
