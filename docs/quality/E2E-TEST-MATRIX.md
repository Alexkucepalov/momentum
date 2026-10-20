# E2E Test Matrix

**Статус:** матрица сценариев + ожидаемое поведение из кода/спек.  
**Фактический результат в этом аудите:** не прогонялся на эмуляторе/устройстве (нет Maestro/Detox в репо).

Колонки заполнять при прогоне: `Pass/Fail`, duration, evidence (video/log), env.

---

## Environments

| Env | Use |
|-----|-----|
| Unit `npm run verify` | Domain regressions only |
| Android emulator | Smoke UI |
| Physical Android midrange | Timing + TalkBack + camera |
| Airplane mode | Offline diary |

---

## Mandatory scenarios

| ID | Scenario | Steps (expected) | Expected | Actual | Dur | Evidence |
|----|----------|------------------|----------|--------|-----|----------|
| E01 | First launch empty | Install → open | Empty states, no crash, can open Add | *pending* | | |
| E02 | Profile goals | Profile → set kcal/macros | Targets on Today ring | | | |
| E03 | First product | Add → search/create → portion → save | Entry + totals | | | |
| E04 | Repeat yesterday | Copy yesterday / recent | Entries cloned; ≤10s goal | | | |
| E05 | Barcode OK | Scan known code | Portion sheet; diary after grams | | | |
| E06 | Barcode miss | Unknown code | Fallback manual/label; no fake product | | | |
| E07 | Label fail | Manual label text bad | Honest error; no invent | | | |
| E08 | Import long text | Recipes → Из текста → paste diary | Preview /100g; editor | | | |
| E09 | Edit recipe | Open → edit → save | Snapshot history intact on old entries | | | |
| E10 | Change portion | Diary → edit grams | Totals update | | | |
| E11 | Add workout | Activity → add | Listed; no food kcal offset | | | |
| E12 | Create habit | Progress/Profile habits | Appears on Today | | | |
| E13 | Complete habit | Today checklist | Week marks update | | | |
| E14 | Challenge | Progress → challenge | Personal metric; no shame streak | | | |
| E15 | Progress view | Open Progress | Charts render empty-safe | | | |
| E16 | Export/restore | Profile export → import | Data round-trip | | | |
| E17 | Offline | Airplane → add food | Works; barcode degrades gracefully | | | |
| E18 | Force stop | Add → kill app | Entry persists | | | |
| E19 | Restart | Cold start after E18 | Same totals | | | |
| E20 | Large history | Load D10k fixture | No crash; usable scroll (**H** may fail) | | | |

### Planner extras

| ID | Scenario | Expected |
|----|----------|----------|
| P01 | Eat Now → В дневник | Entry; remaining updates |
| P02 | Eat Now → В план | TodayPlanStrip; no diary |
| P03 | Strip «Съел» | Diary + planned logged |
| P04 | Week draft | No auto diary |
| P05 | Shop price | Basket / eaten cost honest nulls |
| P06 | Budget expense | Spent updates; forecast rules |

---

## Automation recommendation

1. Start with **Maestro** flows for E01, E03, E04, E18 (low setup vs Detox).
2. Keep domain unit tests as gate in CI.
3. Device lab checklist weekly for founder dogfood (E04 timing).

---

## Evidence policy

- Screenshot/video for Fail.
- Never claim Pass without env + build id.
- Unit green ≠ E-row Pass.
