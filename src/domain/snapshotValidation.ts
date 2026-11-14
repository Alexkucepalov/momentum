import { validateExercisePlan } from './strength/sessionReview';
import { validateCookedConsumption } from "./cookedConsumption";
import { assertLocalDate, assertLocalTime } from "../storage/validation";

type Row = Record<string, unknown>;
const tables: Record<string, string[]> = {
  products: ["name"],
  recipes: ["name", "cookedYieldG"],
  ingredients: ["recipeId", "displayName", "rawGrams"],
  entries: ["dateLocal", "meal", "displayName", "grams"],
  waterEntries: ["dateLocal", "ml"],
  weightEntries: ["weighedAt", "kg"],
  habitChecks: ["dateLocal", "habitKey", "done"],
  workouts: ["dateLocal", "type", "durationSec"],
  flexibleHabits: ["name", "timesPerWeek"],
  flexibleHabitEvents: ["habitId", "dateLocal"],
  savedMeals: ["name", "items"],
  challenges: [
    "name",
    "metric",
    "target",
    "periodStart",
    "periodEnd",
    "status",
  ],
  pantryItems: ["displayName", "location"],
  cookedBatches: ["recipeId", "initialYieldG", "remainingG"],
  mealPlans: ["startDate", "endDate", "status"],
  plannedMeals: [
    "planId",
    "dateLocal",
    "meal",
    "displayName",
    "grams",
    "status",
  ],
  shoppingLists: ["title", "status"],
  shoppingItems: ["listId", "displayName", "quantity", "unit"],
  productPrices: ["productKey", "priceRub", "unit", "observedOn"],
  foodBudgets: ["month", "limitRub"],
  foodExpenses: ["amountRub", "category", "spentOn"],
  storePreferences: ["storeId", "label", "selected"],
  purchases: ["status", "purchasedOn", "currency", "sourceKind", "fingerprint"],
  purchaseLines: ["purchaseId", "rawName", "displayName"],
  dailyActivityStats: ["dateLocal"],
  sleepNights: ["dateLocal"],
  strengthExercises: ["name", "primaryMuscles", "secondaryMuscles"],
  workoutTemplates: ["name"],
  workoutTemplateExercises: [
    "templateId",
    "exerciseId",
    "sortOrder",
    "targetSets",
  ],
  plannedActivities: ["dateLocal", "kind", "title", "sortOrder"],
  workoutSessions: ["dateLocal", "title", "status", "startedAt"],
  workoutSets: ["sessionId", "exerciseId", "setIndex", "completed"],
};
const createdTables = new Set(
  "products recipes entries waterEntries weightEntries workouts flexibleHabits flexibleHabitEvents savedMeals challenges pantryItems cookedBatches mealPlans plannedMeals shoppingLists shoppingItems productPrices foodBudgets foodExpenses purchases purchaseLines strengthExercises workoutTemplates plannedActivities workoutSessions workoutSets".split(
    " ",
  ),
);
const updatedTables = new Set(
  "products recipes entries habitChecks savedMeals pantryItems cookedBatches mealPlans plannedMeals shoppingLists shoppingItems productPrices foodBudgets foodExpenses storePreferences purchases purchaseLines dailyActivityStats sleepNights workoutTemplates".split(
    " ",
  ),
);
const numberFields = new Set(
  `basisQuantity energyKcal proteinG fatG carbG energyKcalPer100g proteinGPer100g fatGPer100g carbGPer100g cookedYieldG rawGrams grams ml kg durationSec distanceM calories avgHeartRate maxHeartRate avgPowerW maxPowerW normalizedPowerW avgCadence elevationGainM avgSpeedMps maxSpeedMps movingDurationSec steps activeKcal sleepSec deepSec lightSec remSec awakeSec avgSpo2 avgRespiration sleepScore timesPerWeek targetValue value target quantityG quantityCount initialYieldG remainingG budgetRub cookSessions quantity coveredByPantry needToBuy priceRub limitRub amountRub totalRub parseConfidence unitPriceRub lineTotalRub discountRub matchConfidence sortOrder targetSets targetRepsMin targetRepsMax restSec cardioMinutes feelingRpe setIndex weightKg reps targetWeightKg targetReps weekdayIndex waterTargetMl heightCm dailyEnergyKcal dailyProteinG dailyFatG dailyCarbG`.split(
    " ",
  ),
);
const booleanFields = new Set(
  "isFavorite done active checked selected isFood excluded completed".split(
    " ",
  ),
);
const dates = new Set(
  "dateLocal expiresOn startDate endDate periodStart periodEnd observedOn spentOn purchasedOn dogfoodStartedOn lastSyncedFrom lastSyncedTo".split(
    " ",
  ),
);
const timestamps = new Set(
  "restUntilAt cookedAt createdAt updatedAt deletedAt weighedAt startAt endAt pausedAt confirmedAt startedAt completedAt lastSuccessfulSyncAt lastAttemptAt".split(
    " ",
  ),
);
const textFields = new Set(
  "id name displayName brand barcode description instructions photoUri notes subtitle title unit equipment productId recipeId habitId planId listId templateId exerciseId sessionId plannedActivityId linkedWorkoutId externalId feelingNote productKey storeId storePreferenceId storeLabel fingerprint rawPayloadRef expenseId rawName packageSizeText retailerSku pantryItemId detailJson polylineJson chartJson priceAsOf lastError".split(
    " ",
  ),
);
const enums: Record<string, string[]> = {
  meal: ["breakfast", "lunch", "dinner", "snack"],
  defaultMeal: ["breakfast", "lunch", "dinner", "snack"],
  unit: ["g", "ml", "pcs"],
  location: ["fridge", "freezer", "pantry"],
  habitKey: ["walk", "stretch", "read"],
  type: ["cycling", "strength", "walking", "football", "other"],
  autoSource: ["any_workout", "walking", "cycling", "strength", "food_log"],
  metric: [
    "workouts_count",
    "activity_minutes",
    "food_log_days",
    "habit_completions",
  ],
  diversity: ["balanced", "fewer"],
  sourceKind: ["manual", "paste", "photo", "screenshots", "qr"],
  priceSource: ["user", "receipt", "estimate"],
  category: ["groceries", "cafe", "office", "delivery"],
  currency: ["RUB"],
};
function fail(path: string): never {
  throw new Error(`Некорректный экспорт: ${path}`);
}
function object(value: unknown, path: string): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path);
  return value as Row;
}
function validateRow(
  value: unknown,
  path: string,
  required: string[],
  table: string,
): Row {
  const row = object(value, path);
  const mustHave = [
    ...required,
    ...(createdTables.has(table) ? ["createdAt"] : []),
    ...(updatedTables.has(table) ? ["updatedAt"] : []),
  ];
  for (const key of ["energyKcal", "proteinG", "fatG", "carbG"]) {
    if (["products", "entries", "ingredients"].includes(table) && !(key in row))
      fail(`${path}.${key}`);
  }
  for (const key of mustHave) if (row[key] == null) fail(`${path}.${key}`);
  for (const [key, v] of Object.entries(row)) {
    if (v == null) continue; // Unknown is preserved; required fields were checked above.
    const field = `${path}.${key}`;
    if (
      numberFields.has(key) &&
      (typeof v !== "number" || !Number.isFinite(v) || v < 0)
    )
      fail(field);
    if (booleanFields.has(key) && typeof v !== "boolean") fail(field);
    if (
      (textFields.has(key) || dates.has(key) || timestamps.has(key)) &&
      typeof v !== "string"
    )
      fail(field);
    if (mustHave.includes(key) && typeof v === "string" && !v.trim())
      fail(field);
    if (dates.has(key)) {
      try {
        assertLocalDate(v as string);
      } catch {
        fail(field);
      }
    }
    if (timestamps.has(key) && !Number.isFinite(Date.parse(v as string)))
      fail(field);
    if (key === "timeLocal") {
      if (typeof v !== "string") fail(field);
      try {
        assertLocalTime(v);
      } catch {
        fail(field);
      }
    }
    if (
      enums[key] &&
      !(key === "unit" && table === "flexibleHabits") &&
      !enums[key].includes(v as string)
    )
      fail(field);
  }
  const statuses: Record<string, string[]> = {
    challenges: ["active", "completed", "abandoned"],
    mealPlans: ["draft", "active", "archived"],
    plannedMeals: ["planned", "logged", "skipped"],
    shoppingLists: ["open", "done", "archived"],
    purchases: [
      "cart",
      "submitted",
      "paid",
      "delivered",
      "fiscal_receipt",
      "cancelled",
    ],
    workoutSessions: ["in_progress", "completed", "abandoned"],
  };
  if (
    row.status != null &&
    statuses[table] &&
    !statuses[table].includes(row.status as string)
  )
    fail(`${path}.status`);
  if (row.kind != null) {
    const allowed =
      table === "flexibleHabits"
        ? ["checkbox", "quantity"]
        : ["strength", "cardio", "rest"];
    if (!allowed.includes(row.kind as string)) fail(`${path}.kind`);
  }
  if (row.source != null) {
    const allowed = ["products", "entries"].includes(table)
      ? ["user", "label", "catalog", "recipe", "missing"]
      : table === "pantryItems"
        ? ["user", "purchase"]
        : table === "flexibleHabitEvents"
          ? ["manual", "auto"]
          : table === "productPrices"
            ? ["user", "receipt", "estimate"]
            : ["user", "garmin", "zepp"];
    if (!allowed.includes(row.source as string)) fail(`${path}.source`);
  }
  if (table === 'workoutSessions' && row.exercisePlan !== undefined) {
    try { validateExercisePlan(row.exercisePlan); } catch { fail(`${path}.exercisePlan`); }
  }
  for (const key of ['draftWeightText', 'draftRepsText']) if (table === 'workoutSets' && row[key] !== undefined && (typeof row[key] !== 'string' || (row[key] as string).length > 32)) fail(`${path}.${key}`);
  for (const key of ['planNotes', 'notes']) if (['workoutSessions', 'workoutTemplates'].includes(table) && row[key] != null && (typeof row[key] !== 'string' || (row[key] as string).length > 4000)) fail(`${path}.${key}`);
  if (table === "entries" && row.cookedConsumption !== undefined) {
    try {
      validateCookedConsumption(row.cookedConsumption, row.grams as number);
    } catch {
      fail(`${path}.cookedConsumption`);
    }
    if (row.cookedConsumption.length && !row.recipeId) fail(`${path}.recipeId`);
  }
  if (table === "savedMeals") {
    if (!Array.isArray(row.items)) fail(`${path}.items`);
    row.items.forEach((v, i) =>
      validateRow(
        v,
        `${path}.items[${i}]`,
        ["displayName", "grams"],
        "savedMealItems",
      ),
    );
  }
  for (const key of ["primaryMuscles", "secondaryMuscles"])
    if (row[key] != null) {
      const v = row[key];
      const muscles = [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "legs",
        "core",
        "other",
      ];
      if (!Array.isArray(v) || v.some((m) => !muscles.includes(m)))
        fail(`${path}.${key}`);
    }
  if (row.hrZones != null) {
    if (!Array.isArray(row.hrZones)) fail(`${path}.hrZones`);
    row.hrZones.forEach((v, i) => {
      const z = object(v, `${path}.hrZones[${i}]`);
      if (
        !Number.isInteger(z.zone) ||
        (z.zone as number) < 1 ||
        (z.zone as number) > 5 ||
        typeof z.secs !== "number" ||
        !Number.isFinite(z.secs) ||
        z.secs < 0
      )
        fail(`${path}.hrZones[${i}]`);
    });
  }
  if (
    row.month != null &&
    (typeof row.month !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.month))
  )
    fail(`${path}.month`);
  for (const key of [
    "timesPerWeek",
    "weekdayIndex",
    "targetSets",
    "sortOrder",
    "setIndex",
    "reps",
    "targetReps",
    "targetRepsMin",
    "targetRepsMax",
    "feelingRpe",
  ]) {
    if (row[key] != null && !Number.isInteger(row[key])) fail(`${path}.${key}`);
  }
  for (const key of ["parseConfidence", "matchConfidence"])
    if (row[key] != null && (row[key] as number) > 1) fail(`${path}.${key}`);
  if (row.sleepScore != null && (row.sleepScore as number) > 100)
    fail(`${path}.sleepScore`);
  if (row.weekdayIndex != null && (row.weekdayIndex as number) > 6)
    fail(`${path}.weekdayIndex`);
  if (
    row.timesPerWeek != null &&
    ((row.timesPerWeek as number) < 1 || (row.timesPerWeek as number) > 7)
  )
    fail(`${path}.timesPerWeek`);
  if (
    row.feelingRpe != null &&
    ((row.feelingRpe as number) < 1 || (row.feelingRpe as number) > 10)
  )
    fail(`${path}.feelingRpe`);
  for (const key of ["kg", "cookedYieldG", "heightCm", "basisQuantity"])
    if (row[key] != null && (row[key] as number) <= 0) fail(`${path}.${key}`);
  return row;
}

/** Validate before normalization or replacement. Older absent sections remain optional; orphan references are valid historical snapshots. */
export function validateSnapshotPayload(snapshot: Row): void {
  const profile = validateRow(
    snapshot.profile,
    "profile",
    ["id", "timezone", "locale", "units"],
    "profile",
  );
  if (
    typeof profile.timezone !== "string" ||
    typeof profile.locale !== "string" ||
    profile.units !== "metric"
  )
    fail("profile");
  try {
    new Intl.DateTimeFormat(profile.locale, {
      timeZone: profile.timezone,
    }).format(0);
  } catch {
    fail("profile.timezone / locale");
  }
  for (const [table, required] of Object.entries(tables)) {
    const rows = snapshot[table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) fail(table);
    const ids = new Set<string>();
    rows.forEach((v, i) => {
      const row = validateRow(v, `${table}[${i}]`, ["id", ...required], table);
      if (typeof row.id !== "string" || !row.id.trim() || ids.has(row.id))
        fail(`${table}[${i}].id — повтор или пустое значение`);
      ids.add(row.id);
    });
  }
  const batches = new Map(
    ((snapshot.cookedBatches ?? []) as Row[]).map((b) => [b.id, b]),
  );
  for (const entry of (snapshot.entries ?? []) as Row[]) {
    for (const part of (entry.cookedConsumption ?? []) as Array<{
      batchId: string;
      grams: number;
    }>) {
      const batch = batches.get(part.batchId);
      if (batch && batch.recipeId !== entry.recipeId)
        fail("entries.cookedConsumption — другой рецепт");
    }
  }
  if (snapshot.garminSync != null)
    validateRow(snapshot.garminSync, "garminSync", [], "garminSync");
  if (snapshot.trainingCycle != null) {
    const cycle = validateRow(
      snapshot.trainingCycle,
      "trainingCycle",
      ["name", "slots"],
      "trainingCycle",
    );
    if (!Array.isArray(cycle.slots)) fail("trainingCycle.slots");
    cycle.slots.forEach((v, i) =>
      validateRow(
        v,
        `trainingCycle.slots[${i}]`,
        ["weekdayIndex", "kind", "title", "sortOrder"],
        "trainingCycle",
      ),
    );
  }
}
