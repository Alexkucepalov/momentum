# nf-fit — Visual design system (Minimal Soft Utility)

**Product:** nf-fit  
**Source of truth (runtime):** `apps/mobile/src/design-system/tokens.ts`  
Legacy import path `apps/mobile/src/theme/tokens.ts` re-exports the same tokens.

Older teal/gold and multi-skin dark-bento drafts are **obsolete** for the default skin.

## Tone

Calm, capable, private. Light neutral canvas, white surfaces, black ink, sparse coral/red accent. No shame/guilt colors as “failure.”

## Color tokens

| Token | Hex | Use |
|-------|-----|-----|
| canvas / background | `#F3F4F6` | Screen |
| surface | `#FFFFFF` | Cards / sheets |
| ink / text | `#000000` | Primary copy |
| textSecondary | `#6B7280` | Supporting |
| textMuted | `#9CA3AF` | Hints |
| accent | `#E4574D` | Sparse highlight / alert / active day |
| accentSoft | `#FCECEA` | Soft accent fills |
| primaryButton | `#000000` | Primary CTA fill |
| primaryButtonText / textOnInverse | `#FFFFFF` | On black |
| border | `#E5E7EB` | Hairlines |
| danger | `#B42318` | Destructive only |
| success / successSoft | `#16A34A` / `#D4EDDA` | Positive / soft badge |
| protein / fat / carbs | green / amber / blue | **Always labeled** — never color-only |
| warning | `#FBBF24` | Scanner affordances |
| shadow | `#000000` | Elevation tint (near-flat) |

## Type / space / radius

- type: metric **36** / hero 34 / title 22 / subtitle 17 / body 15 / caption 13 / label 11 (uppercase labels ok)
- space: 4 / 8 / 12 / 16 / 24 / 32
- radius: sm 10 / md 14 / card **24** / xl 28 / pill 999
- touchMin: **48**
- elevation: hairline or subtle shadow only

## Primitives (Phase 0)

`Screen`, `AppText`, `AppCard`, `AppButton`, `MetricCard` under `apps/mobile/src/design-system/`.

Prefer these for new shell UI. Existing feature components may keep local styles while migrating to tokens.

## Accessibility

Numeric entry focusable; TalkBack labels on CTAs; macros labeled; unknown nutrients never rendered as `0`; reduced motion: no required animations for logging.

## Forbidden (default skin)

Neumorphism · glow · 3D buttons · random gradients · mixed dark-bento + pastel skins per tab · inventing nutrition values for demos.
