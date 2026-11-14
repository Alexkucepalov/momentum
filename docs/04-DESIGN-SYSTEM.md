# nf-fit — Fresh Utility

Runtime source: `src/design-system/tokens.ts`. Both mobile token paths re-export this contract. This direction supersedes the previous Premium Minimal Utility presentation for issue #148.

The founder explicitly requested a complete visual refresh on13 November2026, including structural screen changes. The scope is the existing app: five tabs, nested routes, forms and shared sheets. No new backend, permissions, account flow, production publication or storage migration is included.

## Visual language

Cool blue-gray canvas, slate ink, white surfaces and fine dividers. Primary chrome uses a readable blue accent (tabs, chips, CTAs, progress) — not mono black and not sage-green backgrounds. Use open space and typography to group information; a repeated list does not need a card around every item. Reserve a contained surface for a coherent summary, editing state or action. Planned strength uses a soft blue fill; cycling uses a soft teal. Meal section bars use distinct hues. These fills do not score health or performance.

Primary actions are accent blue. One primary action per local task. Secondary actions remain quiet. Errors use the danger token; missing data uses a dash and an explanatory label. Unknown data is never converted to a measured zero. Green remains for semantic success and the protein macro accent.

## Tokens

| Role | Token / value |
| --- | --- |
| Canvas | `canvas` / `background`: `#EEF2F7` |
| Surface | `surface`: `#FFFFFF` |
| Neutral fill | `surfaceMuted`: `#E4EAF2` |
| Main text | `ink`: `#0F172A` |
| Accent / primary CTA | `accent` / `primary`: `#1D5BBF` |
| Supporting text | `textSecondary`: `#475569`; `textMuted`: `#5B6578` |
| Divider | `border`: `#D5DCE8` |
| Planned strength | `trainingStrength`: `#D9E4FB` |
| Planned cycling | `trainingCycling`: `#CFF3EA` |
| Positive marker | `success`: `#15803D` (`sageInk` aliases `ink`) |
| Destructive | `danger`: `#B42318` |

All color values belong in the token source; do not add screen-local hex values. Semantic macro colors remain labeled and are not used as competing screen themes.

## Typography

Manrope400/500/600 is bundled locally, including Cyrillic and its SIL OFL license. App startup loads these local assets with expo-font before dismissing the splash. No remote font service or new runtime dependency is needed.

`AppText`, `ThemedText`, `Field` and `ThemedTextInput` select the registered font instance. Legacy forms use the same input wrapper, preserving native refs and explicitly requested monospace fonts. Existing bold text maps to the600 instance instead of synthesizing very heavy headings. Explicit monospace families remain available for JSON previews.

Scale: metric46, hero36, title28, subtitle18, body14, caption12, label11. Headings and large metrics use medium weight. Body copy uses regular weight; semibold is for actions and row emphasis. Text scaling stays enabled.

Screen padding20; base spacing4/8/12/16/20/24/32; section break28. Card radius24, controls16, floating dock pill. Interactive chips, presets, row actions and main touch targets use a minimum48dp; decorative bars and labels may be smaller. The dock occupies layout space, so it cannot cover the last scroll item or the existing sticky food action.

## Shared components

- `FloatingTabBar`: Today, Food, Movement, Progress, Profile. Icons and persistent labels; selected dark pill. Sleep remains inside Movement. Nested stacks have a back action and no root dock.
- `AppText` / `ThemedText`: one bundled font language across existing screens and legacy text.
- `AppCard`: quiet white surface, no default outline or elevation. Use dividers for row collections.
- `AppButton`, `Field`, `Chip`: one control geometry; labeled fields, preserved validation and feedback.
- `SegmentedControl`: text tabs with a thin selected underline; no heavy track around every group.
- `DayStrip`: week navigation separated from the seven date targets, keeping date selection readable on narrow screens.
- `KcalRing`: open day summary with a thin ring only when an energy target exists. Labeled macro values and optional goal tracks; null values stay unknown. Exercise energy does not change the food target.
- `MealSection`: four stable meal sections, compact empty rows, accessible add actions, existing copy/edit/delete/undo behavior. A compact quick-repeat section now appears before the meal list (#230), with an explicit destination meal. Each diary row has a visible actions menu; resizing scales the stored snapshot.
- `TodayTrainingCard`: one sage action for the day's plan or the active session, backed by repository data.
- `StrengthWeekBoard`: all seven days, planned cards, actual workout rows, direct manipulation and menu fallback. Completed facts have no drag handles.
- `SetLogRow`: one prominent current approach, compact saved/queued rows, optional expansion of later sets. Recording still calls the existing validated repository operation.
- `SwipeToDismissSheet`, `ChartFrame`: shared sheet and chart presentation with the same surfaces, typography and spacing.

## Screen structure

Today prioritizes the recorded day, a direct diary link, compact food repeat with a visible destination meal, then the current training plan. Steps, sleep and water are compact rows; water can be corrected and quantitative habits accept a daily value. Food keeps diary/catalog separation and four meal slots. The catalog uses compact date context to leave room for search results; the diary keeps the full week selector. Empty food totals use a dash rather than a measured zero. Movement leads with the week; Garmin facts remain tied to the imported date. Progress uses charts and metric summaries, with report copying secondary. Profile leads with a compact goals summary; editing expands on demand or opens directly through `?section=goals`.

Planner, recipes, Garmin and strength stacks share the same font, headers, control and surface contracts. Existing functionality and import/restore confirmation remain available.

## Data and validation

Dragging changes planned cards only. `swapPlannedActivities` validates both cards before mutation, exchanges date/order and emits one persistence notification. Times remain attached to their activities; actual workout/session history is untouched. Move and swap expose Undo. Snapshot v20 adds an independent training-cycle pattern and explicit plan-to-Garmin-ride links (ADR-012). The SQLite schema does not change. Week edits never rewrite the pattern, and imported ride dates/metrics stay immutable.

The browser evidence uses the repository's explicitly synthetic fixture, shifted to the QA week. Expo-web screenshots are not an Android device Pass. Device force-stop, TalkBack, large text, keyboard and drag behavior still need physical Android verification before updating device baselines.

Implementation notes and evidence: [fresh-utility/README.md](quality/fresh-utility/README.md), [followup-228/README.md](quality/followup-228/README.md), [today-food-230/README.md](quality/today-food-230/README.md).

### Доводка после аудита #232 — 2026-11-14

Один `FeedbackHost` размещается в корневом layout: вложенные маршруты не создают собственные FlashBar/UndoBar. Положение учитывает нижнюю навигацию и CTA питания. Undo принадлежит DataProvider, содержит область обновления и теряет силу после wipe/import. Новый экран или модальная форма не должны скрывать ошибку: в формах показываем её рядом с вводом.

Токен `textMuted` уточнён до контраста AA также на поверхности силовой тренировки; локальные цветовые исключения не нужны. Нижняя навигация имеет группу вкладок; tab/checkbox/radio передают выбранное состояние и в native accessibilityState, и в ARIA. Прогресс силовой сессии — progressbar с диапазоном и текущим значением.

Для недоступного локального фото рецепта используется общая заглушка `RecipeImage`. Фото из импортированного JSON не загружается с произвольного внешнего URL.

### Интерактивный зал и общая доводка #236 — 2026-11-14

Контролы используют радиус16, карточки24; основной CTA имеет минимум52dp. Переключатели размещены на нейтральной округлой подложке, выбранный пункт — белая поверхность с тонкой границей. Подписи полей используют caption12, заголовки графиков — subtitle18. Кнопки дают краткий отклик на нажатие без постоянной анимации.

Силовая сессия показывает одно упражнение и один редактируемый подход. План/предыдущее занятие отделены от факта; черновик не считается выполненным. Подтверждение даёт Undo, запускает сохранённый таймер и открывает следующий незаписанный подход. После завершения показывается интерактивная сводка. Декоративная схема мышц не заменяет объяснение техники. Общая панель имеет роль диалога, доступное имя и полноценную кнопку закрытия с областью48dp.

Evidence: [интерактивный зал](quality/interactive-gym-236/README.md).
