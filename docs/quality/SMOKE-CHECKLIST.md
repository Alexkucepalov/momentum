# Android UI smoke checklist (#38)

**Env:** dogfood APK `apps/mobile/dist/momentum-dogfood.apk` · see `docs/quality/apk/DOGFOOD-APK.md`  
**Package:** `app.nffit.dogfood`  
**Maestro:** `maestro/food-add-smoke.yaml` (калибровка на device — **pending**)  
**IA:** 5 tabs — Сегодня · Питание · Движение · Прогресс · Профиль

## Manual (15 мин) — совмещается с `DEVICE-DOGFOOD-15MIN.md`

| # | Шаг | Pass? |
|---|-----|-------|
| 1 | Установить APK, открыть app | |
| 2 | Сегодня: КБЖУ видно, sticky «Добавить еду» | |
| 3 | Add → поиск привычного → порция → дневник | |
| 4 | Повторить вчера / Recent «+» + Undo | |
| 5 | Питание: сегмент Дневник → Каталог → поиск | |
| 6 | Изменить граммы существующей записи | |
| 7 | Force-stop → reopen → запись на месте (#36) | |
| 8 | Повтор ≤10s секундомер n≥5 (#37) | |
| 9 | Движение: Активность \| Сон переключается | |
| 10 | TalkBack sample: Add food path labels (опц.) | |

**Статус прогона:** pending (нет подтверждённого device run) — Stage 11 **needs-human**.
