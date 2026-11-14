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

## Still open (P2 / later)

- KcalRing remaining hero
- Persist catalog filter
- Collapse Profile day-report duplicate
- Manual «Сила» form vs session clarity
