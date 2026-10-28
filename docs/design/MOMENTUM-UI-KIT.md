# Momentum UI Kit — Nutrition Soft Light

**Source of truth:** [`CONTRACT.md`](./CONTRACT.md) · tokens `apps/mobile/src/theme/tokens.ts` · primitives `apps/mobile/src/ui/`

Moodboard PNGs in `refs/` are cues, not alternate systems. Weight log sheet may use **dark** tokens; tab shell stays light.

---

## Tokens

| Category | Values / rules |
|----------|----------------|
| Canvas | `colors.background` `#F2F2F2` |
| Surface | `colors.surface` `#FFFFFF` |
| Text | `text` / `textSecondary` / `textMuted` |
| Primary CTA fill | `primaryButton` `#111` + `primaryButtonText` |
| Focus / today | `focus` coral — **today marker / week trend only** |
| Macros | `protein` / `fat` / `carbs` — always with text label |
| Dark log | `darkBg` / `darkSurface*` / `darkText*` — WeightLog only |
| Space | 4 / 8 / 12 / 16 / 24 / 32 |
| Radius | sm 12 · md 16 · lg 20 · **xl 24 card** · pill 999 |
| Type | hero 34 · title 24 · subtitle 17 · body 15 · caption 13 · micro 11 |
| Elevation | one `elevation.card` (≤0.06 opacity) via **AppCard** |
| Touch | `touchMin` 48; chips ≥ 44 |
| Pressed | opacity 0.85–0.92 |
| Disabled | opacity ~0.4 on CTA |
| Border fields | `border` + `radius.md` + minHeight touchMin |
| Sheets | `sheetSurface` + `SwipeToDismissSheet`; bottom safe inset |

Deprecated: spreading `surfaceCard` into Views; importing `SoftMetricCard` in new code (use `BentoStat`).

---

## Canonical components

| Role | Component | Path |
|------|-----------|------|
| Raised card | `AppCard` | `src/ui/AppCard` |
| List row | `ListRow` | `src/ui/ListRow` |
| Metric | `BentoStat` / `BentoRow` | `src/ui/BentoStat` |
| Section | `SectionTitle` | `src/ui/SectionTitle` |
| Soft page header | `SoftHeader` | `src/ui/SoftHeader` |
| Primary / secondary CTA | `PrimaryButton` | `src/components/PrimaryButton` |
| FAB | `Fab` | `src/ui/Fab` |
| Inverse primary strip | `InverseStrip` | `src/ui/InverseStrip` — **at most one black job / screen** |
| Empty | `EmptyState` | `src/components/EmptyState` |
| Date (Today) | `DayStrip` | `src/components/DayStrip` |
| Date (Food/Activity) | `DateSwitcher` | `src/components/DateSwitcher` |
| Macros diary | `CalorieHero` + `MacroGrid` | Food etalon |
| Icon circle | `CircleIconButton` | header actions |
| Toast | `FlashBar` | AppCard toast |
| Sheet shell | `SwipeToDismissSheet` | |

**CTA rule:** ≤1 black primary job per screen (`PrimaryButton` primary **or** `Fab` **or** one `InverseStrip`). Secondary = `PrimaryButton variant="secondary"` or text link.

**Cards rule:** AppCard for grouped interactive/summary blocks. Flat lists prefer ListRow / bordered rows — no card-in-card.

---

## States

| State | Pattern |
|-------|---------|
| Empty | `EmptyState` on canvas |
| Loading | sync SQLite — no invented skeletons |
| Error | FlashBar / Alert — no shame copy |
| Unknown macros | display `—` / null, never invent 0 |
| Dark focused log | WeightLogSheet only |

---

## Navigation

- Tab bar: Soft Light surface + `elevation.tabBar`; filled icon when focused.
- Stack headers: native; content uses Soft Light canvas.
- ADR-009 redirects: no UI kit surface — keep Redirect.

---

## Visual recipes

### Screen header
- Today / Plan hub / Profile: `SoftHeader` (eyebrow + title). No second calendar in header if `DayStrip` is present.
- Food / Activity / Progress: native stack title or `DateSwitcher` as first content block.

### Hero metric
- One hero number per screen (`type.hero`). Food: `CalorieHero` ring + remaining. Progress body: weight. Activity: minutes.

### List density
- `ListRow`: circular glyph well (`accentSoft`), title `body`/700, meta `caption`, trailing quiet, hairline between rows inside one `AppCard`.
- Catalog / recipes search: border field (`border` + `radius.md` + `touchMin`), not elevated card.

### Date family
- `DayStrip` and `DateSwitcher` share chip height ≥44, selected = black fill, today marker = coral when unselected today.

### Sheet chrome
- Light: `SwipeToDismissSheet` + white `sheetSurface`, handle, `space.lg` padding, border inputs, one `PrimaryButton`.
- Dark: WeightLog only — `darkBg` / `darkSurface`.

### Empty
- `EmptyState` in AppCard: icon well, title, body, optional primary + secondary text CTA.

---

## Anti-patterns (ban)

- Neumorphism / dual-shadow masonry on light tabs  
- Purple brand wash / glow  
- Cream / taupe shell (user ref `03-warm-taupe`)  
- Emoji as primary iconography  
- Competing SoftMetric vs Bento  
- Second black pill for same job  
- Restoring pantry/shop/budget screens without ADR  
- Dark tab shells
