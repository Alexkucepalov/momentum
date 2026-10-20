# Android E2E Smoke Test Status

**Issue:** #67 FI Quality Sprint  
**Script:** `maestro/food-planner-smoke.yaml`  
**Created:** 2026-10-20  
**Status:** 🟡 **PENDING — Not yet run on real device**

---

## Rationale

Per `AGENTS.md`:
> "Pass only after real device — do not fake."

This E2E smoke script has been **created and validated syntactically**, but:
- ❌ Not yet executed on physical Android hardware.
- ❌ Not run on emulator (per acceptance criteria: "real device" required).
- ❌ Cannot claim PASS without actual device dogfood.

---

## Manual Checklist (Alternative to Maestro)

If Maestro is unavailable, use this manual checklist on device:

### Setup
- [ ] Build APK: `npm run build:apk:local`
- [ ] Install on Android device via `adb install -r apps/mobile/dist/momentum-dogfood.apk`
- [ ] Launch app; skip onboarding if any.

### Test Steps

#### 1. Purchase → Pantry
- [ ] Tap **План** → **Запасы дома**
- [ ] Add item: "Молоко" → select "Простоквашино" from suggestions
- [ ] Enter quantity: 930 g → select "Холодильник" → **Сохранить в запасы**
- [ ] Verify flash: "В запасах: Молоко Простоквашино"
- [ ] Verify item appears in pantry list with "930 г · в каталоге"

#### 2. Eat Now (Pantry-based)
- [ ] Back → **Что съесть сейчас?**
- [ ] Verify "Условный остаток на сегодня" card displays
- [ ] Tap filter **Дома**
- [ ] Scroll candidates list (may be empty if no catalog linkage or targets)
- [ ] Verify UI renders without crash

#### 3. Week Plan (Draft)
- [ ] Back → **Меню на неделю**
- [ ] Tap **Создать план**
- [ ] Enter days: 3 → **Создать черновик**
- [ ] Verify "План создан" flash
- [ ] Verify draft plan appears in list with status "draft"

#### 4. Shopping List
- [ ] Back → **Покупки**
- [ ] Tap **Создать из плана** → select the draft plan
- [ ] Verify shopping list opens with "Итого: 0 ₽" (empty plan) or aggregate if meals exist
- [ ] Verify no crash

#### 5. Budget (No auto-expense)
- [ ] Back → **Бюджет питания**
- [ ] Set limit: 10000 ₽ → **Сохранить лимит**
- [ ] Verify "Потрачено: 0 ₽" (pantry addition did NOT create expense)
- [ ] **Critical:** This validates "pantry/expense no double-write" acceptance criterion

#### 6. Planned ≠ Eaten (Diary Totals)
- [ ] Back → Tap **Еда** tab
- [ ] Verify **Дневник** section shows current date
- [ ] Verify total kcal = 0 (or prior value) — planned meal did NOT add to totals
- [ ] **Critical:** This validates "planned ≠ eaten" acceptance criterion

#### 7. Log Planned Meal (Optional)
- [ ] Back → **План** → **Меню на неделю** → open draft plan
- [ ] If planned meals exist, tap one → **В дневник**
- [ ] Verify diary entry created
- [ ] Back to **Еда** → verify totals now include that meal
- [ ] **Critical:** Only logged meals affect totals; planned meals alone do not

### Expected Result
- [ ] All steps complete without crash
- [ ] Pantry addition does not create expense
- [ ] Planned meals do not affect diary totals until logged
- [ ] Shopping list renders (empty or aggregated)
- [ ] Budget shows correct totals

---

## Next Steps

1. **Founder dogfood:** Run either Maestro script or manual checklist on physical Android device.
2. **Record result:** Update this file with PASS/FAIL + device info (model, Android version).
3. **Small fix PRs:** If defects found, create separate Issues per `AGENTS.md` (no auto-merge).

---

## Device Test Log (To Be Filled)

**Device:** *(e.g., Samsung Galaxy S24, Android 14)*  
**Date:** *(YYYY-MM-DD)*  
**Tester:** *(founder / QA)*  
**Result:** *(PASS / FAIL)*  
**Notes:** *(crashes, UI issues, acceptance criteria violations)*

---

**Status:** 🟡 PENDING — waiting for device validation.
