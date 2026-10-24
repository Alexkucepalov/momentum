# Visual Audit Pack

Пакет скриншотов FI-поверхностей: **empty** и **filled**, формы, модалки, поиск, рецепты, запасы, меню, покупки, бюджет.

| Поле | Значение |
|------|----------|
| Каталог PNG (актуальный) | [`visual-audit-pack/2026-10-24-screens/`](./visual-audit-pack/2026-10-24-screens/) (**~50** файлов, ADR-009 / Plan tab) |
| Индекс | [`visual-audit-pack/2026-10-24-screens/README.md`](./visual-audit-pack/2026-10-24-screens/README.md) |
| Скрипт | `scripts/capture-screens-2026-10-24.mjs` (legacy: `capture-visual-audit-pack.mjs`) |
| Архив 2026-10-21 | [`visual-audit-pack/`](./visual-audit-pack/) — до среза запасов/покупок |
| Текущий evidence | **Expo web** 390×844 @2x |
| Android Pass | **не выставлен** — нет устройства/AVD; для Pass → `visual-audit-pack/android-device/` |
| Синтетика | демо 2 недели |
| Дата съёмки | **2026-10-24** |

---

## Статус evidence

| Источник | Статус | Комментарий |
|----------|--------|-------------|
| Expo web (mobile viewport) | ✅ снят | 47 PNG |
| Android emulator | ⏳ | AVD не найден |
| Physical Android + dogfood APK | ⏳ | [`apk/DOGFOOD-APK.md`](./apk/DOGFOOD-APK.md) |

**Правило:** Android UI Pass только при PNG из `visual-audit-pack/android-device/` с датой и sha APK.

---

## Чеклист экранов

`W` = web pack · `A` = Android device.

### Tabs / ядро

| ID | Экран / состояние | W | A | Файл |
|----|-------------------|---|---|------|
| T01 | Сегодня · empty | ✅ | ☐ | `01-today-empty.png` |
| T02 | Сегодня · filled | ✅ | ☐ | `61-today-filled.png` |
| T03 | Питание · empty | ✅ | ☐ | `02-food-empty.png` |
| T04 | Питание · filled | ✅ | ☐ | `60-food-filled.png` |
| T05 | Питание · поиск без результатов | ✅ | ☐ | `02b-food-search-no-results.png` |
| T06 | Питание · поиск с результатами | ✅ | ☐ | `60b-food-search-results.png` |
| T07 | Активность · empty | ✅ | ☐ | `03-activity-empty.png` |
| T08 | Прогресс · empty | ✅ | ☐ | `04-progress-empty.png` |
| T09 | Профиль | ✅ | ☐ | `05-profile.png` |

### Модалки / формы ядра

| ID | Экран / состояние | W | A | Файл |
|----|-------------------|---|---|------|
| M01 | Добавить еду | ✅ | ☐ | `30-modal-add-food.png` |
| M02 | Добавить еду · Быстро | ✅ | ☐ | `30b-modal-add-food-quick.png` |
| M03 | Привычка composer | ✅ | ☐ | `31-modal-habit-composer.png` |
| M04 | Челлендж composer | ✅ | ☐ | `31b-modal-challenge-composer.png` |
| M05 | Тренировка | ✅ | ☐ | `32-modal-workout.png` |

### Рецепты

| ID | Экран / состояние | W | A | Файл |
|----|-------------------|---|---|------|
| R01 | Список · empty | ✅ | ☐ | `10-recipes-empty.png` |
| R02 | Список · filled | ✅ | ☐ | `40-recipes-filled.png` |
| R03 | Поиск | ✅ | ☐ | `40b-recipes-search.png` |
| R04 | Новый рецепт (форма) | ✅ | ☐ | `11-recipe-form-empty.png` / `42-recipe-form.png` |
| R05 | Импорт из текста · empty | ✅ | ☐ | `12-recipe-import-text-empty.png` |
| R06 | Импорт из текста · filled → редактор | ✅ | ☐ | `43-*.png` |
| R07 | Архив личных | ✅ | ☐ | `13-*.png` |
| R08 | Деталь рецепта | ✅ | ☐ | `41-recipe-detail.png` |
| R09 | Приготовить снова | ✅ | ☐ | `41b-recipe-recook-modal.png` |
| R10 | Порция в дневник | ✅ | ☐ | `41c-recipe-portion-modal.png` |

### План / FI

| ID | Экран / состояние | W | A | Файл |
|----|-------------------|---|---|------|
| P01 | Хаб плана | ✅ | ☐ | `20-plan-hub.png` / `58-plan-hub-after.png` |
| P02 | Eat Now · empty | ✅ | ☐ | `21-eat-now-empty.png` |
| P03 | Eat Now · filled | ✅ | ☐ | `57-eat-now-filled.png` |
| P04 | Запасы · empty + форма | ✅ | ☐ | `22-pantry-empty.png` |
| P05 | Запасы · после покупки | ✅ | ☐ | `52-pantry-after-purchase.png` |
| P06 | Запасы · filled (+ ручной) | ✅ | ☐ | `52b` / `52c` |
| P07 | Меню · композер | ✅ | ☐ | `23` / `53` |
| P08 | Меню · filled | ✅ | ☐ | `54-week-menu-filled.png` |
| P09 | Покупки · empty | ✅ | ☐ | `24-shop-empty.png` |
| P10 | Покупки · filled | ✅ | ☐ | `55-shop-filled.png` |
| P11 | Бюджет · empty + формы | ✅ | ☐ | `25-budget-empty.png` |
| P12 | Бюджет · filled | ✅ | ☐ | `56-budget-filled.png` |
| P13 | Магазины | ✅ | ☐ | `26-stores.png` |
| P14 | Импорт покупки · paste empty | ✅ | ☐ | `27-purchase-import-empty.png` |
| P15 | Импорт покупки · manual | ✅ | ☐ | `27b-purchase-manual-form.png` |
| P16 | Импорт покупки · paste filled | ✅ | ☐ | `50-purchase-paste-filled.png` |
| P17 | Импорт покупки · preview | ✅ | ☐ | `51-purchase-preview.png` |

---

## Замечания с съёмки (не Pass)

1. **Покупка → запасы:** на ветке `#69` confirm падал без `reconcileOpenShoppingWithPurchase` / соседних shopping API — добавлены минимальные реализации в `foodRepository`, иначе filled pantry после чека не снимался.
2. Позиции из покупки кладутся в локацию **Шкаф** (`source: purchase`), не в холодильник.
3. Камера / barcode на web не снимаются.
4. Это **не** физический Android: layout/шрифты/safe-area могут отличаться.

---

## Пересъёмка (web)

```bash
cd apps/mobile && npx expo start --web --port 8081
# из корня репо:
node scripts/capture-visual-audit-pack.mjs
```

Нужен `puppeteer-core` (локально: `npm install --no-save puppeteer-core`).

## Android device Pass

1. Установить APK из [`apk/DOGFOOD-APK.md`](./apk/DOGFOOD-APK.md).
2. Empty: свежая установка / сброс данных.
3. Filled: «Загрузить демо 2 недели» + импорт покупки (синтетика) + запасы/меню/покупки/бюджет.
4. PNG → `docs/quality/visual-audit-pack/android-device/` (те же имена).
5. Проставить `A` и обновить «Статус evidence».

---

## Аудит-вопросы на каждый кадр

- Primary action очевидна?
- Empty без стыда / без фейковых нулей там, где unknown?
- Planned ≠ eaten (меню / Eat Now)?
- Touch targets ≥ 44pt, контраст?
- Формы: честные ошибки, без выдуманных КБЖУ?
