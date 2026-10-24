# UX-03 — First-run targets

| Field | Value |
|-------|--------|
| Issue | #97 |
| Profile field | `targetsPromptDismissedAt` (null = may prompt) |

## Flow

1. Fresh install / empty KBJU targets → Today shows goals sheet once.  
2. **Save** → `setDailyNutritionTargets` (Profile SoT). Empty-all rejected (use Skip).  
3. **Skip («Позже»)** → `dismissTargetsOnboardingPrompt()` — **no** invented kcal.  
4. Later: Profile can set/edit targets anytime.

## Copy rules

No shame; explain Eat Now/budget weaker without goals.

## Tests

- `shouldShowTargetsOnboarding` true only when no targets + not dismissed  
- dismiss does not set daily* fields  
