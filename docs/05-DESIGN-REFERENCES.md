# nf-fit — Design references

Canonical visual direction lives in `docs/visual-direction.md`. PNG boards are under `design/references/` with per-image NOTES in `design/references/NOTES.md`.

> Note: historical `docs/05-ARCHITECTURE.md` remains the architecture overview. This file is the **design-reference index** for nf-fit Phase 0+.

## Verdict

**Default skin = Minimal Soft Utility (light).**  
From dark boards: information architecture and card geometry only — not a dark canvas as the default app chrome.

## Shared patterns to ship

- Soft squircles / high-radius cards, equal inner padding
- Metric hierarchy: large value → small label → secondary meta
- Flat plane: no glow, neumorphism, random gradients, heavy shadows
- One accent (red/coral), used sparingly
- One dominant high-contrast CTA pill
- Compact metric circles/pills for widgets and chips
- Bottom tab bar, 5 items, clear active state

## Boards

| Asset | Role |
|-------|------|
| `519af874-…png` | Nothing OS widgets — accent + widget geometry |
| `97aa7319-…png` | Dark Today IA — MetricCard / bento structure |
| `e3d68fc3-…png` | **Primary app chrome** — light soft Home |
| `6ee8bef4-…png` | Activity / Progress density, habit dots, rings |
| `2d15795d-…png` | Canvas vs surface, mono metrics, sparse alert red |

## Runtime mapping

Tokens and primitives: `apps/mobile/src/design-system/` (re-exported via `apps/mobile/src/theme/tokens.ts` for legacy imports).
