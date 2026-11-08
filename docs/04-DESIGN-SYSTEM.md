# nf-fit / Momentum — Visual design system (Premium Minimal Utility)

**Product:** nf-fit (UI may still say Momentum)  
**Source of truth (runtime):** `src/design-system/tokens.ts` → `apps/mobile/src/design-system/tokens.ts`  
**Proposal / rationale:** `docs/DESIGN-SYSTEM.md`  
Legacy import path `apps/mobile/src/theme/tokens.ts` **only re-exports** the same tokens — do not fork.

Older teal/gold, coral chrome, and multi-skin dark-bento drafts are **obsolete**.

## Tone

Calm, capable, private. Light neutral canvas, white surfaces, black ink, sparse mono accent. No shame/guilt colors as “failure.”

## Color tokens (runtime)

| Token | Hex | Use |
|-------|-----|-----|
| canvas / background | `#F2F3F5` | Screen |
| surface | `#FFFFFF` | Cards / sheets |
| surfaceMuted | `#EBEDF0` | Nested tracks / chips |
| ink / text / primary | `#0A0A0A` | Primary copy / CTA |
| onPrimary / primaryButtonText | `#FFFFFF` | On black |
| textSecondary | `#5C6370` | Supporting |
| textMuted | `#646B78` | Hints (≥4.5:1 on canvas) |
| accent / accentSoft | `#0A0A0A` / `#EBEDF0` | Selected day / soft fill |
| border / borderStrong | `#E2E5EA` / `#C9CED6` | Hairlines / focus |
| danger | `#B42318` | Destructive only |
| success / successSoft | `#15803D` / `#DCF5E4` | Positive / soft badge |
| protein / fat / carbs | green / amber / blue | **Always labeled** |
| warning | `#D97706` | Scanner affordances |

Compat aliases: `primaryButton` → same as `primary`.

## Type / space / radius

- type: metric **36** / hero 34 / title 22 / subtitle 17 / body 15 / caption 13 / label 11
- space: 4 / 8 / 12 / 16 / 24 / 32 / 48(`section`)
- radius: sm 8 / md 12 / lg·card **16** / xl 24 / pill 999
- touchMin: **48**
- elevation: hairline or subtle card elevation only

## Primitives

Under `apps/mobile/src/design-system/`:

`Screen`, `AppText`, `AppCard`, `AppButton`, `MetricCard`, `Field`, `Chip`, `SegmentedControl`, `ChartFrame`, `ErrorBanner`, `LoadingState`.

`PrimaryButton` is a **deprecated** wrapper around `AppButton` — new code must import `AppButton`.

`EmptyState` (shared components) uses `AppButton`.

## Rules for agents / PRs

1. No new hex colors outside `src/design-system/tokens.ts`.
2. One primary CTA per fold; prefer `AppButton`.
3. Unknown metrics render as `—`, never as `0`.
4. One design language across all tabs — no per-tab skins.
5. `TAB_SHELL`: today / food / movement / progress / profile (Sleep inside Movement).

## Accessibility

Numeric entry focusable; TalkBack labels on CTAs; macros labeled; reduced motion: no required animations for logging.

## Forbidden

Neumorphism · glow · 3D buttons · random gradients · mixed dark-bento + pastel skins per tab · inventing nutrition values for demos · purple/coral product chrome.
