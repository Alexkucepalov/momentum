# Evidence — полный аудит #232

Основной документ: [FULL-AUDIT-2026-11-14.md](../FULL-AUDIT-2026-11-14.md).

- Скриншоты — [screens](screens/), реальные рендеры Expo web/Chromium; синтетические записи. Выбранный день в большинстве fixture-сценариев — 13 ноября 2026, не дата фактического device-прогона.
- [Verification](evidence/verification.json): команды, исходная база, Android export и ограничения.
- [Browser workflows](evidence/browser-flows-result.json), [дополнительные сценарии](evidence/browser-extra-result.json), [медиа/приватность](evidence/photo-result.json).
- [Все маршруты и ширины](evidence/responsive.json), [вложенные экраны и сегменты](evidence/details.json).
- [axe основных маршрутов](evidence/accessibility.json): автоматическая проверка WCAG; ручной TalkBack не выполнен.
- [Root dependencies](evidence/dependency-root.json), [mobile dependencies](evidence/dependency-mobile.json).
- [Node performance](evidence/performance.json): исключительно Node, не Android.
- [Полный verify](evidence/verify.log).

В этой папке нет настоящих пользовательских health-данных, Garmin-ключей или токенов. Скриншоты демонстрируют проверенные состояния, не являются изображениями будущего дизайна. Physical device gates перечислены отдельно в основном отчёте.
