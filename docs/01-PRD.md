# PRD — Momentum / nf-fit | Updated 2026-11-01

> Dogfood product name in UI may still show Momentum; codebase brand is **nf-fit**.  
> Overhaul plan: `docs/PRODUCT-ROADMAP.md`. Audit: `docs/PRODUCT-OVERHAUL-AUDIT.md`.

## Vision
Joyful, low-friction personal companion joining food logging, habits, challenges, exercise, sleep and progress. User should enjoy returning without feeling punished for missed days.
## North-star promise
Log repeated food in under 10 seconds; understand progress at a glance; plan small achievable habits; own and export the data.
## Users
1. Busy self-tracker: repeats meals, prepares batch meals, wants accurate cooked portions, primarily Android.
2. Active generalist: cycling, gym and mixed sports; wants multiple sources without double-counting.
3. Goal-driven beginner: gentle and flexible challenge progression rather than rigid streaks.
## Jobs to be done
- When I eat a routine meal, save it almost instantly.
- When I cook in bulk, log the final cooked grams without re-entering raw ingredients.
- When I exercise or sleep, see contributions from my watch without inventing missing values.
- When I want analysis, copy a local report into ChatGPT myself (no silent cloud upload).
- When life interrupts, resume my goals without punishment.
## P0 MVP (vertical slice) — shipped
- Offline food diary (4 meal groups, recent/favorite, edit/delete, daily kcal & macros).
- Manual products with per-100g nutrition, serving grams, units and source metadata.
- Recipe builder using raw ingredient quantities + final cooked yield in grams.
- Personal goals & flexible weekly habit targets; manual workout events.
- Local export/delete, accessibility, non-judgmental copy.
## P1 dogfood — in progress / partial
- Barcode scan + Open Food Facts cached lookup, no-match label/manual fallback.
- Weight trend; progress charts; flexible PDF + **plain-text report for ChatGPT paste**.
- **Garmin Connect Personal API** (user’s own key in SecureStore): weight, activities+details, steps, **sleep summaries**.
- Zepp/Amazfit body CSV weight import (when scale data is not in Garmin Connect).
- Sleep UI inside **Движение** (Activity | Sleep) — 5 root tabs.
- Android home widget scaffold.
## P2
- Typed text/voice parsing; image recognition with human confirmation; multi-agent coaching, social challenges, optional backup/sync.
- Health Connect (distinct permission screen) — deferred vs Garmin Personal for founder dogfood.
## Explicit non-goals (still)
- Medical diagnosis, calorie prescription, fully autonomous coaching, paid subscriptions, feed/social network.
- **Direct ChatGPT/OpenAI API** from the app (clipboard paste only).
- Automatic Play production deployment, multi-platform launch, required cloud sync, store price scraping.
- Inventing КБЖУ; treating unknown as 0; auto-logging planned meals into the diary.
## Success criteria (hypotheses, not industry benchmarks)
- Median repeated meal entry ≤10s measured on a real device.
- ≥20/30 days active in founder dogfood; 0 data-loss defects; ≥95% local save reliability.
- Diary remains usable without network; no AI request on basic add/edit/delete.
- A cooked recipe portion retains historical nutritional values even if an ingredient changes.
## Key acceptance flows
F1 Save a 150g food item offline; totals update immediately; restart preserves item.
F2 Change entry to 180g; day totals recompute; undo deletion available.
F3 Recipe 400g raw ingredients, 300g cooked yield: adding 120g portion yields 40% of total recipe macros; prohibit yield ≤0.
F4 User sets 3 exercise sessions/week; arbitrary day changes do not destroy streak; week has local timezone handling.
F5 Backup/export file then delete account/data; data is no longer available locally after confirmation.
F6 Unavailable food metadata never silently becomes a guessed zero; display missing-field state.
