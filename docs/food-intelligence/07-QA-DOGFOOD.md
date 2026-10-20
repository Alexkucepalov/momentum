# Food Intelligence — QA & Android dogfood

**Principle:** CI green ≠ product usable. Mark Pass only after real Android execution.

## Pre-slice gates

| Gate | Owner | Pass criteria |
|------|-------|---------------|
| Docs package review | Founder / PM | PRD + journeys + IA + sources + ADR + backlog reviewed |
| ADR-PURCHASES | Founder | Explicit approve before v14 migration |
| Consent copy | Founder | Cloud OCR/LLM text approved if used |
| Quality Freeze | Eng | Unrelated S2/device issues not blocked by FI docs |

## Slice 1 dogfood (receipt → pantry + expense)

**Device:** physical Android, dogfood APK build from slice branch (not production).  
**Fixtures:** synthetic receipts only — no real PII, no personal fiscal data in repo/logs.

### Script (≈15 min)

1. Cold start offline → open Food → Purchases / Import entry.  
2. Paste synthetic order text (known 5 food + 1 non-food lines).  
3. Preview: edit one qty, exclude non-food, leave one price null.  
4. Confirm → verify pantry counts and one FoodExpense.  
5. Re-import same paste → dedupe warning, no double pantry.  
6. Airplane mode: open confirmed purchase, edit display name, save.  
7. Optional photo path (if in build): screenshot of synthetic order → preview.  

### Pass / Fail

| Check | Pass |
|-------|------|
| Null price stays null (not 0) | Required |
| Unconfirmed cart never hits pantry | Required |
| Non-food excluded from pantry, optional expense flag | Required |
| Duplicate blocked or merged with user choice | Required |
| Offline edit persists after restart | Required |
| No receipt image/text in Metro/logcat | Required |
| Screenshots in PR use synthetic UI only | Required |

**Do not** mark device Pass from emulator-only or CI.

## Later slices (outline)

| Slice | Dogfood focus |
|-------|----------------|
| 2 | Empty pantry fallbacks; Eat Now from 3 pantry items |
| 3 | Plan meals ≠ eaten; shop list = missing only |
| 4 | Budget labels show source + freshness; stale ≠ live |

## Regression

- Existing Food Planner flows (plan, shop, budget stub) still work.  
- `npm run verify` before every FI PR.  
- Max 2 CI-fix push cycles per automation rules.
