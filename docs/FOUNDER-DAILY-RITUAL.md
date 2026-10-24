# Founder daily ritual — autonomous queue

Issue [#10](https://github.com/Alexkucepalov/momentum/issues/10). 10–15 минут, без диспетчера auto-merge.

1. Открыть `gh pr list --state open` и `gh issue list --state open`.
2. Смержить зелёный PR только вручную. Не вешать `agent-ready`, если не нужен автозапуск.
3. Проверить, что в полёте не больше двух issue.
4. Device gates [#92](https://github.com/Alexkucepalov/momentum/issues/92) / [#93](https://github.com/Alexkucepalov/momentum/issues/93): если есть новый APK — прогнать протокол, записать в `docs/quality/`.
5. Смотреть `docs/17-DEV-PLAN.md` Backlog, не 12-недельный roadmap 2.0 (частично отменён ADR-009).
6. Не ставить `agent-ready` на device-only и architecture-без-замеров задачи.

Диспетчер: `DISPATCH_ENABLED=false` в DEV-PLAN. Если метка `agent-ready` появилась — агент может стартовать сам.
