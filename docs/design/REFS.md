# Design references (mandatory)

Canonical moodboard for Momentum UI. Do not invent a parallel language.

| File | Role |
|------|------|
| [`refs/01-home-light.png`](refs/01-home-light.png) | **Shell + Today.** Light gray canvas, white soft cards (~24px radius), coral accent for “today” / trends, black pill CTAs, week day circles, kcal ring + macros split, two action cards (Start / Log), floating tab bar with circled active icon. |
| [`refs/02-weight-log-dark.png`](refs/02-weight-log-dark.png) | **Focused log sheets.** Pure black modal, large title, white pill primary (“Log”), wheel / large number input, recent list rows. |
| [`refs/03-workouts-bento-dark.png`](refs/03-workouts-bento-dark.png) | **Progress density.** Bento grid, hero metrics, activity heatmap dots, volume strip. Adapt hierarchy to light shell when on Progress/Activity; keep dark only for focused log sheets. |

## Rules

1. One job per viewport; one black primary CTA.
2. Coral (`focus`) only for today / positive trend — never for primary buttons.
3. Cards: white surface + soft elevation, no square Nothing chrome / GlyphDots / uppercase kickers.
4. Tab bar: white floating chrome; active icon in a circle.
