# Product Quality Backlog

**Утверждено 2026-10-20** с корректировками. Feature freeze. Эталон = пищевой лог.

Оценки: S ≤0.5d · M ~1–2d · L ≥3d.

---

## Sprint 1 — Baseline & Reliability (в работе)

### Q-BASE-01 Synthetic perf fixtures + Node benches
- **User problem:** нет исходных цифр — только ощущения.
- **Solution:** генератор синтетических snapshot (D0/D100/D1k/D10k…); Node benches: search, dailyTotals, serialize.
- **AC:** fixtures воспроизводимы; benches печатают P50/P95; результаты в PERFORMANCE-BASELINE с пометкой **Node only**.
- **Deps:** none.
- **Effort:** M.

### Q-P0-01 Persist + kill-app durability
- **User problem:** потеря дневника после kill.
- **Solution:** протокол E18/E19 + Maestro/manual; опционально debug timing persist.
- **AC:** Pass на emulator **или** device (указать какое); 0 loss в N прогонах; результаты записаны.
- **Deps:** Q-BASE-01 полезен для large-history case.
- **Effort:** M.

### Q-P0-02 Double-submit guard
- **User problem:** дубли при быстрых тапах.
- **Solution:** inventory всех add CTA; покрыть `useAddGuard` / pure guard; unit тесты; закрыть дыры.
- **AC:** rapid taps → ≤1 entry на каждый критический путь (unit + manual spot-check).
- **Deps:** none.
- **Effort:** S–M.

### Q-P1-04 Measure repeat ≤10s
- **User problem:** north-star не доказан.
- **Solution:** протокол секундомера на device/emulator; n≥10–20; таблица в PERFORMANCE-BASELINE.
- **AC:** цифры с env/build; без подгонки; Pass/Fail относительно ≤10s явно.
- **Deps:** желательно smoke из этапа 1–2.
- **Effort:** S.

### Q-SMOKE-01 Android UI smoke skeleton
- **Solution:** Maestro (или документированный manual checklist) для: launch → add → see diary.
- **AC:** файл flow + README как запускать; если не гоняли — статус pending.
- **Effort:** M.

---

## Этап 3+ (после baseline) — Core UX

### Q-P1-01 Today above-the-fold
- После измерений. One primary CTA; меньше конкурирующих chips.
- **Effort:** M.

### Q-P1-02 Food diary vs catalog
- Сегменты / progressive catalog. Убрать путаницу с дневником.
- **Effort:** M.

### Q-P1-DISC Recipe discovery clarity
- **User problem:** непонятно, где искать рецепт (каталог / архив / план / sheet).
- **Solution:** продуктовая карта входов + упрощение copy/навигации (не новый экран ради экрана).
- **AC:** founder находит «повторить рецепт» ≤3 тапа в тесте.
- **Effort:** M.
- **Priority:** выше абстрактного рефакторинга repo.

### Q-P1-03 AddFoodSheet by responsibility
- Split по зонам ответственности + regression tests.
- **Не AC:** «каждый файл &lt;300 LOC».
- **Effort:** L.

### Q-P1-05 Virtualize only measured hotspots
- FlatList для каталога **если** baseline показывает jank на P1k/P10k.
- Не трогать короткие списки (привычки и т.п.) без нужды.
- **Effort:** M.

---

## Этап 5 — Polish

### Q-P2-01 Sync design docs to tokens.ts
### Q-P2-06 PR #20 review → merge или close
### Q-P2-07 TalkBack critical food path
### Q-P2-04/05 Progress/Profile IA — после food path

---

## Отложено / не самоцель

- Rewrite foodRepository  
- Normalized SQLite schema  
- Mechanical LOC splitting  
- FlatList everywhere  
- New AI / FP / sports features  

---

## Explicitly deferred (feature freeze)

- Live store prices / scrape  
- On-device OCR  
- Health Connect  
- AI coaching  
- FP-8+  
- New root tab  
- Social / sync backend  
