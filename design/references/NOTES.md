# Design references — take / don't-take

Source PNGs for **nf-fit** Minimal Soft Utility. Full write-up: `docs/05-DESIGN-REFERENCES.md`, `docs/visual-direction.md`.

Default skin = **light** soft utility. Dark refs inform IA and geometry only.

| File | Theme | Take | Don't take |
|------|--------|------|------------|
| `519af874-6dd2-42c6-b89d-4e53e4f95c44.png` | Nothing OS widgets | B/W + red accent; circles/pills/squircles; flat blocks; mono/dot-matrix hero digits; widget geometry | Full black UI as app chrome |
| `97aa7319-4183-41f3-998b-992bd83cea5a.png` | Dark fitness Today | Hero metric → chips → 2-col bento; dual actions; MetricCard structure | Pure black canvas; neon multi-color brand palette |
| `e3d68fc3-ee94-433c-bdf1-ceb4d7b2c1b2.png` | Light soft Home (**primary**) | Light canvas; coral on current day/trend; bodyweight + mini bars; calorie ring; calm tab bar | Inter-only type lock-in; heavy card shadows |
| `6ee8bef4-7244-413e-b905-09ccdb9e70f0.png` | Dark workouts / habits | Progress rings; habit month dots; dense Activity/Progress layout | Dark default theme; speech-bubble nav item |
| `2d15795d-3b23-4ac3-bef2-282c17c0725e.png` | Weather utility bento | Gray canvas + white cards; mono data; sparse alert red; one black focal block | Weather content; desktop density |

**Home widgets:** geometry/contrast from Nothing ref; live data only from real Today metrics later — never show unknown as `0`.
