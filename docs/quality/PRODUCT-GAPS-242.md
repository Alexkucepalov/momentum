# Product gaps closed — #242

Дата: 2026-11-14. После высадки Codex stack (#239/#240).

## P0

| Gap | Fix |
| --- | --- |
| План еды → дневник мёртв | `TodayPlanStrip` на Today; «В дневник» на карточке недели + Undo |
| Пустой шаблон → сессия без упр. | Hub блокирует старт; empty session → CTA в редактор |

## P1

| Gap | Fix |
| --- | --- |
| Today empty / copy yesterday | EmptyState + CopyYesterday всегда |
| Food diary empty | EmptyState + Добавить / Сканер |
| Catalog empty | CTA «Создать вручную» |
| Habits deep-link | `/progress?segment=habits` |
| Link cycling empty | CTA «Открыть Garmin» |
| Strength progress empty | CTA «К тренировкам» |
| Eat Now | Undo дневник/план; CTA целей |

## P2 closed (#246)

| Gap | Fix |
| --- | --- |
| KcalRing remaining hero | Hero = остаток / перебор; ring = % съедено |
| Persist catalog filter | `uiPrefs` FileSystem + Food tab load/save |
| Profile day-report duplicate | Profile → `/progress?segment=reports` |
| Manual «Сила» vs session | Chip «Сила» → strength hub |

## Later / out of scope

- #238 full scenario redesign (open epic; cool-gray landed in #240)
