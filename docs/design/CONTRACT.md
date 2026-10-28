# Nutrition Soft Light — design contract (PR-A)

**Source of truth:** [`docs/quality/DESIGN-RESET-AUDIT.md`](../quality/DESIGN-RESET-AUDIT.md) §5  
**Runtime tokens:** [`apps/mobile/src/theme/tokens.ts`](../../apps/mobile/src/theme/tokens.ts)  
**Primitives:** [`apps/mobile/src/ui/`](../../apps/mobile/src/ui/)

This is the **only** shell language for Momentum. Moodboard PNGs in `refs/` are pattern cues, not alternate systems.

## Surfaces & color

| Token | Value | Use |
|-------|-------|-----|
| `colors.background` | `#F5F5F5` | Screen canvas |
| `colors.surface` | `#FFFFFF` | Raised cards, light sheets |
| `colors.text` | `#111111` | Primary copy |
| `colors.textSecondary` | `#6B7280` | Supporting copy |
| `colors.textMuted` | `#9CA3AF` | Meta / captions |
| `colors.primaryButton` | `#111111` | Primary CTA fill |
| `colors.primaryButtonText` | `#FFFFFF` | On primary |
| `colors.focus` | `#EF6E58` | Today marker / week trend **only** |
| `colors.protein` / `carbs` / `fat` | as in tokens | Always with text labels |
| `colors.darkBg` | `#000000` | Focused log sheets (e.g. weight) **only** |

Forbidden as shell: neumorphism, glow, 3D, purple brand wash, competing card elevations.

## Space / radius / type / touch

- **space:** 4 / 8 / 12 / 16 / 24 / 32  
- **radius:** `sm` 12 · `md` 16 · `lg` 20 · **`xl` 24 (default card)** · `pill` 999 · `xxl` reserved rare hero (not default)  
- **type:** hero 34 · title 24 · subtitle 17 · body 15 · caption 13 · micro 11  
- **touchMin:** 48  

## Elevation

One raised style: `elevation.card` (soft, opacity ≤ 0.06). Tab bar uses `elevation.tabBar`.

## Canonical primitives

| Role | Component | Location |
|------|-----------|----------|
| Raised surface | **`AppCard`** | `src/ui/AppCard` |
| List row inside cards | **`ListRow`** | `src/ui/ListRow` |
| Metric cell | **`BentoStat`** (+ `BentoRow`) | `src/ui/BentoStat` |
| Section header | **`SectionTitle`** | `src/ui/SectionTitle` |
| Primary / secondary CTA | **`PrimaryButton`** | `src/components/PrimaryButton` |
| Empty state | **`EmptyState`** | `src/components/EmptyState` (uses `AppCard`) |

Screen-specific (keep; do not fork styles): `CalorieHero`, `MacroGrid`, `Fab`, `SoftHeader`, `InverseStrip` — compose on tokens/`AppCard`.

## Deprecation / migration

| Legacy | Status | Path |
|--------|--------|------|
| `surfaceCard` style object | **Deprecated** | Prefer `<AppCard />`. Alias kept in tokens for gradual call-site migration (no blanket replace required in PR-A). |
| `SoftMetricCard` | **Deprecated** | Alias → `BentoStat`. New code must import `BentoStat`. |
| `SectionHeader` | **Compat wrapper** | Re-exports `SectionTitle` API. Prefer `@/src/ui/SectionTitle`. |

## CTA hierarchy

- At most **one** black primary job per screen (`PrimaryButton` primary · or `Fab` · or one inverse strip).  
- Secondary actions: `PrimaryButton` `variant="secondary"` (text) or quiet links — never a second black pill for the same job.

## Out of scope for PR-A

Screen redesigns (Today / Activity / Plan / Recipes / sheets) belong to **PR-B+**. Food remains the visual etalon and is not redesigned here.

## Android

Contract does **not** claim Android Pass. Device/IME/safe-area verification is separate from Expo web.
