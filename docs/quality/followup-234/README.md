# Evidence — issue #234

Синтетические данные, 14 ноября 2026. Expo web / Chromium, Europe/Moscow; для воспроизводимости дата интерфейса зафиксирована 13 ноября. Изображения в `screens/`, ширины 360/390/430 px, высота 844 px. Измерения не являются физическим Android pass.

- `browser-result.json`: пять функциональных групп, включая склад после reload, direct portion, double tap, Undo, бюджет и сон.
- `responsive-result.json`: 30 состояний (10 × 3 ширины), переполнение и axe-core 4.10.3 WCAG A/AA/2.1 A/AA. Пояснение бюджета повторно проверено после исправления RN warning.
- `verify.log`: итоговый `npm run verify` — **398/398 tests**, root/mobile TypeScript, tests, secret scan, совместимость зависимостей.
- `android-export.log`: Android Hermes JS export. Установка/жесты/нативные permissions этим не проверены.

Полный смысл изменений, ограничения и rollback: [отчёт](../FOLLOWUP-2026-11-14.md).
