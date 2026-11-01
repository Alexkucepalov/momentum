# Garmin Personal API → Momentum (dogfood)

## Что сделано

- Официальный **Garmin Connect Personal API** (личный ключ → bearer JWT).
- Импорт: вес, тренировки (activities + detail), дневные шаги.
- Ключ только в `expo-secure-store` (не в SQLite snapshot / JSON export).
- Snapshot **v18**: метрики + `polylineJson` / `chartJson` / `detailJson`; `dailyActivityStats`; `sleepNights` (Garmin sleep summaries); `garminSync`.
- UI: экран тренировки (трек SVG, графики, RU-поля), Today/Activity/Progress/календарь.

## Синхронизация

- **Полная выгрузка**: окно до 3 лет; шаги и daily summaries кусками ≤28 дней; вес кусками ≤90 дней; activity search без даты + pagination; detail enrichment (пульс/зоны/мощность).
- **Обновить с последней даты**: incremental от `lastSyncedTo`.
- Частичный settle: один упавший endpoint не откатывает остальные.
- Вес = только то, что есть в Garmin Connect (Xiaomi и др. весы сюда не попадают).

## Сборка development / APK

```bash
cd apps/mobile
npx expo prebuild --platform android   # если нужно обновить native
npm run android                        # или
npm run build:apk:local
```

## Подключение на телефоне

1. На компьютере открой [Personal API Key](https://connect.garmin.com/app/settings/personalApiToken).
2. Create Key → скопируй ключ **один раз** (не отправляй в чат / git).
3. Momentum → Профиль → **Настроить Garmin** → вставь ключ → Сохранить.
4. **Полная выгрузка из Garmin**.
5. Проверь «Данные Garmin» и экран тренировки (тап по activity).

## Ограничения

- Personal API = **только твой** аккаунт.
- Ключ истекает (30d / 90d / 180d / 1y).
- Sleep: вкладка «Сон» + sync `dailySleepSummariesByDate`. HRV / body battery — вне среза.
- Не коммитить ключи; не логировать token.

## Откат

Удалить ключ на экране Garmin («Отключить»). Импортированные строки остаются с `source: 'garmin'`.
