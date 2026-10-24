# Product Gaps & Opportunities

**HEAD:** `1da2d0ac` · Diagnostic only — classifications are inputs to founder+ChatGPT, not a backlog auto-create.

---

## JTBD scorecard

| JTBD | What works well | Workarounds users need | Excess | Missing | Classify |
|------|-----------------|------------------------|--------|---------|----------|
| Fast food diary | Recent + quick add + offline | Jump Today↔Food | Dual surfaces | Proven ≤10s | **Simplify** IA |
| Eat by remaining KBJU | `scoreEatNow` + tests | Manual browse if weak list | Scoring copy | Strong empty coaching | **Improve existing** |
| Cook from home | Pantry + coverage helpers | Keep pantry fresh manually | Form-heavy pantry | One-tap “cook from stock” | **Improve** + **Simplify** UI |
| Real recipes | Create/import/cook/batch | Correct import often | 3 create entries | — | **Merge** create |
| Shop without retype | Paste/OCR→preview→pantry | Fix parse lines | Stores screen | Live prices | **Improve** parse; **Hide** Stores; **Requires research** catalogs |
| Week menu | Generator + edit mode | Fight dense UI | Advanced knobs always visible | Calendar-first UX | **Simplify** |
| Budget control | Expenses from purchase | Enter prices manually | Forecast without completeness | Honest “% priced” | **Improve** |
| Habits & activity | Today habits + workouts | Separate from food story | Challenges? | Tighter links | **Hide/defer** challenges? |
| Progress | Weight + sparkline + soft delete | — | Challenge noise | Optional goal bands | **Improve existing** |

---

## Per-area answers

### 1. Fast diary
1. Good: offline, snapshot macros, recent.  
2. Bypass: use only Food tab or external notes.  
3. Excess: overlapping CTAs.  
4. Missing: measured one-tap re-log.  
5. Merge: Today composer + Food.  
6. Hide: secondary chips until logged once.  
7. External data: not required.  
8. Moat candidate: honest unknown + speed.

### 2. Eat Now
1. Good: domain scorer, pantry-first (#73).  
2. Bypass: Instagram/delivery.  
3. Excess: buy suggestions without prices.  
4. Missing: contextual entry from Today evening.  
5. Merge: with pantry cook intent.  
6. Hide: advanced filters.  
7. Needs data: better with pantry+targets (local).  
8. Moat: remainder-aware portions.

### 3. Pantry cook
1. Good: purchase→pantry path.  
2. Bypass: mental inventory.  
3. Excess: always-visible add form.  
4. Missing: stale-stock nudges.  
5. Merge: receipt confirm flash.  
6. —  
7. —  
8. Moat: receipt→stock→cook loop.

### 4. Recipes
1. Good: yield, batches, log serving.  
2. Bypass: paper recipes.  
3. Excess: duplicate create routes.  
4. Missing: clearer raw/cooked labeling everywhere.  
5. Merge: new+import.  
6. —  
7. Photo OCR for recipes UNVERIFIED/not primary.  
8. Moat: cooked batch fidelity.

### 5. Purchases
1. Good: parse+preview+catalog upsert.  
2. Bypass: Excel.  
3. Excess: Stores tab.  
4. Missing: retailer templates; device OCR proof.  
5. Merge: shop+receipt “after shop”.  
6. Hide Stores.  
7. **Cannot** do live shelf prices without BD/partner.  
8. Moat: on-device screenshot→stock privacy.

### 6. Week menu
1. Good: exists end-to-end.  
2. Bypass: Notes app.  
3. Excess: always-on composer density.  
4. Missing: lighter default horizon.  
5. Merge: shopping generate.  
6. Hide advanced diversity until needed.  
7. —  
8. Moat: plan↔pantry↔shop closed loop.

### 7. Budget
1. Good: real expenses from imports.  
2. Bypass: bank apps.  
3. Excess: fake precision.  
4. Missing: completeness meter.  
5. —  
6. Hide forecast until data.  
7. Prices need user/receipt — no scrape.  
8. Moat: privacy-local spend tied to food.

### 8–9. Habits / progress
Secondary to food north-star. Keep thin; avoid shame gamification.

---

## Classification legend (used above)

- **Improve existing** · **Simplify** · **Merge** · **Hide / defer** · **Remove candidate** · **New capability candidate** · **Requires research** · **Requires human approval**

### Requires human approval (examples)

- Enabling retailer auth / scrape  
- Cloud OCR or telemetry SDK  
- Schema split / destructive migration  
- Production Play/EAS release  
- Dispatcher on  

See `12-FOUNDER-DECISIONS.md`.

---

## Competitive advantage candidates (PROPOSED)

1. Offline honest nutrition (unknown≠0) + fast re-log.  
2. Privacy-preserving purchase screenshot→pantry.  
3. Closed loop: plan → shop → pantry → eat now → diary.  

Not unique yet if Android dogfood fails or IA stays fragmented.
