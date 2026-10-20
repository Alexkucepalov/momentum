# Android UI smoke checklist (#38)

**Env:** dogfood APK `apps/mobile/dist/momentum-dogfood.apk` · see `docs/quality/apk/DOGFOOD-APK.md`  
**Maestro:** `maestro/food-add-smoke.yaml` (требует калибровки селекторов на device — **pending**)

## Manual (15 мин) — совмещается с `DEVICE-DOGFOOD-15MIN.md`

| # | Шаг | Pass? |
|---|-----|-------|
| 1 | Установить APK, открыть app | |
| 2 | Сегодня: КБЖУ видно, sticky «Добавить еду» | |
| 3 | Add → поиск привычного → порция → дневник | |
| 4 | Quick repeat (+) без лишнего confirm | |
| 5 | Питание: сегмент Дневник → Каталог → поиск | |
| 6 | Изменить граммы существующей записи | |
| 7 | Force-stop → reopen → запись на месте (#36) | |
| 8 | Повтор ≤10s секундомер n≥5 (#37) | |

**Статус прогона:** pending (нет подтверждённого device run).
