# Momentum — Design System Proposal  
## Premium Minimal Utility (Этап 0 — согласование)

**Статус:** предложение для approve.  
**Не внедрять в код** до явного согласия основателя.  
**Текущий runtime** остаётся Minimal Soft Utility (`src/design-system/tokens.ts`) до этапа B.

Вдохновение (не копировать целиком): Nothing OS (геометрия, монохром, типографика цифр), качественные fitness/wellness apps (ясные метрики, спокойный progress), минималистичные utility apps (один CTA, честные empty).

---

## 1. Принципы

1. **Один язык на все вкладки** — запрещены локальные «скины».  
2. **Данные важнее декора** — цифра → label → meta.  
3. **Один primary action** на первый viewport.  
4. **Unknown ≠ 0** визуально: символ `—`, не серый ноль и не заливка «пустого» прогресса как полного.  
5. **Без стыда** — нет красных «провалов» калорий/привычек; danger только для destructive.  
6. **Touch 48** минимум для primary controls.  
7. **Motion служит ориентации**, не украшению.  
8. **Android-first** плотность; без iOS-специфичных паттернов как обязательных.

---

## 2. Цветовые токены (целевые)

Имена совместимы с текущими; значения — уточнение Soft Utility → Premium Minimal.

| Token | Hex | Роль |
|-------|-----|------|
| `canvas` | `#F2F3F5` | Фон экрана |
| `surface` | `#FFFFFF` | Карточка / sheet |
| `surfaceMuted` | `#EBEDF0` | Вложенный фон (chips track, stage empty) |
| `ink` | `#0A0A0A` | Основной текст |
| `textSecondary` | `#5C6370` | Подписи |
| `textMuted` | `#8B929E` | Hints / timestamps |
| `border` | `#E2E5EA` | Hairline |
| `borderStrong` | `#C9CED6` | Focus / selected outline |
| `primary` | `#0A0A0A` | Primary button fill |
| `onPrimary` | `#FFFFFF` | Текст на primary |
| `accent` | `#0A0A0A` | Active day / selected (mono) |
| `accentSoft` | `#EBEDF0` | Soft selected fill |
| `danger` | `#B42318` | Destructive only |
| `success` | `#15803D` | Positive confirm (не «цель достигнута с конфетти») |
| `successSoft` | `#DCF5E4` | Badge soft |
| `warning` | `#D97706` | Scanner / attention, не shame |
| `protein` | `#16A34A` | Macro — всегда с буквой «Б» |
| `fat` | `#D97706` | «Ж» |
| `carbs` | `#2563EB` | «У» |
| `chartTrack` | `#E8EAED` | |
| `chartFill` | `#0A0A0A` | |
| `overlay` | `rgba(10,10,10,0.4)` | Sheet dim |

**Запрещено в продукте:** purple gradients, glow, random brand accents per tab, coral chrome как primary.

---

## 3. Типографика

Системный geometric sans (RN default / platform). Для metric допускается tabular numbers.

| Role | Size | Weight | Line | Использование |
|------|------|--------|------|----------------|
| `metric` | 36 | 700 | 40 | Одно главное число на fold |
| `title` | 22 | 700 | 28 | Заголовок экрана / sheet |
| `subtitle` | 17 | 600 | 24 | Имя карточки |
| `body` | 15 | 400 | 22 | Основной текст |
| `bodyStrong` | 15 | 600 | 22 | Emphasized body |
| `caption` | 13 | 400 | 18 | Meta |
| `label` | 11 | 700 | 14 | Uppercase section / chip |
| `micro` | 11 | 500 | 14 | Counts, footnotes |

Правило: **не больше одного `metric`** в первом viewport.

---

## 4. Spacing / radius / elevation

**Space:** `4 / 8 / 12 / 16 / 24 / 32 / 48`  
- внутри карточки: 12–16  
- между секциями: 24  
- screen padding horizontal: 16  
- footer safe: 16 + inset  

**Radius:**  
- `sm` 8 — chips, small controls  
- `md` 12 — inputs, small cards  
- `lg` 16 — standard card  
- `xl` 24 — hero card / sheet top  
- `pill` 999  

**Elevation:**  
- default cards: hairline `border` only  
- floating footer / sheet: `elevation.card` = 2 + border  
- no multi-shadow stacks  

**touchMin:** 48  

---

## 5. Иконки

- Набор: Ionicons (уже в проекте) — outline по умолчанию, filled в selected tab.  
- Размер в списках: 20; в tab: 22; в empty: 28.  
- Цвет: `ink` / `textSecondary`; никогда macro-color для навигации.

---

## 6. Компоненты

### Button
- **Primary:** fill `primary`, text `onPrimary`, height 48, radius md, full-width в footer.  
- **Secondary:** surface + border, ink text.  
- **Ghost:** text only, min height 48.  
- **Destructive:** danger outline или text danger.  
- States: pressed opacity 0.85; disabled opacity 0.4.  
- Один Primary на экран (footer или sheet confirm).

### Card (`AppCard`)
- surface, radius lg, padding 16, border hairline.  
- Не оборачивать весь экран в card.  
- Interactive card: pressed state; chevron optional.

### Field
- Label (label token) + input (height 48, radius md, border).  
- Error: caption danger under field.  
- Helper: caption muted.

### Chip / Segment
- Height 40; pad H 12; radius sm (не обязательный pill).  
- Selected: fill ink, onPrimary text.  
- Unselected: surface + border.  
- SegmentedControl: track `surfaceMuted`, equal flex.

### Metric block
- Label → Value → Meta (caption).  
- Value `—` если null.  
- Не заливать progress bar на unknown.

### Charts (`ChartFrame`)
- Title (label) + subtitle (caption) + plot + footnote.  
- Selected day: ink fill; empty day: track only, label `—`.  
- Legend обязательна если >1 серии/фазы.

### Bottom sheet
- Dim overlay; top radius xl; grabber 4×36 muted.  
- Title + optional close.  
- Primary confirm внизу над home indicator.  
- Swipe-down dismiss где безопасно (не терять несохранённый критичный ввод без confirm).

### Navigation
- Tab bar: surface, top border, active ink / inactive muted.  
- **Рекомендация IA:** 5 tabs (см. roadmap) — Сон внутри Активности *или* Progress; не раздувать до 7.  
- Header: title only + max 2 icon actions.

### Empty / Loading / Error / Success
- **Empty:** icon muted + title + one sentence + one secondary/primary CTA.  
- **Loading:** inline activity на sync; skeleton только для списков > skeleton cost.  
- **Error:** banner surface + danger text + retry.  
- **Success:** FlashBar 2–3s, не modal.

---

## 7. Анимация

| Жест | Длительность | Easing |
|------|--------------|--------|
| Press | 80ms | opacity |
| Day change fade | 120–180ms | ease |
| Sheet present | 220ms | ease-out |
| Flash | fade in 100 / out 150 | |

`prefers-reduced-motion` / RN reduce: мгновенная смена без spring.

---

## 8. Контентные правила UI

- RU copy, спокойный тон.  
- Источник данных видим (Garmin / свой / справочник).  
- Не показывать «0 ккал» при unknown.  
- Planned ≠ eaten — явный бейдж/баннер на plan screens.

---

## 9. Миграция с текущего Soft Utility

| Сейчас | Цель |
|--------|------|
| `primaryButton` | rename alias → `primary` (compat export) |
| `accentSoft` coral docs vs gray code | зафиксировать gray soft |
| `PrimaryButton` component | deprecate → `AppButton` |
| Local hex | ban in lint/checklist |
| TAB_SHELL 5 | обновить под финальную IA |

Этап B внедряет токены + primitives; этап C переводит экраны.
