# Design System Audit

## Source of truth conflict

| Source | Palette | Status |
|--------|---------|--------|
| `apps/mobile/src/theme/tokens.ts` | Mono black `#111`, gray bg `#F4F5F7` | **Runtime truth** |
| `docs/04-DESIGN-SYSTEM.md` | Teal `#208C74`, warm gold | **Stale draft** |
| UX docs Food Planner | Nothing-inspired B/W | Aligns with code |

**P2 action:** Rewrite `04-DESIGN-SYSTEM.md` to match tokens; mark teal doc obsolete.

---

## Current tokens (code)

```
colors: background, surface, text, textSecondary, textMuted,
        accent(=text), accentSoft, primaryButton, border, danger,
        protein/fat/carbs, ring*, success, preview
space: 4 / 8 / 12 / 16 / 24 / 32
radius: 10 / 14 / 18 / 24 / pill
type: 34 / 22 / 17 / 15 / 13 / 11
touchMin: 48
```

### Gaps

| Gap | Evidence | Rec |
|-----|----------|-----|
| Hardcoded hex outside tokens | e.g. historical `#E8F5E9`, shadows `#000` in screens | Sweep → tokens |
| `preview` indigo soft | Unused aesthetic drift | Keep or remove |
| Macro colors | OK if always labeled | Audit color-only meaning |
| No elevation token | Ad-hoc shadow* on cards | Optional `elevation.sm` |
| No motion tokens | — | Defer |
| Docs component list | AppHeader, NutritionSummary… | Many renamed/missing |

---

## Component inventory vs duplication

| Pattern | Implementations | Unify? |
|---------|-----------------|--------|
| Empty | `EmptyState` | Prefer always |
| Primary CTA | `PrimaryButton` | Yes (+ hint support landed #33) |
| Flash | `FlashBar` | OK |
| Undo | `UndoBar` | OK |
| Sheets | `SwipeToDismissSheet`, centered modals | Document when which |
| Chips | MealChips, filter chips, JourneyShortcuts, scope chips | Shared `Chip` **only if** 3+ more copies |
| Cards | Inline StyleSheet everywhere | Light `SurfaceCard` optional |
| Section titles | `SectionHeader` + local `sectionLabel` | Prefer SectionHeader |
| Date nav | `DayStrip` vs `DateSwitcher` | **Duplicate concept** — merge P2 |

---

## Interaction states

| Control | Pressed | Disabled | Selected | Notes |
|---------|---------|----------|----------|-------|
| PrimaryButton | opacity | opacity 0.4 | — | OK |
| Tab bar | tint | — | focused icon | OK |
| Filter chips | — | — | bg accent | Verify contrast on selected (**H**) |
| Checkbox cards | — | blocked opacity | border | import-personal |

---

## Accessibility

| Rule | Status |
|------|--------|
| touchMin 48 | Declared; some chips still 36 (`JourneyShortcuts`) | **E** |
| TalkBack labels | Partial on main controls | Need device pass **H** |
| Dynamic type | System font; no maxFontSizeMultiplier audit | **H** |
| Contrast textMuted on bg | May fail WCAG for micro text | **H** measure |
| Color-only macros | Labels present in ring/strips | Mostly OK |

---

## Minimal scalable system (proposed — no code yet)

1. **One doc = tokens.ts** + short usage table.
2. **Primitives:** Text (roles), Button (primary/secondary/ghost), Chip, Surface, ListRow, Sheet, Empty, Flash.
3. **Rules:** no new hex in screens; chips ≥44 height; one primary CTA per viewport; no card-in-card.
4. **Do not** build a mega UI kit before Quality Sprint item «Navigation & DS».

---

## Nothing-inspired fit

Code already mono + strong type hierarchy. Risks: too many pill chips and bordered cards → visual noise (Today). Prefer fewer surfaces, more type weight for hierarchy — not more boxes.
