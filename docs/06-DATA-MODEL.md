# Data model + invariants
```text
Profile(id,timezone,units,locale,aiConsent,reminderPreference)
FoodProduct(id,name,barcode?,brand?,nutritionBasis=per100g,energyKcal?,proteinG?,fatG?,carbG?,source,sourceUpdatedAt)
Recipe(id,name,cookedYieldG,createdAt)  RecipeIngredient(id,recipeId,productId,rawGrams,nutritionSnapshot)
FoodEntry(id,dateLocal,meal,foodOrRecipeId?,displayName,grams,energyKcal?,proteinG?,fatG?,carbG?,source,snapshot,createdAt,deletedAt?)
WeightEntry(id,instant,kg,source)
Workout(id,startAt,type,durationSec,distanceM?,source,externalId?,fingerprint?,payload?)
Habit(id,name,kind,targetValue,unit,weekStartsOn,timezone,active)
HabitEvent(id,habitId,occurredOn,value,source)
Challenge(id,metric,source,target,periodStart,periodEnd,timezone,status)
AgentRun(id,kind,requestedAt,approvedAt?,toolCalls,costEstimate,status)
SyncOutbox(id,entity,entityId,operation,baseVersion,attempts,nextRetryAt)
```
- No negative masses or macros; absent ≠ 0.
- Energy sources: label energy may differ from macros by rounding/fiber. Preserve original and show discrepancy; never overwrite with inferred value.
- Recipe portion values = sum of ingredient nutrition × portionGrams / cookedYieldG, using **snapshots**. Weight loss during cooking does not remove nutrients. Custom additions (oil/condiments) are ingredients.
- FoodEntry stores calculated snapshot at creation; external edits must not rewrite history.
- DateLocal resolved in user's configured timezone, not naive server UTC date.
- Workouts from two integrations dedupe by source unique externalId and approximate timestamp/duration/distance fingerprint; near matches require confirmation.
- No workout kcal automatically added to food goal unless explicit setting.
- Daily totals skip null fields and mark them incomplete; never treat missing as zero.
- Store nutrition decimals carefully (fixed-point integer mg / kcal where appropriate or audited rounding policy).
API proposal examples:
`POST /food-entries` body {clientRequestId, meal, grams, productSnapshot, occurredAt}; 200 idempotent result.
`GET /nutrition/daily?date=YYYY-MM-DD&timezone=...` returns totals + hasUnknownFields.
`POST /agent/proposals` returns typed plan only, not committed mutations.
