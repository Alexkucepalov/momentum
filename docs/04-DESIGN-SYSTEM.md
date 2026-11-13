# nf-fit — Fresh Utility

Runtime source: `src/design-system/tokens.ts`. Both mobile token paths re-export this contract. This direction supersedes the previous Premium Minimal Utility presentation for issue #148.

The founder explicitly requested a complete visual refresh on13 November2026, including structural screen changes. The scope is the existing app: five tabs, nested routes, forms and shared sheets. No new backend, permissions, account flow, production publication or storage migration is included.

## Visual language

Warm neutral canvas, readable charcoal, white surfaces and fine dividers. Use open space and typography to group information; a repeated list does not need a card around every item. Reserve a contained surface for a coherent summary, editing state or action. Sage identifies planned strength and ice blue identifies planned cycling. These fills do not score health or performance.

Primary actions are charcoal. One primary action per local task. Secondary actions remain quiet. Errors use the danger token; missing data uses a dash and an explanatory label. Unknown data is never converted to a measured zero.

## Tokens

| Role | Token / value |
| --- | --- |
| Canvas | `canvas` / `background`: `#F7F7F2` |
| Surface | `surface`: `#FFFFFF` |
| Neutral fill | `surfaceMuted`: `#EDF0E9` |
| Main text / action | `ink` / `primary`: `#20251F` |
| Supporting text | `textSecondary`: `#626B5F`; `textMuted`: `#697166` |
| Divider | `border`: `#E1E5DC` |
| Planned strength | `trainingStrength`: `#E8EEE1` |
| Planned cycling | `trainingCycling`: `#E8F0F4` |
| Positive marker | `success` / `sageInk`: `#4B6745` |
| Destructive | `danger`: `#B42318` |

All color values belong in the token source; do not add screen-local hex values. Semantic macro colors remain labeled and are not used as competing screen themes.

## Typography

Manrope400/500/600 is bundled locally, including Cyrillic and its SIL OFL license. App startup loads these local assets with expo-font before dismissing the splash. No remote font service or new runtime dependency is needed.

`AppText` and `ThemedText` select the registered font instance. Existing bold text maps to the600 instance instead of synthesizing very heavy headings. Explicit monospace families remain available for JSON previews.

Scale: metric46, hero36, title28, subtitle18, body14, caption12, label11. Headings and large metrics use medium weight. Body copy uses regular weight; semibold is for actions and row emphasis. Text scaling stays enabled.

Screen padding20; base spacing4/8/12/16/20/24/32; section break28. Card radius22, controls14–16, floating dock24. Effective main touch targets remain48dp. The dock occupies layout space, so it cannot cover the last scroll item or the existing sticky food action.

## Shared components

- `FloatingTabBar`: Today, Food, Movement, Progress, Profile. Icons and persistent labels; selected dark pill. Sleep remains inside Movement. Nested stacks have a back action and no root dock.
- `AppText` / `ThemedText`: one bundled font language across existing screens and legacy text.
- `AppCard`: quiet white surface, no default outline or elevation. Use dividers for row collections.
- `AppButton`, `Field`, `Chip`: one control geometry; labeled fields, preserved validation and feedback.
- `SegmentedControl`: text tabs with a thin selected underline; no heavy track around every group.
- `DayStrip`: week navigation separated from the seven date targets, keeping date selection readable on narrow screens.
- `KcalRing`: open day summary with a thin ring only when an energy target exists. Labeled macro values and optional goal tracks; null values stay unknown. Exercise energy does not change the food target.
- `MealSection`: four stable meal sections, compact empty rows, accessible add actions, existing copy/edit/delete/undo behavior. The established meal-before-repeat order is retained.
- `TodayTrainingCard`: one sage action for the day's plan or the active session, backed by repository data.
- `StrengthWeekBoard`: all seven days, planned cards, actual workout rows, direct manipulation and menu fallback. Completed facts have no drag handles.
- `SetLogRow`: one prominent current approach, compact saved/queued rows, optional expansion of later sets. Recording still calls the existing validated repository operation.
- `SwipeToDismissSheet`, `ChartFrame`: shared sheet and chart presentation with the same surfaces, typography and spacing.

## Screen structure

Today prioritizes the recorded day, a food action and the current training plan; steps, sleep and water are compact rows. Food keeps diary/catalog separation and four meal slots. Movement leads with the week; Garmin facts remain tied to the imported date. Progress uses charts and metric summaries, with report copying secondary. Profile leads with a compact goals summary; editing expands on demand or opens directly through `?section=goals`.

Planner, recipes, Garmin and strength stacks share the same font, headers, control and surface contracts. Existing functionality and import/restore confirmation remain available.

## Data and validation

Dragging changes planned cards only. `swapPlannedActivities` validates both cards before mutation, exchanges date/order and emits one persistence notification. Times remain attached to their activities; actual workout/session history is untouched. Move and swap expose Undo. Snapshot version19 and the SQLite schema do not change.

The browser evidence uses the repository's explicitly synthetic fixture, shifted to the QA week. Expo-web screenshots are not an Android device Pass. Device force-stop, TalkBack, large text, keyboard and drag behavior still need physical Android verification before updating device baselines.

Implementation notes and evidence: [fresh-utility/README.md](quality/fresh-utility/README.md).
