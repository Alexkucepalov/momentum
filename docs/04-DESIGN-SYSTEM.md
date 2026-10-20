# Visual design system (runtime-aligned)

**Source of truth:** `apps/mobile/src/theme/tokens.ts` (Nothing-inspired light mono).  
Older teal/gold draft is **obsolete** — do not reintroduce `#208C74` as brand primary.

## Tone

Calm, capable, private. Black CTAs on light gray. No shame/guilt colors as “failure.”

## Color tokens

| Token | Hex | Use |
|-------|-----|-----|
| background | `#F4F5F7` | Screen |
| surface | `#FFFFFF` | Cards / sheets |
| text | `#111111` | Primary copy / accent |
| textSecondary | `#6B7280` | Supporting |
| textMuted | `#9CA3AF` | Hints |
| accentSoft | `#E8EAED` | Soft fills |
| primaryButton | `#111111` | Primary CTA fill |
| primaryButtonText / textOnInverse | `#FFFFFF` | On black |
| border | `#E5E7EB` | Hairlines |
| danger | `#B42318` | Destructive only |
| success / successSoft | `#16A34A` / `#D4EDDA` | Positive / soft badge |
| protein / fat / carbs | green / amber / blue | **Always labeled** — never color-only |
| warning | `#FBBF24` | Scanner affordances |
| shadow | `#000000` | Elevation tint |

## Type / space / radius

- type: 34 / 22 / 17 / 15 / 13 / 11  
- space: 4 / 8 / 12 / 16 / 24 / 32  
- radius: 10 / 14 / 18 / 24 / pill  
- touchMin: **48**

## Components (prefer)

`PrimaryButton`, `EmptyState`, `FlashBar`, `UndoBar`, `ScreenFooter`, `SwipeToDismissSheet`, `FormScrollView`, `KcalRing`, `MacroStrip`.

## Accessibility

Numeric entry focusable; TalkBack labels on CTAs; macros labeled; reduced motion: no required animations for logging.
