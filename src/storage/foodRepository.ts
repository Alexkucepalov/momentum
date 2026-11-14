import { allocateCookedConsumption, cloneFoodEntry, cloneConsumption, validateCookedConsumption, mergeConsumption, planConsumptionChange } from '../domain/cookedConsumption';
import { completedTrainingFacts } from '../domain/completedTraining';
import { MEALS, resizeEntrySnapshot, type EntryDetails } from '../domain/diaryEntry';
import { sumActivityKcal } from '../domain/activityEnergy';
import { buildCookAgainInput, type CookAgainDraft } from '../domain/cookAgain';
import { mergeCommonFoodCatalog } from '../domain/commonFoodCatalog';
import { dogfoodStatus, type DogfoodStatus } from '../domain/dogfood';
import { parseExportJson, summarizeSnapshot, type ImportSummary } from '../domain/importExport';
import {
  buildPersonalProgramWeekDrafts,
  materializeSeedExercises,
  materializeSeedTemplates,
  previousCompletedSetsForExercise,
  type PreviousSetHint,
} from '../domain/strength';
import type {
  MuscleGroup,
  PlannedActivity,
  PlannedActivityKind,
  StrengthExercise,
  WorkoutSession,
  WorkoutSessionStatus,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  TrainingCycle,
} from '../domain/strength/types';
import {
  aggregateShopping,
  estimateBasketTotal,
  scaleIngredientGrams,
  shoppingKey,
  type BasketTotal,
} from '../domain/aggregateShopping';
import {
  projectOpenShoppingSpend,
  type ProjectedShoppingSpend,
} from '../domain/budgetProjection';
import {
  buildMonthBudgetSnapshot,
  estimateEatenCostRub,
  sumEatenCost,
  type MonthBudgetSnapshot,
} from '../domain/foodBudget';
import {
  buildMealPlanDraft,
  type MealPlanDiversity,
  type MealPlanPeriodDays,
} from '../domain/mealPlanDraft';
import { portion, type Nutrition } from '../domain/nutrition';
import { rankProductFrequency } from '../domain/productFrequency';
import { matchPurchaseProduct } from '../domain/matchPurchaseProduct';
import {
  isConfirmablePurchaseStatus,
  linesForPantryApply,
  purchaseFingerprint,
  resolveExpenseAmountRub,
} from '../domain/purchaseConfirm';
import { nutritionForRecipePortion } from '../domain/recipeNutrition';
import { suggestPantryLocation } from '../domain/suggestPantryLocation';
import { reconcileShoppingWithPurchaseLines } from '../domain/shoppingReconcile';
import { computeDailyTotals } from './dailyTotals';
import {
  assertLocalDate,
  assertLocalTime,
  assertNonNegativeFinite,
  assertPositiveFinite,
  assertRepetitions,
  nutritionFromProductFields,
} from './validation';
import type {
  CookedBatch,
  DailyNutritionTargets,
  DailyTotals,
  FoodBudget,
  FoodEntry,
  FoodExpense,
  FoodExpenseCategory,
  FoodProduct,
  HabitCheck,
  HabitKey,
  MealPlan,
  MealPlanStatus,
  MealSlot,
  NutritionSource,
  PantryItem,
  PantryLocation,
  PantrySource,
  PantryUnit,
  PlannedMeal,
  ProductPrice,
  Profile,
  Purchase,
  PurchaseLine,
  PurchaseSourceKind,
  PurchaseStatus,
  ShoppingItem,
  ShoppingList,
  ShoppingListStatus,
  ShoppingPriceSource,
  StorePreference,
  StorePreferenceId,
  Recipe,
  RecipeIngredient,
  SavedMeal,
  SavedMealItem,
  StoreSnapshot,
  StoreSnapshotAny,
  Challenge,
  ChallengeMetric,
  FlexibleHabit,
  FlexibleHabitEvent,
  HabitAutoSource,
  HabitKind,
  WaterEntry,
  WeightEntry,
  Workout,
  WorkoutType,
  DailyActivityStats,
  SleepNight,
  GarminSyncState,
  IntegrationSource,
} from './types';
import { STORE_SNAPSHOT_VERSION } from './types';
import { barcodeLookupCandidates } from '../integrations/barcodeNormalize';
import type { OffLookupResult } from '../integrations/openFoodFacts';

export type NewProductInput = {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  energyKcal?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbG?: number | null;
  source?: NutritionSource;
};

export type NewRecipeInput = {
  name: string;
  cookedYieldG: number;
  description?: string | null;
  instructions?: string | null;
  photoUri?: string | null;
  /** Finished dish per 100 g — optional; preferred when logging portions. */
  nutritionPer100g?: Nutrition | null;
  ingredients?: Array<{
    productId?: string | null;
    displayName: string;
    rawGrams: number;
    nutritionPer100g: Nutrition;
  }>;
};

export type UpdateRecipeInput = {
  name?: string;
  cookedYieldG?: number;
  description?: string | null;
  instructions?: string | null;
  photoUri?: string | null;
  nutritionPer100g?: Nutrition | null;
  ingredients?: Array<{
    productId?: string | null;
    displayName: string;
    rawGrams: number;
    nutritionPer100g: Nutrition;
  }>;
};

export type FoodRepository = {
  getProfile(): Profile;
  setWaterTargetMl(ml: number | null): Profile;
  setHeightCm(cm: number | null): Profile;
  setDailyNutritionTargets(targets: DailyNutritionTargets): Profile;
  startDogfood(dateLocal: string): Profile;
  clearDogfood(): Profile;
  dogfoodStatus(dateLocal: string): DogfoodStatus;
  listProducts(): FoodProduct[];
  listFavorites(): FoodProduct[];
  /**
   * Products ranked by diary log frequency (local index).
   * Empty if nothing logged yet — never invents catalog rows.
   */
  listFrequentProducts(limit?: number): FoodProduct[];
  createProduct(input: NewProductInput): FoodProduct;
  updateProductNutrition(
    productId: string,
    nutrition: {
      energyKcal: number | null;
      proteinG: number | null;
      fatG: number | null;
      carbG: number | null;
    },
  ): FoodProduct;
  findProductByBarcode(barcode: string): FoodProduct | null;
  /**
   * Attach barcode to an existing local product (offline OFF fallback).
   * Refuses if another product already owns this code.
   */
  linkBarcodeToProduct(productId: string, barcode: string): FoodProduct;
  upsertFromOffResult(result: Extract<OffLookupResult, { status: 'ok' }>): FoodProduct;
  setFavorite(productId: string, isFavorite: boolean): FoodProduct;
  listEntriesForDate(dateLocal: string): FoodEntry[];
  listRecentEntries(limit?: number): FoodEntry[];
  /** Last logged grams for a product (for scan auto-portion), or null. */
  lastGramsForProduct(productId: string): number | null;
  addEntryFromProduct(args: {
    productId: string;
    dateLocal: string;
    meal: MealSlot;
    grams: number;
  }): FoodEntry;
  addEntryFromRecipe(args: {
    recipeId: string;
    dateLocal: string;
    meal: MealSlot;
    grams: number;
    /** Absolute snapshot for this portion; if omitted, calculated from recipe. */
    nutritionSnapshot?: {
      energyKcal: number | null;
      proteinG: number | null;
      fatG: number | null;
      carbG: number | null;
    };
  }): FoodEntry;
  /** Log kcal/macros without a product card (MFP-style Quick Add). */
  addQuickEntry(args: {
    dateLocal: string;
    meal: MealSlot;
    displayName?: string;
    energyKcal: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    carbG?: number | null;
  }): FoodEntry;
  listSavedMeals(): SavedMeal[];
  createSavedMeal(input: {
    name: string;
    defaultMeal?: MealSlot | null;
    items: SavedMealItem[];
  }): SavedMeal;
  createSavedMealFromEntries(name: string, entries: FoodEntry[], defaultMeal?: MealSlot | null): SavedMeal;
  logSavedMeal(args: { savedMealId: string; dateLocal: string; meal: MealSlot }): FoodEntry[];
  softDeleteSavedMeal(savedMealId: string): SavedMeal;
  /** Atomic repeat from saved snapshots; supports deleted catalog cards and Quick Add. */
  copyDiaryEntries(args: { items: { entryId: string; grams?: number }[]; dateLocal: string; meal?: MealSlot }): FoodEntry[];
  updateEntryDetails(entryId: string, patch: Partial<EntryDetails>): FoodEntry;
  updateEntryGrams(entryId: string, grams: number): FoodEntry;
  softDeleteEntry(entryId: string): FoodEntry;
  undoDeleteEntry(entryId: string): FoodEntry;
  /** Undo fresh adds, including their exact cooked-batch consumption in this runtime. */
  undoDiaryAdds(entryIds: string[]): void;
  dailyTotals(dateLocal: string): DailyTotals;
  listRecipes(): Recipe[];
  getRecipe(recipeId: string): Recipe | null;
  getRecipeIngredients(recipeId: string): RecipeIngredient[];
  createRecipe(input: NewRecipeInput): Recipe;
  /**
   * Idempotent recipe upsert by stable id (e.g. import:…).
   * Does not touch diary entries. Skips if active recipe with same id exists.
   */
  importRecipeIfAbsent(
    recipeId: string,
    input: NewRecipeInput,
  ): { recipe: Recipe; created: boolean };
  updateRecipe(recipeId: string, input: UpdateRecipeInput): Recipe;
  softDeleteRecipe(recipeId: string): Recipe;
  restoreRecipe(id: string): Recipe;
  /**
   * Clone recipe as a cook batch with actual finished weight (and optional ingredient tweaks).
   * Does not mutate the source recipe — diary history stays valid.
   */
  cookAgainRecipe(
    recipeId: string,
    draft: CookAgainDraft,
    batchDateLocal: string,
  ): Recipe;
  addWater(dateLocal: string, ml: number): WaterEntry;
  waterMlForDate(dateLocal: string): number;
  listWaterForDate(dateLocal: string): WaterEntry[];
  removeWater(entryId: string): WaterEntry | null;
  restoreWater(entry: WaterEntry): void;
  addWeight(kg: number, weighedAt?: string): WeightEntry;
  updateManualWeight(id: string, kg: number): WeightEntry;
  removeManualWeight(id: string): WeightEntry;
  restoreManualWeight(entry: WeightEntry): void;
  listWeights(limit?: number): WeightEntry[];
  /** Weights from an integration (e.g. Garmin), newest first. */
  listIntegratedWeights(source: IntegrationSource, limit?: number): WeightEntry[];
  latestWeight(): WeightEntry | null;
  /**
   * Upsert Garmin (or other integration) weight by externalId.
   * Never overwrites source:'user' rows. Idempotent for same externalId.
   */
  upsertIntegratedWeight(input: {
    kg: number;
    weighedAt: string;
    source: IntegrationSource;
    externalId: string;
  }): WeightEntry | null;
  toggleHabit(dateLocal: string, habitKey: HabitKey): HabitCheck;
  isHabitDone(dateLocal: string, habitKey: HabitKey): boolean;
  addWorkout(input: {
    dateLocal: string;
    type: WorkoutType;
    durationSec: number;
    distanceM?: number | null;
    notes?: string | null;
  }): Workout;
  /**
   * Upsert Garmin workout by externalId. Never overwrites source:'user'.
   * Returns null when skipped (invalid / conflict with user).
   */
  upsertIntegratedWorkout(input: {
    dateLocal: string;
    type: WorkoutType;
    durationSec: number;
    distanceM?: number | null;
    notes?: string | null;
    source: IntegrationSource;
    externalId: string;
    calories?: number | null;
    avgHeartRate?: number | null;
    maxHeartRate?: number | null;
    avgPowerW?: number | null;
    maxPowerW?: number | null;
    normalizedPowerW?: number | null;
    avgCadence?: number | null;
    elevationGainM?: number | null;
    avgSpeedMps?: number | null;
    maxSpeedMps?: number | null;
    movingDurationSec?: number | null;
    hrZones?: Array<{ zone: number; secs: number }> | null;
    detailJson?: string | null;
    polylineJson?: string | null;
    chartJson?: string | null;
  }): Workout | null;
  getWorkoutById(workoutId: string): Workout | null;
  listWorkoutsForDate(dateLocal: string): Workout[];
  /** Workouts from an integration across dates, newest first. */
  listIntegratedWorkouts(source: IntegrationSource, limit?: number): Workout[];
  softDeleteWorkout(workoutId: string): Workout;
  restoreWorkout(workoutId: string): Workout;
  upsertDailyActivityStats(input: {
    dateLocal: string;
    steps?: number | null;
    distanceM?: number | null;
    activeKcal?: number | null;
    source: IntegrationSource;
    externalId?: string | null;
  }): DailyActivityStats;
  getDailyActivityStats(dateLocal: string): DailyActivityStats | null;
  /** Daily steps/distance rows for an integration, newest date first. */
  listIntegratedDailyActivityStats(source: IntegrationSource, limit?: number): DailyActivityStats[];
  upsertSleepNight(input: {
    dateLocal: string;
    sleepSec?: number | null;
    deepSec?: number | null;
    lightSec?: number | null;
    remSec?: number | null;
    awakeSec?: number | null;
    startAt?: string | null;
    endAt?: string | null;
    avgSpo2?: number | null;
    avgRespiration?: number | null;
    sleepScore?: number | null;
    source: IntegrationSource;
    externalId?: string | null;
  }): SleepNight;
  getSleepForDate(dateLocal: string): SleepNight | null;
  listSleepNights(limit?: number): SleepNight[];
  /** Manual duration entry; imported nights remain separate and untouched. */
  removeManualSleepNight(dateLocal: string): SleepNight | null;
  restoreManualSleepNight(night: SleepNight): void;
  getGarminSyncState(): GarminSyncState;
  setGarminSyncState(patch: Partial<GarminSyncState>): GarminSyncState;
  /**
   * Upsert built-in exercises/templates (personal program v2).
   * Refreshes lines for builtin template ids only — never rewrites WorkoutSession history.
   */
  ensureStrengthCatalog(): void;
  /**
   * Fill Mon–Sun planned activities from the personal program.
   * `replace` soft-deletes existing live plan cards in that week first.
   * Returns number of cards created.
   */
  applyStrengthProgramWeek(
    weekStartMonday: string,
    opts?: { replace?: boolean },
  ): { created: number };
  repeatTrainingWeek(sourceMonday: string, targetMonday: string): PlannedActivity[];
  getTrainingCycle(): TrainingCycle | null;
  saveTrainingCycle(input: Omit<TrainingCycle, 'updatedAt'>): TrainingCycle;
  restoreTrainingCycle(previous: TrainingCycle | null): void;
  applyTrainingCycleWeek(monday: string, opts?: { replace?: boolean }): { created: number };
  fillTrainingCycleWeeks(monday: string, weeks: number): { createdIds: string[]; skippedWeeks: number };
  linkPlannedCycling(activityId: string, workoutId: string | null): PlannedActivity;
  listStrengthExercises(): StrengthExercise[];
  getStrengthExercise(exerciseId: string): StrengthExercise | null;
  createStrengthExercise(input: {
    name: string;
    primaryMuscles?: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
    equipment?: string | null;
  }): StrengthExercise;
  softDeleteStrengthExercise(exerciseId: string): StrengthExercise;
  listWorkoutTemplates(): WorkoutTemplate[];
  getWorkoutTemplate(templateId: string): WorkoutTemplate | null;
  listTemplateExercises(templateId: string): WorkoutTemplateExercise[];
  createWorkoutTemplate(input: {
    name: string;
    subtitle?: string | null;
    exercises?: Array<{
      exerciseId: string;
      targetSets: number;
      targetRepsMin?: number | null;
      targetRepsMax?: number | null;
      restSec?: number | null;
      notes?: string | null;
    }>;
  }): WorkoutTemplate;
  updateWorkoutTemplate(
    templateId: string,
    fields: { name?: string; subtitle?: string | null },
  ): WorkoutTemplate;
  softDeleteWorkoutTemplate(templateId: string): WorkoutTemplate;
  setTemplateExercises(
    templateId: string,
    lines: Array<{
      exerciseId: string;
      targetSets: number;
      targetRepsMin?: number | null;
      targetRepsMax?: number | null;
      restSec?: number | null;
      notes?: string | null;
    }>,
  ): WorkoutTemplateExercise[];
  /** Swap adjacent line in template order. Does not touch sessions. */
  reorderTemplateExercise(
    templateId: string,
    lineId: string,
    direction: 'up' | 'down',
  ): WorkoutTemplateExercise[];
  listPlannedActivitiesForDate(dateLocal: string): PlannedActivity[];
  listPlannedActivitiesInWeek(weekStart: string): PlannedActivity[];
  addPlannedActivity(input: {
    dateLocal: string;
    timeLocal?: string | null;
    kind: PlannedActivityKind;
    title: string;
    subtitle?: string | null;
    templateId?: string | null;
    cardioMinutes?: number | null;
    sortOrder?: number;
  }): PlannedActivity;
  updatePlannedActivity(
    activityId: string,
    fields: {
      title?: string;
      subtitle?: string | null;
      timeLocal?: string | null;
      templateId?: string | null;
      cardioMinutes?: number | null;
    },
  ): PlannedActivity;
  /** Reorder within the same day. */
  reorderPlannedActivity(
    activityId: string,
    direction: 'up' | 'down',
  ): PlannedActivity[];
  /** Move calendar card only — never mutates WorkoutSession history. */
  movePlannedActivity(
    activityId: string,
    args: { dateLocal: string; timeLocal?: string | null; sortOrder?: number },
  ): PlannedActivity;
  /** Atomically exchange plan dates/order; source times and completed history stay intact. */
  swapPlannedActivities(firstId: string, secondId: string): [PlannedActivity, PlannedActivity];
  copyPlannedActivity(
    activityId: string,
    args: { dateLocal: string; timeLocal?: string | null },
  ): PlannedActivity;
  softDeletePlannedActivity(activityId: string): PlannedActivity;
  restorePlannedActivity(activityId: string): PlannedActivity;
  startWorkoutSession(input: {
    dateLocal: string;
    title: string;
    templateId?: string | null;
    plannedActivityId?: string | null;
  }): WorkoutSession;
  getWorkoutSession(sessionId: string): WorkoutSession | null;
  getWorkoutSessionForPlan(activityId: string): WorkoutSession | null;
  listWorkoutSessionsForDate(dateLocal: string): WorkoutSession[];
  listInProgressWorkoutSessions(): WorkoutSession[];
  completeWorkoutSession(
    sessionId: string,
    opts?: { feelingRpe?: number | null; feelingNote?: string | null },
  ): WorkoutSession;
  abandonWorkoutSession(sessionId: string): WorkoutSession;
  listWorkoutSets(sessionId: string): WorkoutSet[];
  /**
   * Upsert a set row. weightKg/reps may be null (unknown ≠ 0).
   * Rejects negative / non-finite numbers.
   */
  upsertWorkoutSet(input: {
    sessionId: string;
    exerciseId: string;
    setIndex: number;
    weightKg?: number | null;
    reps?: number | null;
    completed?: boolean;
    targetWeightKg?: number | null;
    targetReps?: number | null;
  }): WorkoutSet;
  completeWorkoutSet(
    setId: string,
    args: { weightKg: number | null; reps: number | null },
  ): WorkoutSet;
  softDeleteWorkoutSet(setId: string): WorkoutSet;
  previousSetsForExercise(
    exerciseId: string,
    excludeSessionId?: string | null,
  ): PreviousSetHint[];
  activityMinutesForDate(dateLocal: string): number;
  /** MET×weight estimate for the day; null if body weight unknown. Does not change food totals. */
  activityEnergyKcalForDate(dateLocal: string): number | null;
  createFlexibleHabit(
    name: string,
    timesPerWeek: number,
    opts?: {
      kind?: HabitKind;
      unit?: string | null;
      targetValue?: number | null;
      autoSource?: HabitAutoSource;
    },
  ): FlexibleHabit;
  listFlexibleHabits(): FlexibleHabit[];
  updateFlexibleHabit(
    habitId: string,
    fields: {
      name?: string;
      timesPerWeek?: number;
      kind?: HabitKind;
      unit?: string | null;
      targetValue?: number | null;
      autoSource?: HabitAutoSource;
      paused?: boolean;
    },
  ): FlexibleHabit;
  softDeleteFlexibleHabit(habitId: string): void;
  restoreFlexibleHabit(habitId: string): void;
  logFlexibleHabit(
    habitId: string,
    dateLocal: string,
    value?: number,
    source?: 'manual' | 'auto',
  ): FlexibleHabitEvent;
  unlogFlexibleHabit(habitId: string, dateLocal: string): void;
  setFlexibleHabitDayValue(habitId: string, dateLocal: string, value: number): void;
  isFlexibleHabitLogged(habitId: string, dateLocal: string): boolean;
  /** Measured value for the day; 0 if not logged. */
  flexibleHabitDayValue(habitId: string, dateLocal: string): number;
  flexibleHabitWeekStats(
    habitId: string,
    dateLocal: string,
  ): { completed: number; target: number; weekStart: string; unit: string | null; kind: HabitKind };
  /** Auto-credit matching habits after a workout (idempotent per day). */
  applyWorkoutHabitAutoCredit(args: {
    dateLocal: string;
    workoutType: WorkoutType;
    durationSec: number;
  }): FlexibleHabitEvent[];
  createChallenge(input: {
    name: string;
    metric: ChallengeMetric;
    target: number;
    periodStart: string;
    periodEnd: string;
    habitId?: string | null;
  }): Challenge;
  listChallenges(): Challenge[];
  abandonChallenge(challengeId: string): Challenge;
  softDeleteChallenge(challengeId: string): void;
  challengeProgress(
    challengeId: string,
  ): { current: number; target: number; ratio: number; status: Challenge['status'] };
  listPantryItems(): PantryItem[];
  upsertPantryItem(input: {
    id?: string;
    displayName: string;
    productId?: string | null;
    location: PantryLocation;
    quantityG?: number | null;
    quantityCount?: number | null;
    unit: PantryUnit;
    expiresOn?: string | null;
    source?: PantrySource;
  }): PantryItem;
  softDeletePantryItem(pantryItemId: string): PantryItem;
  restorePantryItem(id: string): PantryItem;
  listPurchases(): Purchase[];
  listPurchaseLines(purchaseId: string): PurchaseLine[];
  findPurchaseByFingerprint(fingerprint: string): Purchase | null;
  /**
   * Persist a confirmed purchase in one step: purchase + lines + pantry + optional expense.
   * Rejects duplicate fingerprints of already-confirmed purchases.
   * Status must be delivered | fiscal_receipt. Cart/paid alone never writes pantry.
   */
  confirmNewPurchase(input: {
    status: Extract<PurchaseStatus, 'delivered' | 'fiscal_receipt'>;
    sourceKind: PurchaseSourceKind;
    purchasedOn: string;
    storeLabel?: string | null;
    storePreferenceId?: string | null;
    totalRub?: number | null;
    parseConfidence?: number | null;
    rawPayloadRef?: string | null;
    expenseCategory?: FoodExpenseCategory;
    lines: Array<{
      rawName: string;
      displayName: string;
      quantity?: number | null;
      unit?: PantryUnit | null;
      packageSizeText?: string | null;
      unitPriceRub?: number | null;
      lineTotalRub?: number | null;
      discountRub?: number | null;
      isFood: boolean;
      excluded: boolean;
      productId?: string | null;
      barcode?: string | null;
      retailerSku?: string | null;
      matchConfidence?: number | null;
    }>;
  }): { purchase: Purchase; lines: PurchaseLine[]; pantryItems: PantryItem[]; expense: FoodExpense | null };
  listCookedBatches(opts?: { recipeId?: string; onlyRemaining?: boolean }): CookedBatch[];
  createCookedBatch(input: {
    recipeId: string;
    initialYieldG?: number;
    cookedAt?: string;
  }): CookedBatch;
  softDeleteCookedBatch(batchId: string): CookedBatch;
  listMealPlans(): MealPlan[];
  getMealPlan(planId: string): MealPlan | null;
  listPlannedMeals(planId: string): PlannedMeal[];
  /** Planned meals for a calendar day across active/draft plans (not archived). */
  listPlannedMealsForDate(dateLocal: string): PlannedMeal[];
  /**
   * Build a draft plan from recipes (does not log diary).
   * Empty recipe list → empty planned meals (allowed).
   */
  createMealPlanDraft(input: {
    startDateLocal: string;
    days: MealPlanPeriodDays;
    budgetRub?: number | null;
    cookSessions?: number;
    diversity?: MealPlanDiversity;
  }): MealPlan;
  /**
   * Ensure one draft/active plan covers Mon–Sun starting at weekStartMonday.
   * Expands an overlapping plan or creates an empty week draft. Never logs diary.
   */
  ensureWeekDraftPlan(weekStartMonday: string): MealPlan;
  activateMealPlan(planId: string): MealPlan;
  archiveMealPlan(planId: string): MealPlan;
  softDeleteMealPlan(planId: string): MealPlan;
  updatePlannedMealGrams(plannedMealId: string, grams: number): PlannedMeal;
  movePlannedMeal(
    plannedMealId: string,
    args: { dateLocal: string; meal: MealSlot },
  ): PlannedMeal;
  replacePlannedMeal(
    plannedMealId: string,
    args: {
      recipeId?: string | null;
      productId?: string | null;
      displayName: string;
      grams: number;
    },
  ): PlannedMeal;
  softDeletePlannedMeal(plannedMealId: string): PlannedMeal;
  restorePlannedMeal(id: string): PlannedMeal;
  undoPlannedMealLog(id: string, entryId: string): void;
  /**
   * Add a planned meal for a calendar day (never diary). Uses draft/active plan
   * covering the date, or creates an empty 1-day draft.
   */
  addPlannedMeal(input: {
    dateLocal: string;
    meal: MealSlot;
    displayName: string;
    grams: number;
    recipeId?: string | null;
    productId?: string | null;
  }): PlannedMeal;
  /**
   * Explicitly log a planned meal into the diary. Marks planned status `logged`.
   * Never auto-called on plan create.
   */
  logPlannedMealToDiary(plannedMealId: string): FoodEntry;
  listShoppingLists(): ShoppingList[];
  getShoppingList(listId: string): ShoppingList | null;
  listShoppingItems(listId: string): ShoppingItem[];
  /** Empty open list for manual lines. */
  createEmptyShoppingList(title?: string): ShoppingList;
  /** Build list from meal plan ingredients; does not invent prices. */
  createShoppingListFromPlan(planId: string, title?: string): ShoppingList;
  /** Missing ingredients for one recipe vs pantry (portion = cookedYield). */
  createShoppingListFromRecipe(recipeId: string, title?: string): ShoppingList;
  addShoppingItem(input: {
    listId: string;
    displayName: string;
    quantity: number;
    unit: PantryUnit;
    productId?: string | null;
  }): ShoppingItem;
  /**
   * After a confirmed purchase: reduce needToBuy / check off matching open-list lines.
   * Unknown purchase qty does not auto-cover.
   */
  reconcileOpenShoppingWithPurchase(purchaseId: string): { patched: number };
  setShoppingItemChecked(itemId: string, checked: boolean): ShoppingItem;
  setShoppingItemPrice(
    itemId: string,
    args: { priceRub: number | null; priceAsOf?: string | null; priceSource?: ShoppingPriceSource | null },
  ): ShoppingItem;
  softDeleteShoppingList(listId: string): ShoppingList;
  shoppingBasketTotal(listId: string): BasketTotal;
  /** Projected spend from open shopping lists (user prices only — never live shelf). */
  openShoppingProjection(): ProjectedShoppingSpend;
  upsertProductPrice(input: {
    basisQuantity?: number;
    productKey: string;
    priceRub: number;
    unit: PantryUnit;
    observedOn: string;
    storeId?: string | null;
    source?: ShoppingPriceSource;
  }): ProductPrice;
  getFoodBudget(month: string): FoodBudget | null;
  setFoodBudget(month: string, limitRub: number): FoodBudget;
  listFoodExpenses(month: string): FoodExpense[];
  addFoodExpense(input: {
    amountRub: number;
    category: FoodExpenseCategory;
    spentOn: string;
    note?: string | null;
  }): FoodExpense;
  softDeleteFoodExpense(expenseId: string): FoodExpense;
  restoreFoodExpense(id: string): FoodExpense;
  monthBudgetSnapshot(month: string, asOfDateLocal: string): MonthBudgetSnapshot;
  /**
   * Amortized cost of diary entries in month using latest user product prices.
   * Prices for g/ml are treated as ₽ per 1000 g/ml; pcs as ₽ per 1 piece.
   * Incomplete when any entry lacks a matching price (unknown ≠ 0).
   */
  monthEatenCostEstimate(month: string): {
    totalRub: number | null;
    knownSumRub: number | null;
    knownCount: number;
    totalCount: number;
    incomplete: boolean;
  };
  listStorePreferences(): StorePreference[];
  setStorePreferenceSelected(storeId: StorePreferenceId, selected: boolean): StorePreference;
  exportAll(): string;
  /**
   * Replace all local data from export JSON (validated).
   * Returns a short summary for UI confirmation feedback.
   */
  importAll(json: string): ImportSummary;
  deleteAllUserData(): void;
  toSnapshot(): StoreSnapshot;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProfile(raw: StoreSnapshotAny['profile']): Profile {
  return {
    id: raw.id,
    timezone: raw.timezone,
    locale: raw.locale,
    units: 'metric',
    waterTargetMl: raw.waterTargetMl === undefined ? 2000 : raw.waterTargetMl,
    dogfoodStartedOn: raw.dogfoodStartedOn ?? null,
    heightCm: raw.heightCm ?? null,
    dailyEnergyKcal: raw.dailyEnergyKcal ?? null,
    dailyProteinG: raw.dailyProteinG ?? null,
    dailyFatG: raw.dailyFatG ?? null,
    dailyCarbG: raw.dailyCarbG ?? null,
  };
}

function normalizeRecipe(raw: StoreSnapshotAny['recipes'][number]): Recipe {
  return {
    id: raw.id,
    name: raw.name,
    cookedYieldG: raw.cookedYieldG,
    description: raw.description ?? null,
    instructions: raw.instructions ?? null,
    photoUri: raw.photoUri ?? null,
    energyKcalPer100g: raw.energyKcalPer100g ?? null,
    proteinGPer100g: raw.proteinGPer100g ?? null,
    fatGPer100g: raw.fatGPer100g ?? null,
    carbGPer100g: raw.carbGPer100g ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt,
  };
}

function normalizeFlexibleHabit(raw: NonNullable<StoreSnapshotAny['flexibleHabits']>[number]): FlexibleHabit {
  return {
    id: raw.id,
    name: raw.name,
    timesPerWeek: raw.timesPerWeek,
    kind: raw.kind === 'quantity' ? 'quantity' : 'checkbox',
    unit: raw.unit ?? null,
    targetValue: raw.targetValue ?? null,
    pausedAt: raw.pausedAt ?? null,
    autoSource: raw.autoSource ?? null,
    active: raw.active,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeFlexibleHabitEvent(
  raw: NonNullable<StoreSnapshotAny['flexibleHabitEvents']>[number],
): FlexibleHabitEvent {
  return {
    id: raw.id,
    habitId: raw.habitId,
    dateLocal: raw.dateLocal,
    value: typeof raw.value === 'number' && Number.isFinite(raw.value) ? raw.value : 1,
    source: raw.source === 'auto' ? 'auto' : 'manual',
    createdAt: raw.createdAt,
  };
}

function normalizePantryItem(raw: PantryItem): PantryItem {
  const location: PantryLocation =
    raw.location === 'freezer' || raw.location === 'pantry' ? raw.location : 'fridge';
  const unit: PantryUnit = raw.unit === 'ml' || raw.unit === 'pcs' ? raw.unit : 'g';
  const source: PantrySource = raw.source === 'purchase' ? 'purchase' : 'user';
  return {
    id: raw.id,
    displayName: raw.displayName,
    productId: raw.productId ?? null,
    location,
    quantityG: raw.quantityG ?? null,
    quantityCount: raw.quantityCount ?? null,
    unit,
    expiresOn: raw.expiresOn ?? null,
    source,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizePurchaseStatus(raw: PurchaseStatus | string | undefined): PurchaseStatus {
  const allowed: PurchaseStatus[] = [
    'cart',
    'submitted',
    'paid',
    'delivered',
    'fiscal_receipt',
    'cancelled',
  ];
  return allowed.includes(raw as PurchaseStatus) ? (raw as PurchaseStatus) : 'cart';
}

function normalizePurchase(raw: Purchase): Purchase {
  const sourceKind: PurchaseSourceKind =
    raw.sourceKind === 'paste' ||
    raw.sourceKind === 'photo' ||
    raw.sourceKind === 'screenshots' ||
    raw.sourceKind === 'qr'
      ? raw.sourceKind
      : 'manual';
  return {
    id: raw.id,
    status: normalizePurchaseStatus(raw.status),
    storePreferenceId: raw.storePreferenceId ?? null,
    storeLabel: raw.storeLabel ?? null,
    purchasedOn: raw.purchasedOn,
    currency: 'RUB',
    totalRub: raw.totalRub ?? null,
    sourceKind,
    fingerprint: raw.fingerprint,
    rawPayloadRef: raw.rawPayloadRef ?? null,
    parseConfidence: raw.parseConfidence ?? null,
    confirmedAt: raw.confirmedAt ?? null,
    expenseId: raw.expenseId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizePurchaseLine(raw: PurchaseLine): PurchaseLine {
  const unit: PantryUnit | null =
    raw.unit === 'g' || raw.unit === 'ml' || raw.unit === 'pcs' ? raw.unit : null;
  return {
    id: raw.id,
    purchaseId: raw.purchaseId,
    rawName: raw.rawName,
    displayName: raw.displayName,
    quantity: raw.quantity ?? null,
    unit,
    packageSizeText: raw.packageSizeText ?? null,
    unitPriceRub: raw.unitPriceRub ?? null,
    lineTotalRub: raw.lineTotalRub ?? null,
    discountRub: raw.discountRub ?? null,
    isFood: !!raw.isFood,
    excluded: !!raw.excluded,
    productId: raw.productId ?? null,
    barcode: raw.barcode ?? null,
    retailerSku: raw.retailerSku ?? null,
    matchConfidence: raw.matchConfidence ?? null,
    pantryItemId: raw.pantryItemId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeCookedBatch(raw: CookedBatch): CookedBatch {
  return {
    id: raw.id,
    recipeId: raw.recipeId,
    cookedAt: raw.cookedAt,
    initialYieldG: raw.initialYieldG,
    remainingG: raw.remainingG,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeMealPlan(raw: MealPlan): MealPlan {
  const status: MealPlanStatus =
    raw.status === 'active' || raw.status === 'archived' ? raw.status : 'draft';
  return {
    id: raw.id,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status,
    budgetRub: raw.budgetRub ?? null,
    cookSessions: raw.cookSessions ?? null,
    diversity: raw.diversity === 'fewer' ? 'fewer' : raw.diversity === 'balanced' ? 'balanced' : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizePlannedMeal(raw: PlannedMeal): PlannedMeal {
  const status =
    raw.status === 'logged' || raw.status === 'skipped' ? raw.status : 'planned';
  return {
    id: raw.id,
    planId: raw.planId,
    dateLocal: raw.dateLocal,
    meal: raw.meal,
    recipeId: raw.recipeId ?? null,
    productId: raw.productId ?? null,
    displayName: raw.displayName,
    grams: raw.grams,
    status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeShoppingList(raw: ShoppingList): ShoppingList {
  const status: ShoppingListStatus =
    raw.status === 'done' || raw.status === 'archived' ? raw.status : 'open';
  return {
    id: raw.id,
    planId: raw.planId ?? null,
    title: raw.title,
    status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeShoppingItem(raw: ShoppingItem): ShoppingItem {
  const unit: PantryUnit = raw.unit === 'ml' || raw.unit === 'pcs' ? raw.unit : 'g';
  const priceSource: ShoppingPriceSource | null =
    raw.priceSource === 'user' || raw.priceSource === 'receipt' || raw.priceSource === 'estimate'
      ? raw.priceSource
      : null;
  return {
    id: raw.id,
    listId: raw.listId,
    displayName: raw.displayName,
    quantity: raw.quantity,
    unit,
    coveredByPantry: raw.coveredByPantry ?? 0,
    needToBuy: raw.needToBuy ?? raw.quantity,
    checked: !!raw.checked,
    priceRub: raw.priceRub ?? null,
    priceAsOf: raw.priceAsOf ?? null,
    priceSource,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeProductPrice(raw: ProductPrice): ProductPrice {
  const unit: PantryUnit = raw.unit === 'ml' || raw.unit === 'pcs' ? raw.unit : 'g';
  const source: ShoppingPriceSource =
    raw.source === 'receipt' || raw.source === 'estimate' ? raw.source : 'user';
  return {
    basisQuantity: raw.basisQuantity ?? null,
    id: raw.id,
    productKey: raw.productKey,
    storeId: raw.storeId ?? null,
    priceRub: raw.priceRub,
    unit,
    observedOn: raw.observedOn,
    source,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

const DEFAULT_STORES: Array<{ storeId: StorePreferenceId; label: string }> = [
  { storeId: 'pyaterochka', label: 'Пятёрочка' },
  { storeId: 'chizhik', label: 'Чижик' },
  { storeId: 'krasnoe_beloe', label: 'Красное & Белое' },
  { storeId: 'metro', label: 'METRO' },
  { storeId: 'samokat', label: 'Самокат' },
  { storeId: 'perekrestok', label: 'Перекрёсток' },
  { storeId: 'magnit', label: 'Магнит' },
  { storeId: 'vkusvill', label: 'ВкусВилл' },
  { storeId: 'other', label: 'Другие' },
];

function defaultStorePreferences(updatedAt: string): StorePreference[] {
  return DEFAULT_STORES.map((s) => ({
    id: `store:${s.storeId}`,
    storeId: s.storeId,
    label: s.label,
    selected: false,
    updatedAt,
  }));
}

function normalizeFoodBudget(raw: FoodBudget): FoodBudget {
  return {
    id: raw.id,
    month: raw.month,
    limitRub: raw.limitRub,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeFoodExpense(raw: FoodExpense): FoodExpense {
  const category: FoodExpenseCategory =
    raw.category === 'cafe' || raw.category === 'office' || raw.category === 'delivery'
      ? raw.category
      : 'groceries';
  return {
    id: raw.id,
    amountRub: raw.amountRub,
    category,
    spentOn: raw.spentOn,
    note: raw.note ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeStorePreference(raw: StorePreference): StorePreference {
  return {
    id: raw.id,
    storeId: raw.storeId,
    label: raw.label,
    selected: !!raw.selected,
    updatedAt: raw.updatedAt,
  };
}

function normalizeIntegrationSource(raw: unknown): IntegrationSource {
  if (raw === 'garmin') return 'garmin';
  if (raw === 'zepp') return 'zepp';
  return 'user';
}

function normalizeWeightEntry(raw: NonNullable<StoreSnapshotAny['weightEntries']>[number]): WeightEntry {
  return {
    id: raw.id,
    weighedAt: raw.weighedAt,
    kg: raw.kg,
    source: normalizeIntegrationSource(raw.source),
    externalId: raw.externalId ?? null,
    createdAt: raw.createdAt,
  };
}

function normalizeWorkout(raw: NonNullable<StoreSnapshotAny['workouts']>[number]): Workout {
  const hrZones = Array.isArray(raw.hrZones)
    ? raw.hrZones
        .map((z) => ({
          zone: typeof z?.zone === 'number' ? z.zone : 0,
          secs: typeof z?.secs === 'number' ? z.secs : 0,
        }))
        .filter((z) => z.zone > 0 && z.secs >= 0)
    : null;
  return {
    id: raw.id,
    dateLocal: raw.dateLocal,
    type: raw.type,
    durationSec: raw.durationSec,
    distanceM: raw.distanceM ?? null,
    notes: raw.notes ?? null,
    source: normalizeIntegrationSource(raw.source),
    externalId: raw.externalId ?? null,
    calories: raw.calories ?? null,
    avgHeartRate: raw.avgHeartRate ?? null,
    maxHeartRate: raw.maxHeartRate ?? null,
    avgPowerW: raw.avgPowerW ?? null,
    maxPowerW: raw.maxPowerW ?? null,
    normalizedPowerW: raw.normalizedPowerW ?? null,
    avgCadence: raw.avgCadence ?? null,
    elevationGainM: raw.elevationGainM ?? null,
    avgSpeedMps: raw.avgSpeedMps ?? null,
    maxSpeedMps: raw.maxSpeedMps ?? null,
    movingDurationSec: raw.movingDurationSec ?? null,
    hrZones: hrZones && hrZones.length > 0 ? hrZones : null,
    detailJson: raw.detailJson ?? null,
    polylineJson: raw.polylineJson ?? null,
    chartJson: raw.chartJson ?? null,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeSleepNight(raw: SleepNight): SleepNight {
  return {
    id: raw.id,
    dateLocal: raw.dateLocal,
    sleepSec: raw.sleepSec ?? null,
    deepSec: raw.deepSec ?? null,
    lightSec: raw.lightSec ?? null,
    remSec: raw.remSec ?? null,
    awakeSec: raw.awakeSec ?? null,
    startAt: raw.startAt ?? null,
    endAt: raw.endAt ?? null,
    avgSpo2: raw.avgSpo2 ?? null,
    avgRespiration: raw.avgRespiration ?? null,
    sleepScore: raw.sleepScore ?? null,
    source: normalizeIntegrationSource(raw.source),
    externalId: raw.externalId ?? null,
    updatedAt: raw.updatedAt,
  };
}

function normalizeDailyActivityStats(raw: DailyActivityStats): DailyActivityStats {
  return {
    id: raw.id,
    dateLocal: raw.dateLocal,
    steps: raw.steps ?? null,
    distanceM: raw.distanceM ?? null,
    activeKcal: raw.activeKcal ?? null,
    source: normalizeIntegrationSource(raw.source),
    externalId: raw.externalId ?? null,
    updatedAt: raw.updatedAt,
  };
}

function emptyGarminSync(): GarminSyncState {
  return {
    lastSuccessfulSyncAt: null,
    lastAttemptAt: null,
    lastError: null,
    lastSyncedFrom: null,
    lastSyncedTo: null,
  };
}

function normalizeGarminSync(raw?: Partial<GarminSyncState> | null): GarminSyncState {
  const base = emptyGarminSync();
  if (!raw) return base;
  return {
    lastSuccessfulSyncAt: raw.lastSuccessfulSyncAt ?? null,
    lastAttemptAt: raw.lastAttemptAt ?? null,
    lastError: raw.lastError ?? null,
    lastSyncedFrom: raw.lastSyncedFrom ?? null,
    lastSyncedTo: raw.lastSyncedTo ?? null,
  };
}

function normalizeStrengthExercise(raw: StrengthExercise): StrengthExercise {
  return {
    id: raw.id,
    name: raw.name,
    primaryMuscles: [...(raw.primaryMuscles ?? [])],
    secondaryMuscles: [...(raw.secondaryMuscles ?? [])],
    equipment: raw.equipment ?? null,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeWorkoutTemplate(raw: WorkoutTemplate): WorkoutTemplate {
  return {
    id: raw.id,
    name: raw.name,
    subtitle: raw.subtitle ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeWorkoutTemplateExercise(raw: WorkoutTemplateExercise): WorkoutTemplateExercise {
  return {
    id: raw.id,
    templateId: raw.templateId,
    exerciseId: raw.exerciseId,
    sortOrder: raw.sortOrder,
    targetSets: raw.targetSets,
    targetRepsMin: raw.targetRepsMin ?? null,
    targetRepsMax: raw.targetRepsMax ?? null,
    restSec: raw.restSec ?? null,
    notes: raw.notes ?? null,
  };
}

function cloneTrainingCycle(raw: TrainingCycle): TrainingCycle {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim() || !Array.isArray(raw.slots) || raw.slots.length > 100) throw new Error('Некорректный шаблон недели');
  const slots = raw.slots.map((slot, index) => {
    if (!slot || !Number.isInteger(slot.weekdayIndex) || slot.weekdayIndex < 0 || slot.weekdayIndex > 6 || !['strength', 'cardio', 'rest'].includes(slot.kind) || typeof slot.title !== 'string' || !slot.title.trim()) throw new Error('Некорректный день в шаблоне');
    assertLocalTime(slot.timeLocal ?? null);
    if (slot.cardioMinutes != null) assertNonNegativeFinite(slot.cardioMinutes, 'cardioMinutes');
    if (slot.kind === 'strength' && !slot.templateId) throw new Error('Выбери шаблон упражнений для силовой');
    return { weekdayIndex: slot.weekdayIndex, kind: slot.kind, title: slot.title.trim(), subtitle: slot.subtitle?.trim() || null, templateId: slot.kind === 'strength' ? slot.templateId : null, timeLocal: slot.timeLocal ?? null, cardioMinutes: slot.kind === 'cardio' ? slot.cardioMinutes ?? null : null, sortOrder: Number.isInteger(slot.sortOrder) && slot.sortOrder >= 0 ? slot.sortOrder : index };
  });
  return { name: raw.name.trim(), slots, updatedAt: raw.updatedAt };
}

function normalizePlannedActivity(raw: PlannedActivity): PlannedActivity {
  return {
    linkedWorkoutId: raw.linkedWorkoutId ?? null,
    id: raw.id,
    dateLocal: raw.dateLocal,
    timeLocal: raw.timeLocal ?? null,
    kind: raw.kind,
    title: raw.title,
    subtitle: raw.subtitle ?? null,
    templateId: raw.templateId ?? null,
    cardioMinutes: raw.cardioMinutes ?? null,
    sortOrder: raw.sortOrder ?? 0,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeWorkoutSession(
  raw: WorkoutSession & { feelingRpe?: number | null; feelingNote?: string | null },
): WorkoutSession {
  return {
    id: raw.id,
    dateLocal: raw.dateLocal,
    templateId: raw.templateId ?? null,
    plannedActivityId: raw.plannedActivityId ?? null,
    title: raw.title,
    status: raw.status,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt ?? null,
    feelingRpe: raw.feelingRpe ?? null,
    feelingNote: raw.feelingNote ?? null,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeWorkoutSet(raw: WorkoutSet): WorkoutSet {
  return {
    id: raw.id,
    sessionId: raw.sessionId,
    exerciseId: raw.exerciseId,
    setIndex: raw.setIndex,
    weightKg: raw.weightKg ?? null,
    reps: raw.reps ?? null,
    completed: Boolean(raw.completed),
    completedAt: raw.completedAt ?? null,
    targetWeightKg: raw.targetWeightKg ?? null,
    targetReps: raw.targetReps ?? null,
    createdAt: raw.createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

function normalizeSnapshot(raw?: StoreSnapshotAny): StoreSnapshot | undefined {
  if (!raw) return undefined;
  const ts = nowIso();
  const prefs = (raw.storePreferences ?? []).map(normalizeStorePreference);
  return {
    trainingCycle: raw.trainingCycle ? cloneTrainingCycle(raw.trainingCycle) : null,
    version: STORE_SNAPSHOT_VERSION,
    profile: normalizeProfile(raw.profile),
    products: raw.products ?? [],
    recipes: (raw.recipes ?? []).map(normalizeRecipe),
    ingredients: raw.ingredients ?? [],
    entries: (raw.entries ?? []).map(cloneFoodEntry),
    waterEntries: raw.waterEntries ?? [],
    weightEntries: (raw.weightEntries ?? []).map(normalizeWeightEntry),
    habitChecks: raw.habitChecks ?? [],
    workouts: (raw.workouts ?? []).map(normalizeWorkout),
    flexibleHabits: (raw.flexibleHabits ?? []).map(normalizeFlexibleHabit),
    flexibleHabitEvents: (raw.flexibleHabitEvents ?? []).map(normalizeFlexibleHabitEvent),
    savedMeals: (raw.savedMeals ?? []).map((m) => ({
      ...m,
      items: m.items.map((i) => ({ ...i })),
    })),
    challenges: (raw.challenges ?? []).map((c) => ({ ...c })),
    pantryItems: (raw.pantryItems ?? []).map(normalizePantryItem),
    cookedBatches: (raw.cookedBatches ?? []).map(normalizeCookedBatch),
    mealPlans: (raw.mealPlans ?? []).map(normalizeMealPlan),
    plannedMeals: (raw.plannedMeals ?? []).map(normalizePlannedMeal),
    shoppingLists: (raw.shoppingLists ?? []).map(normalizeShoppingList),
    shoppingItems: (raw.shoppingItems ?? []).map(normalizeShoppingItem),
    productPrices: (raw.productPrices ?? []).map(normalizeProductPrice),
    foodBudgets: (raw.foodBudgets ?? []).map(normalizeFoodBudget),
    foodExpenses: (raw.foodExpenses ?? []).map(normalizeFoodExpense),
    storePreferences: prefs.length > 0 ? prefs : defaultStorePreferences(ts),
    purchases: (raw.purchases ?? []).map(normalizePurchase),
    purchaseLines: (raw.purchaseLines ?? []).map(normalizePurchaseLine),
    dailyActivityStats: (raw.dailyActivityStats ?? []).map(normalizeDailyActivityStats),
    sleepNights: (raw.sleepNights ?? []).map(normalizeSleepNight),
    garminSync: normalizeGarminSync(raw.garminSync),
    strengthExercises: (raw.strengthExercises ?? []).map(normalizeStrengthExercise),
    workoutTemplates: (raw.workoutTemplates ?? []).map(normalizeWorkoutTemplate),
    workoutTemplateExercises: (raw.workoutTemplateExercises ?? []).map(normalizeWorkoutTemplateExercise),
    plannedActivities: (raw.plannedActivities ?? []).map(normalizePlannedActivity),
    workoutSessions: (raw.workoutSessions ?? []).map(normalizeWorkoutSession),
    workoutSets: (raw.workoutSets ?? []).map(normalizeWorkoutSet),
  };
}

/** Monday-based week start (YYYY-MM-DD) for dateLocal. */
export function weekStartMonday(dateLocal: string): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

function datesInWeek(weekStart: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const [y, m, d] = weekStart.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

export function createMemoryFoodRepository(seed?: {
  timezone?: string;
  snapshot?: StoreSnapshotAny;
}): FoodRepository {
  const snap = normalizeSnapshot(seed?.snapshot);
  let trainingCycle: TrainingCycle | null = snap?.trainingCycle ?? null;
  const profile: Profile = snap?.profile
    ? { ...snap.profile }
    : {
        id: 'local-profile',
        timezone: seed?.timezone ?? 'UTC',
        locale: 'en',
        units: 'metric',
        waterTargetMl: 2000,
        dogfoodStartedOn: null,
        heightCm: null,
        dailyEnergyKcal: null,
        dailyProteinG: null,
        dailyFatG: null,
        dailyCarbG: null,
      };
  // Device TZ wins on open so sleep clocks / day keys follow the phone (e.g. MSK), not a stale UTC snapshot.
  if (seed?.timezone) profile.timezone = seed.timezone;
  const products = new Map<string, FoodProduct>((snap?.products ?? []).map((p) => [p.id, { ...p }]));
  mergeCommonFoodCatalog(products);
  const recipes = new Map<string, Recipe>((snap?.recipes ?? []).map((r) => [r.id, { ...r }]));
  const ingredients = new Map<string, RecipeIngredient[]>();
  for (const ing of snap?.ingredients ?? []) {
    const list = ingredients.get(ing.recipeId) ?? [];
    list.push({ ...ing });
    ingredients.set(ing.recipeId, list);
  }
  const entries = new Map<string, FoodEntry>((snap?.entries ?? []).map((e) => [e.id, cloneFoodEntry(e)]));
  const waterEntries = new Map<string, WaterEntry>(
    (snap?.waterEntries ?? []).map((w) => [w.id, { ...w }]),
  );
  const weightEntries = new Map<string, WeightEntry>(
    (snap?.weightEntries ?? []).map((w) => [w.id, { ...w }]),
  );
  const habitChecks = new Map<string, HabitCheck>(
    (snap?.habitChecks ?? []).map((h) => [h.id, { ...h }]),
  );
  const workouts = new Map<string, Workout>((snap?.workouts ?? []).map((w) => [w.id, { ...w }]));
  const flexibleHabits = new Map<string, FlexibleHabit>(
    (snap?.flexibleHabits ?? []).map((h) => [h.id, { ...h }]),
  );
  const flexibleHabitEvents = new Map<string, FlexibleHabitEvent>(
    (snap?.flexibleHabitEvents ?? []).map((e) => [e.id, { ...e }]),
  );
  const savedMeals = new Map<string, SavedMeal>(
    (snap?.savedMeals ?? []).map((m) => [
      m.id,
      { ...m, items: m.items.map((i) => ({ ...i })) },
    ]),
  );
  const challenges = new Map<string, Challenge>(
    (snap?.challenges ?? []).map((c) => [c.id, { ...c }]),
  );
  const pantryItems = new Map<string, PantryItem>(
    (snap?.pantryItems ?? []).map((p) => [p.id, { ...p }]),
  );
  const cookedBatches = new Map<string, CookedBatch>(
    (snap?.cookedBatches ?? []).map((b) => [b.id, { ...b }]),
  );
  function checkReceipt(entry: FoodEntry, receipt: NonNullable<FoodEntry['cookedConsumption']>): void {
    validateCookedConsumption(receipt, entry.grams);
    for (const part of receipt) {
      const batch = cookedBatches.get(part.batchId);
      if (!entry.recipeId || (batch && batch.recipeId !== entry.recipeId)) throw new Error('Партия не относится к рецепту порции');
    }
  }
  function commitStock(changes: Map<string, number>, stock = cookedBatches): void {
    for (const [id, remainingG] of changes) {
      const batch = stock.get(id)!; batch.remainingG = remainingG; batch.updatedAt = nowIso();
    }
  }
  function consumeForDiaryEntry(entry: FoodEntry, stock = cookedBatches): void {
    if (!entry.recipeId) { delete entry.cookedConsumption; return; }
    const receipt = allocateCookedConsumption([...stock.values()], entry.recipeId, entry.grams);
    checkReceipt(entry, receipt);
    const plan = planConsumptionChange([...stock.values()], [], receipt);
    commitStock(plan, stock); entry.cookedConsumption = receipt;
  }
  const mealPlans = new Map<string, MealPlan>(
    (snap?.mealPlans ?? []).map((p) => [p.id, { ...p }]),
  );
  const plannedMeals = new Map<string, PlannedMeal>(
    (snap?.plannedMeals ?? []).map((m) => [m.id, { ...m }]),
  );
  const shoppingLists = new Map<string, ShoppingList>(
    (snap?.shoppingLists ?? []).map((l) => [l.id, { ...l }]),
  );
  const shoppingItems = new Map<string, ShoppingItem>(
    (snap?.shoppingItems ?? []).map((i) => [i.id, { ...i }]),
  );
  const productPrices = new Map<string, ProductPrice>(
    (snap?.productPrices ?? []).map((p) => [p.id, { ...p }]),
  );
  const foodBudgets = new Map<string, FoodBudget>(
    (snap?.foodBudgets ?? []).map((b) => [b.id, { ...b }]),
  );
  const foodExpenses = new Map<string, FoodExpense>(
    (snap?.foodExpenses ?? []).map((e) => [e.id, { ...e }]),
  );
  const storePreferences = new Map<string, StorePreference>(
    (
      snap?.storePreferences?.length
        ? snap.storePreferences
        : defaultStorePreferences(nowIso())
    ).map((s) => [s.id, { ...s }]),
  );
  const purchases = new Map<string, Purchase>(
    (snap?.purchases ?? []).map((p) => [p.id, { ...p }]),
  );
  const purchaseLines = new Map<string, PurchaseLine>(
    (snap?.purchaseLines ?? []).map((l) => [l.id, { ...l }]),
  );
  const dailyActivityStats = new Map<string, DailyActivityStats>(
    (snap?.dailyActivityStats ?? []).map((s) => [s.id, { ...s }]),
  );
  const sleepNights = new Map<string, SleepNight>(
    (snap?.sleepNights ?? []).map((s) => [s.id, { ...s }]),
  );
  let garminSync: GarminSyncState = normalizeGarminSync(snap?.garminSync);
  const strengthExercises = new Map<string, StrengthExercise>(
    (snap?.strengthExercises ?? []).map((e) => [e.id, { ...e, primaryMuscles: [...e.primaryMuscles], secondaryMuscles: [...e.secondaryMuscles] }]),
  );
  const workoutTemplates = new Map<string, WorkoutTemplate>(
    (snap?.workoutTemplates ?? []).map((t) => [t.id, { ...t }]),
  );
  const workoutTemplateExercises = new Map<string, WorkoutTemplateExercise>(
    (snap?.workoutTemplateExercises ?? []).map((l) => [l.id, { ...l }]),
  );
  const plannedActivities = new Map<string, PlannedActivity>(
    (snap?.plannedActivities ?? []).map((a) => [a.id, { ...a }]),
  );
  const workoutSessions = new Map<string, WorkoutSession>(
    (snap?.workoutSessions ?? []).map((s) => [s.id, { ...s }]),
  );
  const workoutSets = new Map<string, WorkoutSet>(
    (snap?.workoutSets ?? []).map((s) => [s.id, { ...s }]),
  );

  /**
   * Seed missing catalog rows only — never overwrite user-edited
   * template names/lines or custom exercises (constructor is source of truth).
   */
  const syncBuiltinStrengthProgram = () => {
    const ts = nowIso();
    let changed = false;
    for (const e of materializeSeedExercises(ts)) {
      const existing = strengthExercises.get(e.id);
      if (!existing) {
        strengthExercises.set(e.id, e);
        changed = true;
      } else if (existing.deletedAt != null) {
        // Keep soft-delete; do not resurrect after user removal.
      }
    }
    const { templates, lines } = materializeSeedTemplates(ts);
    for (const t of templates) {
      const existing = workoutTemplates.get(t.id);
      if (!existing) {
        workoutTemplates.set(t.id, t);
        changed = true;
        for (const l of lines.filter((row) => row.templateId === t.id)) {
          if (!workoutTemplateExercises.has(l.id)) {
            workoutTemplateExercises.set(l.id, { ...l });
            changed = true;
          }
        }
      }
    }
    return changed;
  };
  syncBuiltinStrengthProgram();

  let persistHook: ((snap: StoreSnapshot) => void) | null = null;
  /** Coalesce burst writes (e.g. copy-yesterday) into one snapshot persist. */
  let persistQueued = false;
  let persistError: Error | null = null;
  let persistStatusListener: ((error: Error | null) => void) | null = null;

  const flushPersist = () => {
    persistQueued = false;
    if (!persistHook) return;
    try {
      persistHook(api.toSnapshot());
      if (persistError) { persistError = null; persistStatusListener?.(null); }
    } catch (error) {
      persistError = error instanceof Error ? error : new Error('Сохранение недоступно');
      persistStatusListener?.(persistError);
      throw persistError;
    }
  };

  const notify = () => {
    if (!persistHook) return;
    if (persistQueued) return;
    persistQueued = true;
    // Promise microtask — available in RN + Node without DOM lib queueMicrotask.
    Promise.resolve().then(() => {
      // Skip if flushPersist() already drained this generation.
      if (!persistQueued) return;
      try { flushPersist(); } catch { /* Status is surfaced to the app; memory remains retryable. */ }
    });
  };

  const habitId = (dateLocal: string, habitKey: HabitKey) => `${dateLocal}:${habitKey}`;

  const createRecipeInternal = (
    recipeId: string,
    input: NewRecipeInput,
  ): { recipe: Recipe; created: boolean } => {
    const name = input.name.trim();
    if (!name) throw new Error('Recipe name required');
    assertPositiveFinite(input.cookedYieldG, 'cookedYieldG');
    const ings = input.ingredients ?? [];
    const manual = input.nutritionPer100g ?? null;
    if (ings.length === 0 && !manual) {
      throw new Error('Add ingredients or nutrition per 100g');
    }
    for (const ing of ings) {
      assertNonNegativeFinite(ing.rawGrams, 'rawGrams');
      nutritionFromProductFields({
        energyKcal: ing.nutritionPer100g.kcal,
        proteinG: ing.nutritionPer100g.protein,
        fatG: ing.nutritionPer100g.fat,
        carbG: ing.nutritionPer100g.carbs,
      });
    }
    if (manual) {
      nutritionFromProductFields({
        energyKcal: manual.kcal,
        proteinG: manual.protein,
        fatG: manual.fat,
        carbG: manual.carbs,
      });
    }
    const ts = nowIso();
    const recipe: Recipe = {
      id: recipeId,
      name,
      cookedYieldG: input.cookedYieldG,
      description: input.description?.trim() ? input.description.trim() : null,
      instructions: input.instructions?.trim() ? input.instructions.trim() : null,
      photoUri: input.photoUri ?? null,
      energyKcalPer100g: manual?.kcal ?? null,
      proteinGPer100g: manual?.protein ?? null,
      fatGPer100g: manual?.fat ?? null,
      carbGPer100g: manual?.carbs ?? null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    recipes.set(recipe.id, recipe);
    ingredients.set(
      recipe.id,
      ings.map((ing) => ({
        id: newId(),
        recipeId: recipe.id,
        productId: ing.productId ?? null,
        displayName: ing.displayName,
        rawGrams: ing.rawGrams,
        energyKcal: ing.nutritionPer100g.kcal,
        proteinG: ing.nutritionPer100g.protein,
        fatG: ing.nutritionPer100g.fat,
        carbG: ing.nutritionPer100g.carbs,
      })),
    );
    notify();
    return { recipe: { ...recipe }, created: true };
  };

  const api: FoodRepository & {
    setPersistHook(fn: (snap: StoreSnapshot) => void): void;
    flushPersist(): void;
    setPersistStatusListener(fn: ((error: Error | null) => void) | null): void;
  } = {
    setPersistHook(fn) {
      persistHook = fn;
    },
    flushPersist() {
      flushPersist();
    },
    setPersistStatusListener(fn) {
      persistStatusListener = fn;
      fn?.(persistError);
    },
    toSnapshot(): StoreSnapshot {
      return {
        trainingCycle: trainingCycle ? cloneTrainingCycle(trainingCycle) : null,
        version: STORE_SNAPSHOT_VERSION,
        profile: { ...profile },
        products: [...products.values()].map((p) => ({ ...p })),
        recipes: [...recipes.values()].map((r) => ({ ...r })),
        ingredients: [...ingredients.values()].flat().map((i) => ({ ...i })),
        entries: [...entries.values()].map(cloneFoodEntry),
        waterEntries: [...waterEntries.values()].map((w) => ({ ...w })),
        weightEntries: [...weightEntries.values()].map((w) => ({ ...w })),
        habitChecks: [...habitChecks.values()].map((h) => ({ ...h })),
        workouts: [...workouts.values()].map((w) => ({ ...w })),
        flexibleHabits: [...flexibleHabits.values()].map((h) => ({ ...h })),
        flexibleHabitEvents: [...flexibleHabitEvents.values()].map((e) => ({ ...e })),
        savedMeals: [...savedMeals.values()].map((m) => ({
          ...m,
          items: m.items.map((i) => ({ ...i })),
        })),
        challenges: [...challenges.values()].map((c) => ({ ...c })),
        pantryItems: [...pantryItems.values()].map((p) => ({ ...p })),
        cookedBatches: [...cookedBatches.values()].map((b) => ({ ...b })),
        mealPlans: [...mealPlans.values()].map((p) => ({ ...p })),
        plannedMeals: [...plannedMeals.values()].map((m) => ({ ...m })),
        shoppingLists: [...shoppingLists.values()].map((l) => ({ ...l })),
        shoppingItems: [...shoppingItems.values()].map((i) => ({ ...i })),
        productPrices: [...productPrices.values()].map((p) => ({ ...p })),
        foodBudgets: [...foodBudgets.values()].map((b) => ({ ...b })),
        foodExpenses: [...foodExpenses.values()].map((e) => ({ ...e })),
        storePreferences: [...storePreferences.values()].map((s) => ({ ...s })),
        purchases: [...purchases.values()].map((p) => ({ ...p })),
        purchaseLines: [...purchaseLines.values()].map((l) => ({ ...l })),
        dailyActivityStats: [...dailyActivityStats.values()].map((s) => ({ ...s })),
        sleepNights: [...sleepNights.values()].map((s) => ({ ...s })),
        garminSync: { ...garminSync },
        strengthExercises: [...strengthExercises.values()].map((e) => ({
          ...e,
          primaryMuscles: [...e.primaryMuscles],
          secondaryMuscles: [...e.secondaryMuscles],
        })),
        workoutTemplates: [...workoutTemplates.values()].map((t) => ({ ...t })),
        workoutTemplateExercises: [...workoutTemplateExercises.values()].map((l) => ({ ...l })),
        plannedActivities: [...plannedActivities.values()].map((a) => ({ ...a })),
        workoutSessions: [...workoutSessions.values()].map((s) => ({ ...s })),
        workoutSets: [...workoutSets.values()].map((s) => ({ ...s })),
      };
    },
    getProfile: () => ({ ...profile }),
    setWaterTargetMl(ml) {
      if (ml !== null) assertPositiveFinite(ml, 'waterTargetMl');
      profile.waterTargetMl = ml;
      notify();
      return { ...profile };
    },
    setHeightCm(cm) {
      if (cm !== null) {
        assertPositiveFinite(cm, 'heightCm');
        if (cm < 50 || cm > 280) throw new Error('heightCm out of range');
      }
      profile.heightCm = cm;
      notify();
      return { ...profile };
    },
    setDailyNutritionTargets(targets) {
      const fields = {
        energyKcal: targets.energyKcal,
        proteinG: targets.proteinG,
        fatG: targets.fatG,
        carbG: targets.carbG,
      };
      nutritionFromProductFields(fields);
      profile.dailyEnergyKcal = fields.energyKcal;
      profile.dailyProteinG = fields.proteinG;
      profile.dailyFatG = fields.fatG;
      profile.dailyCarbG = fields.carbG;
      notify();
      return { ...profile };
    },
    startDogfood(dateLocal) {
      assertLocalDate(dateLocal);
      if (!profile.dogfoodStartedOn) {
        profile.dogfoodStartedOn = dateLocal;
        notify();
      }
      return { ...profile };
    },
    clearDogfood() {
      profile.dogfoodStartedOn = null;
      notify();
      return { ...profile };
    },
    dogfoodStatus(dateLocal) {
      return dogfoodStatus(profile.dogfoodStartedOn, dateLocal);
    },
    listProducts: () =>
      [...products.values()]
        .filter((p) => p.deletedAt == null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    listFavorites: () => api.listProducts().filter((p) => p.isFavorite),
    listFrequentProducts(limit = 20) {
      const ranked = rankProductFrequency(
        [...entries.values()].map((e) => ({
          productId: e.productId,
          deletedAt: e.deletedAt,
        })),
      );
      const byId = new Map(api.listProducts().map((p) => [p.id, p]));
      const out: FoodProduct[] = [];
      for (const { productId } of ranked) {
        const p = byId.get(productId);
        if (!p || p.deletedAt != null) continue;
        out.push({ ...p });
        if (out.length >= limit) break;
      }
      return out;
    },
    createProduct(input) {
      const name = input.name.trim();
      if (!name) throw new Error('Product name required');
      const fields = {
        energyKcal: input.energyKcal ?? null,
        proteinG: input.proteinG ?? null,
        fatG: input.fatG ?? null,
        carbG: input.carbG ?? null,
      };
      nutritionFromProductFields(fields);
      const ts = nowIso();
      const product: FoodProduct = {
        id: newId(),
        name,
        brand: input.brand ?? null,
        barcode: input.barcode ?? null,
        ...fields,
        source: input.source ?? 'user',
        isFavorite: false,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      products.set(product.id, product);
      notify();
      return { ...product };
    },
    updateProductNutrition(productId, nutrition) {
      const p = products.get(productId);
      if (!p || p.deletedAt) throw new Error('Product not found');
      const fields = {
        energyKcal: nutrition.energyKcal,
        proteinG: nutrition.proteinG,
        fatG: nutrition.fatG,
        carbG: nutrition.carbG,
      };
      nutritionFromProductFields(fields);
      p.energyKcal = fields.energyKcal;
      p.proteinG = fields.proteinG;
      p.fatG = fields.fatG;
      p.carbG = fields.carbG;
      if (p.source === 'catalog' || p.source === 'label') {
        // User correction stays marked as user-edited source of truth.
        p.source = 'user';
      }
      p.updatedAt = nowIso();
      notify();
      return { ...p };
    },
    setFavorite(productId, isFavorite) {
      const p = products.get(productId);
      if (!p || p.deletedAt) throw new Error('Product not found');
      p.isFavorite = isFavorite;
      p.updatedAt = nowIso();
      notify();
      return { ...p };
    },
    findProductByBarcode(barcode) {
      const candidates = new Set(barcodeLookupCandidates(barcode));
      return (
        api.listProducts().find((p) => p.barcode != null && candidates.has(p.barcode)) ?? null
      );
    },
    linkBarcodeToProduct(productId, barcode) {
      const cleaned = barcode.replace(/\D/g, '');
      if (!/^\d{8,14}$/.test(cleaned)) throw new Error('Штрихкод: 8–14 цифр');
      const p = products.get(productId);
      if (!p || p.deletedAt != null) throw new Error('Product not found');
      const conflict = api.findProductByBarcode(cleaned);
      if (conflict && conflict.id !== productId) {
        throw new Error('Этот штрихкод уже привязан к другому продукту');
      }
      const candidates = new Set(barcodeLookupCandidates(cleaned));
      // Bind when empty or already the same code family; never silently overwrite a different GTIN.
      if (p.barcode == null || candidates.has(p.barcode)) {
        p.barcode = cleaned;
        p.updatedAt = nowIso();
        notify();
      }
      return { ...p };
    },
    upsertFromOffResult(result) {
      const existing = api.findProductByBarcode(result.barcode);
      const ts = nowIso();
      if (existing) {
        existing.name = result.name;
        existing.brand = result.brand;
        existing.energyKcal = result.energyKcal;
        existing.proteinG = result.proteinG;
        existing.fatG = result.fatG;
        existing.carbG = result.carbG;
        existing.source = 'catalog';
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const product: FoodProduct = {
        id: newId(),
        name: result.name,
        brand: result.brand,
        barcode: result.barcode,
        energyKcal: result.energyKcal,
        proteinG: result.proteinG,
        fatG: result.fatG,
        carbG: result.carbG,
        source: 'catalog',
        isFavorite: false,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      products.set(product.id, product);
      notify();
      return { ...product };
    },
    listEntriesForDate(dateLocal) {
      return [...entries.values()]
        .filter((e) => e.dateLocal === dateLocal && e.deletedAt == null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(cloneFoodEntry);
    },
    listRecentEntries(limit = 20) {
      const sorted = [...entries.values()]
        .filter((e) => e.deletedAt == null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const seen = new Set<string>();
      const deduped: FoodEntry[] = [];
      for (const e of sorted) {
        const link = e.productId
          ? `p:${e.productId}`
          : e.recipeId
            ? `r:${e.recipeId}`
            : `q:${e.displayName.toLowerCase()}`;
        const key = `${link}|${Math.round(e.grams * 10) / 10}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(cloneFoodEntry(e));
        if (deduped.length >= limit) break;
      }
      return deduped;
    },
    lastGramsForProduct(productId) {
      const hit = [...entries.values()]
        .filter((e) => e.deletedAt == null && e.productId === productId && e.grams > 0)
        .sort((a, b) => {
          const byTime = b.createdAt.localeCompare(a.createdAt);
          if (byTime !== 0) return byTime;
          return b.id.localeCompare(a.id);
        })[0];
      return hit ? hit.grams : null;
    },
    addEntryFromProduct({ productId, dateLocal, meal, grams }) {
      assertLocalDate(dateLocal); if (!MEALS.includes(meal)) throw new Error('Выбери приём пищи');
      assertNonNegativeFinite(grams, 'grams');
      const product = products.get(productId);
      if (!product || product.deletedAt) throw new Error('Product not found');
      const snapN = portion(
        {
          kcal: product.energyKcal,
          protein: product.proteinG,
          fat: product.fatG,
          carbs: product.carbG,
        },
        grams,
      );
      nutritionFromProductFields({energyKcal:snapN.kcal,proteinG:snapN.protein,fatG:snapN.fat,carbG:snapN.carbs});
      const ts = nowIso();
      const entry: FoodEntry = {
        id: newId(),
        dateLocal,
        meal,
        productId,
        recipeId: null,
        displayName: product.name,
        grams,
        energyKcal: snapN.kcal,
        proteinG: snapN.protein,
        fatG: snapN.fat,
        carbG: snapN.carbs,
        source: product.source,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      entries.set(entry.id, entry);
      notify();
      return cloneFoodEntry(entry);
    },
    addQuickEntry({
      dateLocal,
      meal,
      displayName,
      energyKcal,
      proteinG = null,
      fatG = null,
      carbG = null,
    }) {
      assertLocalDate(dateLocal); if (!MEALS.includes(meal)) throw new Error('Выбери приём пищи');
      nutritionFromProductFields({
        energyKcal,
        proteinG: proteinG ?? null,
        fatG: fatG ?? null,
        carbG: carbG ?? null,
      });
      const name = (displayName ?? '').trim() || 'Быстрый ввод';
      const ts = nowIso();
      const entry: FoodEntry = {
        id: newId(),
        dateLocal,
        meal,
        productId: null,
        recipeId: null,
        displayName: name,
        /** 1 «порция» — абсолютный снимок КБЖУ, без продукта. */
        grams: 1,
        energyKcal,
        proteinG: proteinG ?? null,
        fatG: fatG ?? null,
        carbG: carbG ?? null,
        source: 'user',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      entries.set(entry.id, entry);
      notify();
      return cloneFoodEntry(entry);
    },
    listSavedMeals: () =>
      [...savedMeals.values()]
        .filter((m) => m.deletedAt == null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    createSavedMeal(input) {
      const name = input.name.trim();
      if (!name) throw new Error('Saved meal name required');
      if (!input.items.length) throw new Error('At least one item required');
      for (const item of input.items) {
        assertNonNegativeFinite(item.grams, 'grams');
        if (!item.productId && !item.recipeId) {
          throw new Error('Saved meal item needs product or recipe');
        }
        if (!item.displayName.trim()) throw new Error('Saved meal item needs name');
      }
      const ts = nowIso();
      const meal: SavedMeal = {
        id: newId(),
        name,
        defaultMeal: input.defaultMeal ?? null,
        items: input.items.map((i) => ({
          productId: i.productId,
          recipeId: i.recipeId,
          displayName: i.displayName.trim(),
          grams: i.grams,
        })),
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      savedMeals.set(meal.id, meal);
      notify();
      return {
        ...meal,
        items: meal.items.map((i) => ({ ...i })),
      };
    },
    createSavedMealFromEntries(name, sourceEntries, defaultMeal = null) {
      const items: SavedMealItem[] = [];
      for (const e of sourceEntries) {
        if (e.deletedAt) continue;
        if (!(e.grams > 0) || !Number.isFinite(e.grams)) continue;
        if (e.productId) {
          items.push({
            productId: e.productId,
            recipeId: null,
            displayName: e.displayName,
            grams: e.grams,
          });
        } else if (e.recipeId) {
          items.push({
            productId: null,
            recipeId: e.recipeId,
            displayName: e.displayName,
            grams: e.grams,
          });
        }
      }
      return api.createSavedMeal({ name, defaultMeal, items });
    },
    logSavedMeal({ savedMealId, dateLocal, meal }) {
      const saved = savedMeals.get(savedMealId);
      if (!saved || saved.deletedAt) throw new Error('Saved meal not found');
      assertLocalDate(dateLocal);
      if (!MEALS.includes(meal)) throw new Error('Выбери приём пищи');
      for (const item of saved.items) {
        assertNonNegativeFinite(item.grams, 'grams');
        const product = item.productId ? products.get(item.productId) : null;
        const recipe = item.recipeId ? api.getRecipe(item.recipeId) : null;
        if (item.productId ? !product || product.deletedAt : !recipe) throw new Error('В шаблоне есть удалённый продукт или рецепт. Обнови шаблон перед добавлением.');
        const n = product ? portion(nutritionFromProductFields(product), item.grams) : nutritionForRecipePortion(recipe!, ingredients.get(recipe!.id) ?? [], item.grams);
        nutritionFromProductFields({energyKcal:n.kcal,proteinG:n.protein,fatG:n.fat,carbG:n.carbs});
      }
      const created: FoodEntry[] = [];
      for (const item of saved.items) {
        if (item.productId) {
          const p = products.get(item.productId);
          if (!p || p.deletedAt) continue;
          created.push(
            api.addEntryFromProduct({
              productId: item.productId,
              dateLocal,
              meal,
              grams: item.grams,
            }),
          );
        } else if (item.recipeId) {
          const r = recipes.get(item.recipeId);
          if (!r || r.deletedAt) continue;
          created.push(
            api.addEntryFromRecipe({
              recipeId: item.recipeId,
              dateLocal,
              meal,
              grams: item.grams,
            }),
          );
        }
      }
      if (created.length === 0) throw new Error('No valid items to log');
      return created.map((e) => ({ ...e }));
    },
    softDeleteSavedMeal(savedMealId) {
      const m = savedMeals.get(savedMealId);
      if (!m || m.deletedAt) throw new Error('Saved meal not found');
      m.deletedAt = nowIso();
      m.updatedAt = m.deletedAt;
      notify();
      return { ...m, items: m.items.map((i) => ({ ...i })) };
    },
    addEntryFromRecipe({ recipeId, dateLocal, meal, grams, nutritionSnapshot }) {
      assertLocalDate(dateLocal); if (!MEALS.includes(meal)) throw new Error('Выбери приём пищи');
      assertNonNegativeFinite(grams, 'grams');
      const recipe = recipes.get(recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
      let snapN: Nutrition;
      if (nutritionSnapshot) {
        snapN = nutritionFromProductFields({
          energyKcal: nutritionSnapshot.energyKcal,
          proteinG: nutritionSnapshot.proteinG,
          fatG: nutritionSnapshot.fatG,
          carbG: nutritionSnapshot.carbG,
        });
      } else {
        snapN = nutritionForRecipePortion(
          recipe,
          ingredients.get(recipeId) ?? [],
          grams,
        );
      }
      const ts = nowIso();
      const entry: FoodEntry = {
        id: newId(),
        dateLocal,
        meal,
        productId: null,
        recipeId,
        displayName: recipe.name,
        grams,
        energyKcal: snapN.kcal,
        proteinG: snapN.protein,
        fatG: snapN.fat,
        carbG: snapN.carbs,
        source: 'recipe',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      consumeForDiaryEntry(entry);
      entries.set(entry.id, entry);
      notify();
      return cloneFoodEntry(entry);
    },
    copyDiaryEntries({ items, dateLocal, meal }) {
      assertLocalDate(dateLocal);
      if (meal != null && !MEALS.includes(meal)) throw new Error('Выбери приём пищи');
      if (!items.length) throw new Error('Нет записей для повтора');
      const ts = nowIso();
      // Validate every source before creating any entry or consuming a cooked batch.
      const copies = items.map(item => {
        const source = entries.get(item.entryId);
        if (!source || source.deletedAt) throw new Error('Запись для повтора не найдена');
        if (!MEALS.includes(meal ?? source.meal)) throw new Error('Некорректный приём у исходной записи');
        const details = resizeEntrySnapshot(source, item.grams ?? source.grams);
        nutritionFromProductFields(details);
        return { ...source, ...details, id: newId(), dateLocal, meal: meal ?? source.meal, createdAt: ts, updatedAt: ts, deletedAt: null };
      });
      const nextStock = new Map([...cookedBatches].map(([id, batch]) => [id, { ...batch }]));
      for (const entry of copies) consumeForDiaryEntry(entry, nextStock);
      const stockChanges = new Map([...nextStock].filter(([id, batch]) => batch.remainingG !== cookedBatches.get(id)!.remainingG).map(([id, batch]) => [id, batch.remainingG]));
      commitStock(stockChanges);
      for (const entry of copies) entries.set(entry.id, entry);
      notify();
      return copies.map(cloneFoodEntry);
    },
    updateEntryDetails(entryId, patch) {
      const entry = entries.get(entryId);
      if (!entry || entry.deletedAt) throw new Error('Запись не найдена');
      const next = { ...entry, ...patch };
      assertLocalDate(next.dateLocal);
      if (!MEALS.includes(next.meal)) throw new Error('Выбери приём пищи');
      assertNonNegativeFinite(next.grams, 'grams');
      nutritionFromProductFields(next);
      let receipt = entry.cookedConsumption;
      if (receipt !== undefined || patch.cookedConsumption !== undefined) {
        if (patch.cookedConsumption !== undefined) receipt = cloneConsumption(patch.cookedConsumption);
        else if (next.grams < entry.grams) receipt = receipt!.map(p => ({ ...p, grams: p.grams * (next.grams / entry.grams) })).filter(p => p.grams > 0);
        else if (next.grams > entry.grams && entry.recipeId) receipt = mergeConsumption(receipt!, allocateCookedConsumption([...cookedBatches.values()], entry.recipeId, next.grams - entry.grams));
        checkReceipt(next, receipt!);
        const changes = planConsumptionChange([...cookedBatches.values()], entry.cookedConsumption ?? [], receipt!);
        commitStock(changes);
      }
      Object.assign(entry, { dateLocal: next.dateLocal, meal: next.meal, grams: next.grams, energyKcal: next.energyKcal, proteinG: next.proteinG, fatG: next.fatG, carbG: next.carbG, updatedAt: nowIso() });
      if (receipt !== undefined) entry.cookedConsumption = cloneConsumption(receipt);
      notify(); return cloneFoodEntry(entry);
    },
    updateEntryGrams(entryId, grams) {
      const entry = entries.get(entryId);
      if (!entry || entry.deletedAt) throw new Error('Запись не найдена');
      return api.updateEntryDetails(entryId, resizeEntrySnapshot(entry, grams));
    },
    softDeleteEntry(entryId) {
      const entry = entries.get(entryId);
      if (!entry) throw new Error('Entry not found');
      if (entry.deletedAt) return cloneFoodEntry(entry);
      if (entry.cookedConsumption !== undefined) {
        checkReceipt(entry, entry.cookedConsumption);
        commitStock(planConsumptionChange([...cookedBatches.values()], entry.cookedConsumption, []));
      }
      entry.deletedAt = nowIso(); entry.updatedAt = entry.deletedAt;
      notify(); return cloneFoodEntry(entry);
    },
    undoDeleteEntry(entryId) {
      const entry = entries.get(entryId);
      if (!entry) throw new Error('Entry not found');
      if (!entry.deletedAt) return cloneFoodEntry(entry);
      if (entry.cookedConsumption !== undefined) {
        checkReceipt(entry, entry.cookedConsumption);
        commitStock(planConsumptionChange([...cookedBatches.values()], [], entry.cookedConsumption));
      }
      entry.deletedAt = null; entry.updatedAt = nowIso();
      notify(); return cloneFoodEntry(entry);
    },
    undoDiaryAdds(entryIds) {
      const active = [...new Set(entryIds)].flatMap(id => { const row = entries.get(id); return row && !row.deletedAt ? [row] : []; });
      for (const entry of active) if (entry.cookedConsumption) checkReceipt(entry, entry.cookedConsumption);
      const receipt = active.flatMap(e => e.cookedConsumption ?? []);
      const changes = planConsumptionChange([...cookedBatches.values()], receipt, []);
      commitStock(changes);
      const ts = nowIso(); for (const entry of active) { entry.deletedAt = ts; entry.updatedAt = ts; }
      if (active.length) notify();
    },
    dailyTotals(dateLocal) {
      return computeDailyTotals(api.listEntriesForDate(dateLocal));
    },
    listRecipes: () =>
      [...recipes.values()]
        .filter((r) => r.deletedAt == null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    getRecipe(recipeId) {
      const r = recipes.get(recipeId);
      if (!r || r.deletedAt) return null;
      return { ...r };
    },
    getRecipeIngredients(recipeId) {
      return [...(ingredients.get(recipeId) ?? [])];
    },
    createRecipe(input) {
      return createRecipeInternal(newId(), input).recipe;
    },
    importRecipeIfAbsent(recipeId, input) {
      const id = recipeId.trim();
      if (!id) throw new Error('Recipe id required');
      const existing = recipes.get(id);
      if (existing && existing.deletedAt == null) {
        return { recipe: { ...existing }, created: false };
      }
      return createRecipeInternal(id, input);
    },
    updateRecipe(recipeId, input) {
      const storedRecipe = recipes.get(recipeId);
      if (!storedRecipe || storedRecipe.deletedAt) throw new Error('Recipe not found');
      const recipe = { ...storedRecipe };
      let nextIngredients = ingredients.get(recipe.id) ?? [];
      if (input.name !== undefined) {
        const name = input.name.trim();
        if (!name) throw new Error('Recipe name required');
        recipe.name = name;
      }
      if (input.cookedYieldG !== undefined) {
        assertPositiveFinite(input.cookedYieldG, 'cookedYieldG');
        recipe.cookedYieldG = input.cookedYieldG;
      }
      if (input.description !== undefined) {
        recipe.description = input.description?.trim() ? input.description.trim() : null;
      }
      if (input.instructions !== undefined) {
        recipe.instructions = input.instructions?.trim() ? input.instructions.trim() : null;
      }
      if (input.photoUri !== undefined) {
        recipe.photoUri = input.photoUri;
      }
      if (input.nutritionPer100g !== undefined) {
        const manual = input.nutritionPer100g;
        if (manual) {
          nutritionFromProductFields({
            energyKcal: manual.kcal,
            proteinG: manual.protein,
            fatG: manual.fat,
            carbG: manual.carbs,
          });
          recipe.energyKcalPer100g = manual.kcal;
          recipe.proteinGPer100g = manual.protein;
          recipe.fatGPer100g = manual.fat;
          recipe.carbGPer100g = manual.carbs;
        } else {
          recipe.energyKcalPer100g = null;
          recipe.proteinGPer100g = null;
          recipe.fatGPer100g = null;
          recipe.carbGPer100g = null;
        }
      }
      if (input.ingredients !== undefined) {
        for (const ing of input.ingredients) {
          assertNonNegativeFinite(ing.rawGrams, 'rawGrams');
          nutritionFromProductFields({
            energyKcal: ing.nutritionPer100g.kcal,
            proteinG: ing.nutritionPer100g.protein,
            fatG: ing.nutritionPer100g.fat,
            carbG: ing.nutritionPer100g.carbs,
          });
        }
        nextIngredients = input.ingredients.map((ing) => ({
            id: newId(),
            recipeId: recipe.id,
            productId: ing.productId ?? null,
            displayName: ing.displayName,
            rawGrams: ing.rawGrams,
            energyKcal: ing.nutritionPer100g.kcal,
            proteinG: ing.nutritionPer100g.protein,
            fatG: ing.nutritionPer100g.fat,
            carbG: ing.nutritionPer100g.carbs,
          }));
      }
      const ings = nextIngredients;
      const hasManual =
        recipe.energyKcalPer100g !== null ||
        recipe.proteinGPer100g !== null ||
        recipe.fatGPer100g !== null ||
        recipe.carbGPer100g !== null;
      if (ings.length === 0 && !hasManual) {
        throw new Error('Add ingredients or nutrition per 100g');
      }
      recipe.updatedAt = nowIso();
      recipes.set(recipe.id, recipe);
      ingredients.set(recipe.id, nextIngredients);
      notify();
      return { ...recipe };
    },
    restoreRecipe(id) {
      const row = recipes.get(id);
      if (!row) throw new Error('Recipe not found');
      row.deletedAt = null;
      row.updatedAt = nowIso();
      notify();
      return { ...row };
    },
    softDeleteRecipe(recipeId) {
      const recipe = recipes.get(recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
      recipe.deletedAt = nowIso();
      recipe.updatedAt = recipe.deletedAt;
      notify();
      return { ...recipe };
    },
    cookAgainRecipe(recipeId, draft, batchDateLocal) {
      const recipe = recipes.get(recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
      const ings = ingredients.get(recipeId) ?? [];
      const input = buildCookAgainInput(recipe, ings, draft, batchDateLocal);
      return api.createRecipe(input);
    },
    addWater(dateLocal, ml) {
      assertLocalDate(dateLocal);
      assertPositiveFinite(ml, 'ml');
      const entry: WaterEntry = {
        id: newId(),
        dateLocal,
        ml,
        createdAt: nowIso(),
      };
      waterEntries.set(entry.id, entry);
      notify();
      return { ...entry };
    },
    waterMlForDate(dateLocal) {
      return [...waterEntries.values()]
        .filter((w) => w.dateLocal === dateLocal)
        .reduce((s, w) => s + w.ml, 0);
    },
    listWaterForDate(dateLocal) {
      return [...waterEntries.values()]
        .filter((w) => w.dateLocal === dateLocal)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    removeWater(entryId) {
      const previous = waterEntries.get(entryId);
      if (!previous) return null;
      waterEntries.delete(entryId); notify(); return { ...previous };
    },
    restoreWater(entry) {
      assertLocalDate(entry.dateLocal); assertPositiveFinite(entry.ml, 'ml');
      if (waterEntries.has(entry.id)) throw new Error('Эта запись воды уже восстановлена');
      waterEntries.set(entry.id, { ...entry }); notify();
    },
    addWeight(kg, weighedAt) {
      assertPositiveFinite(kg, 'kg');
      const ts = weighedAt ?? nowIso();
      assertLocalDate(ts.slice(0, 10));
      if (!Number.isFinite(Date.parse(ts))) throw new Error('Некорректное время замера');
      const entry: WeightEntry = {
        id: newId(),
        weighedAt: ts,
        kg,
        source: 'user',
        externalId: null,
        createdAt: nowIso(),
      };
      weightEntries.set(entry.id, entry);
      notify();
      return { ...entry };
    },
    updateManualWeight(id, kg) {
      assertPositiveFinite(kg, 'kg');
      const row = weightEntries.get(id);
      if (!row || row.source !== 'user') throw new Error('Можно менять только ручной замер');
      row.kg = kg; notify(); return { ...row };
    },
    removeManualWeight(id) {
      const row = weightEntries.get(id);
      if (!row || row.source !== 'user') throw new Error('Можно удалить только ручной замер');
      weightEntries.delete(id); notify(); return { ...row };
    },
    restoreManualWeight(entry) {
      if (entry.source !== 'user' || weightEntries.has(entry.id)) throw new Error('Замер уже существует или получен из интеграции');
      assertPositiveFinite(entry.kg, 'kg');
      if (!Number.isFinite(Date.parse(entry.weighedAt))) throw new Error('Некорректное время замера');
      weightEntries.set(entry.id, { ...entry }); notify();
    },
    listWeights(limit = 30) {
      return [...weightEntries.values()]
        .sort((a, b) => b.weighedAt.localeCompare(a.weighedAt))
        .slice(0, limit)
        .map(w => ({ ...w }));
    },
    listIntegratedWeights(source, limit = 200) {
      return [...weightEntries.values()]
        .filter((w) => w.source === source)
        .sort((a, b) => b.weighedAt.localeCompare(a.weighedAt))
        .slice(0, limit)
        .map((w) => ({ ...w }));
    },
    latestWeight() {
      const list = api.listWeights(1);
      return list[0] ?? null;
    },
    upsertIntegratedWeight(input) {
      const externalId = input.externalId.trim();
      if (!externalId) return null;
      if (input.source === 'user') return null;
      assertPositiveFinite(input.kg, 'kg');
      if (!input.weighedAt) return null;
      const existing = [...weightEntries.values()].find(
        (w) => w.source === input.source && w.externalId === externalId,
      );
      if (existing) {
        existing.kg = input.kg;
        existing.weighedAt = input.weighedAt;
        notify();
        return { ...existing };
      }
      const entry: WeightEntry = {
        id: newId(),
        weighedAt: input.weighedAt,
        kg: input.kg,
        source: input.source,
        externalId,
        createdAt: nowIso(),
      };
      weightEntries.set(entry.id, entry);
      notify();
      return { ...entry };
    },
    toggleHabit(dateLocal, habitKey) {
      const id = habitId(dateLocal, habitKey);
      const existing = [...habitChecks.values()].find(
        (h) => h.dateLocal === dateLocal && h.habitKey === habitKey,
      );
      const ts = nowIso();
      if (existing) {
        existing.done = !existing.done;
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const check: HabitCheck = {
        id,
        dateLocal,
        habitKey,
        done: true,
        updatedAt: ts,
      };
      habitChecks.set(check.id, check);
      notify();
      return { ...check };
    },
    isHabitDone(dateLocal, habitKey) {
      const existing = [...habitChecks.values()].find(
        (h) => h.dateLocal === dateLocal && h.habitKey === habitKey,
      );
      return existing?.done === true;
    },
    addWorkout(input) {
      assertPositiveFinite(input.durationSec, 'durationSec');
      if (input.distanceM != null && input.distanceM !== undefined) {
        assertNonNegativeFinite(input.distanceM, 'distanceM');
      }
      const ts = nowIso();
      const workout: Workout = {
        id: newId(),
        dateLocal: input.dateLocal,
        type: input.type,
        durationSec: input.durationSec,
        distanceM: input.distanceM ?? null,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        source: 'user',
        externalId: null,
        calories: null,
        avgHeartRate: null,
        maxHeartRate: null,
        avgPowerW: null,
        maxPowerW: null,
        normalizedPowerW: null,
        avgCadence: null,
        elevationGainM: null,
        avgSpeedMps: null,
        maxSpeedMps: null,
        movingDurationSec: null,
        hrZones: null,
        detailJson: null,
        polylineJson: null,
        chartJson: null,
        createdAt: ts,
        deletedAt: null,
      };
      workouts.set(workout.id, workout);
      api.applyWorkoutHabitAutoCredit({
        dateLocal: workout.dateLocal,
        workoutType: workout.type,
        durationSec: workout.durationSec,
      });
      notify();
      return { ...workout };
    },
    upsertIntegratedWorkout(input) {
      const externalId = input.externalId.trim();
      if (!externalId) return null;
      if (input.source === 'user') return null;
      assertPositiveFinite(input.durationSec, 'durationSec');
      if (input.distanceM != null && input.distanceM !== undefined) {
        assertNonNegativeFinite(input.distanceM, 'distanceM');
      }
      const patch = {
        dateLocal: input.dateLocal,
        type: input.type,
        durationSec: input.durationSec,
        distanceM: input.distanceM ?? null,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        calories: input.calories ?? null,
        avgHeartRate: input.avgHeartRate ?? null,
        maxHeartRate: input.maxHeartRate ?? null,
        avgPowerW: input.avgPowerW ?? null,
        maxPowerW: input.maxPowerW ?? null,
        normalizedPowerW: input.normalizedPowerW ?? null,
        avgCadence: input.avgCadence ?? null,
        elevationGainM: input.elevationGainM ?? null,
        avgSpeedMps: input.avgSpeedMps ?? null,
        maxSpeedMps: input.maxSpeedMps ?? null,
        movingDurationSec: input.movingDurationSec ?? null,
        hrZones: input.hrZones ?? null,
        detailJson: input.detailJson ?? null,
        polylineJson: input.polylineJson ?? null,
        chartJson: input.chartJson ?? null,
      };
      const existing = [...workouts.values()].find(
        (w) => w.source === input.source && w.externalId === externalId && w.deletedAt == null,
      );
      if (existing) {
        Object.assign(existing, patch);
        notify();
        return { ...existing };
      }
      const ts = nowIso();
      const workout: Workout = {
        id: newId(),
        source: input.source,
        externalId,
        createdAt: ts,
        deletedAt: null,
        ...patch,
      };
      workouts.set(workout.id, workout);
      api.applyWorkoutHabitAutoCredit({
        dateLocal: workout.dateLocal,
        workoutType: workout.type,
        durationSec: workout.durationSec,
      });
      notify();
      return { ...workout };
    },
    getWorkoutById(workoutId) {
      const w = workouts.get(workoutId);
      return w && !w.deletedAt ? { ...w } : null;
    },
    listWorkoutsForDate(dateLocal) {
      return [...workouts.values()]
        .filter((w) => w.dateLocal === dateLocal && w.deletedAt == null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    listIntegratedWorkouts(source, limit = 200) {
      return [...workouts.values()]
        .filter((w) => w.source === source && w.deletedAt == null)
        .sort((a, b) => {
          const byDate = b.dateLocal.localeCompare(a.dateLocal);
          if (byDate !== 0) return byDate;
          return b.createdAt.localeCompare(a.createdAt);
        })
        .slice(0, limit)
        .map((w) => ({ ...w }));
    },
    softDeleteWorkout(workoutId) {
      const w = workouts.get(workoutId);
      if (!w) throw new Error('Workout not found');
      w.deletedAt = nowIso();
      notify();
      return { ...w };
    },
    restoreWorkout(workoutId) {
      const w = workouts.get(workoutId);
      if (!w) throw new Error('Workout not found');
      w.deletedAt = null;
      notify();
      return { ...w };
    },
    upsertDailyActivityStats(input) {
      assertLocalDate(input.dateLocal);
      const steps =
        input.steps === undefined || input.steps === null
          ? null
          : (assertNonNegativeFinite(input.steps, 'steps'), input.steps);
      const distanceM =
        input.distanceM === undefined || input.distanceM === null
          ? null
          : (assertNonNegativeFinite(input.distanceM, 'distanceM'), input.distanceM);
      const activeKcal =
        input.activeKcal === undefined || input.activeKcal === null
          ? null
          : (assertNonNegativeFinite(input.activeKcal, 'activeKcal'), input.activeKcal);
      const existing = [...dailyActivityStats.values()].find(
        (s) => s.dateLocal === input.dateLocal && s.source === input.source,
      );
      const ts = nowIso();
      if (existing) {
        if (steps !== null) existing.steps = steps;
        if (distanceM !== null) existing.distanceM = distanceM;
        if (activeKcal !== null) existing.activeKcal = activeKcal;
        if (input.externalId !== undefined) existing.externalId = input.externalId;
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const row: DailyActivityStats = {
        id: newId(),
        dateLocal: input.dateLocal,
        steps,
        distanceM,
        activeKcal,
        source: input.source,
        externalId: input.externalId ?? null,
        updatedAt: ts,
      };
      dailyActivityStats.set(row.id, row);
      notify();
      return { ...row };
    },
    getDailyActivityStats(dateLocal) {
      const rows = [...dailyActivityStats.values()].filter((s) => s.dateLocal === dateLocal);
      if (rows.length === 0) return null;
      // Prefer garmin over empty; single source per day for MVP.
      const garmin = rows.find((r) => r.source === 'garmin');
      return { ...(garmin ?? rows[0]!) };
    },
    listIntegratedDailyActivityStats(source, limit = 200) {
      return [...dailyActivityStats.values()]
        .filter((s) => s.source === source)
        .sort((a, b) => b.dateLocal.localeCompare(a.dateLocal))
        .slice(0, limit)
        .map((s) => ({ ...s }));
    },
    upsertSleepNight(input) {
      assertLocalDate(input.dateLocal);
      const optSec = (v: number | null | undefined, label: string): number | null => {
        if (v === undefined || v === null) return null;
        assertNonNegativeFinite(v, label);
        return v;
      };
      const sleepSec = optSec(input.sleepSec, 'sleepSec');
      const deepSec = optSec(input.deepSec, 'deepSec');
      const lightSec = optSec(input.lightSec, 'lightSec');
      const remSec = optSec(input.remSec, 'remSec');
      const awakeSec = optSec(input.awakeSec, 'awakeSec');
      const avgSpo2 = optSec(input.avgSpo2, 'avgSpo2');
      const avgRespiration = optSec(input.avgRespiration, 'avgRespiration');
      const sleepScore = optSec(input.sleepScore, 'sleepScore');
      if (avgSpo2 != null && avgSpo2 > 100) throw new Error('SpO₂ — от 0 до 100');
      if (sleepScore != null && sleepScore > 100) throw new Error('Оценка сна — от 0 до 100');
      const existing = [...sleepNights.values()].find(
        (s) =>
          (input.externalId && s.externalId === input.externalId) ||
          (s.dateLocal === input.dateLocal && s.source === input.source),
      );
      const ts = nowIso();
      if (existing) {
        if (sleepSec !== null) existing.sleepSec = sleepSec;
        if (deepSec !== null) existing.deepSec = deepSec;
        if (lightSec !== null) existing.lightSec = lightSec;
        if (remSec !== null) existing.remSec = remSec;
        if (awakeSec !== null) existing.awakeSec = awakeSec;
        if (input.startAt !== undefined) existing.startAt = input.startAt;
        if (input.endAt !== undefined) existing.endAt = input.endAt;
        if (avgSpo2 !== null) existing.avgSpo2 = avgSpo2;
        if (avgRespiration !== null) existing.avgRespiration = avgRespiration;
        if (sleepScore !== null) existing.sleepScore = sleepScore;
        if (input.externalId !== undefined) existing.externalId = input.externalId;
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const row: SleepNight = {
        id: newId(),
        dateLocal: input.dateLocal,
        sleepSec,
        deepSec,
        lightSec,
        remSec,
        awakeSec,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        avgSpo2,
        avgRespiration,
        sleepScore,
        source: input.source,
        externalId: input.externalId ?? null,
        updatedAt: ts,
      };
      sleepNights.set(row.id, row);
      notify();
      return { ...row };
    },
    getSleepForDate(dateLocal) {
      const rows = [...sleepNights.values()].filter((s) => s.dateLocal === dateLocal);
      if (rows.length === 0) return null;
      const garmin = rows.find((r) => r.source === 'garmin');
      return { ...(garmin ?? rows[0]!) };
    },
    listSleepNights(limit = 60) {
      return [...sleepNights.values()]
        .sort((a, b) => b.dateLocal.localeCompare(a.dateLocal))
        .slice(0, limit)
        .map((s) => ({ ...s }));
    },
    removeManualSleepNight(dateLocal) {
      const row = [...sleepNights.values()].find(s => s.source === 'user' && s.dateLocal === dateLocal);
      if (!row) return null;
      sleepNights.delete(row.id);
      notify();
      return { ...row };
    },
    restoreManualSleepNight(night) {
      if (night.source !== 'user') throw new Error('Можно восстановить только ручную запись');
      assertLocalDate(night.dateLocal);
      if ([...sleepNights.values()].some(s => s.source === 'user' && s.dateLocal === night.dateLocal)) {
        throw new Error('За эту ночь уже есть новая ручная запись');
      }
      sleepNights.set(night.id, { ...night });
      notify();
    },
    getGarminSyncState() {
      return { ...garminSync };
    },
    setGarminSyncState(patch) {
      garminSync = normalizeGarminSync({ ...garminSync, ...patch });
      notify();
      return { ...garminSync };
    },
    ensureStrengthCatalog() {
      if (syncBuiltinStrengthProgram()) notify();
    },
    applyStrengthProgramWeek(weekStartMonday, opts) {
      assertLocalDate(weekStartMonday);
      if (new Date(`${weekStartMonday}T12:00:00Z`).getUTCDay() !== 1) throw new Error('Неделя начинается с понедельника');
      api.ensureStrengthCatalog();
      const drafts = buildPersonalProgramWeekDrafts(weekStartMonday);
      for (const d of drafts) if (d.templateId && !api.getWorkoutTemplate(d.templateId)) throw new Error('В программе есть удалённый шаблон');
      const replace = opts?.replace === true;
      if (replace) {
        const existing = api.listPlannedActivitiesInWeek(weekStartMonday);
        for (const a of existing) {
          const row = plannedActivities.get(a.id);
          if (row && !row.deletedAt) row.deletedAt = nowIso();
        }
      }
      let created = 0;
      for (const d of drafts) {
        api.addPlannedActivity({
          dateLocal: d.dateLocal,
          timeLocal: d.timeLocal,
          kind: d.kind,
          title: d.title,
          subtitle: d.subtitle,
          templateId: d.templateId,
          cardioMinutes: d.cardioMinutes,
          sortOrder: d.sortOrder,
        });
        created += 1;
      }
      return { created };
    },
    repeatTrainingWeek(sourceMonday, targetMonday) {
      for (const date of [sourceMonday, targetMonday]) {
        assertLocalDate(date);
        if (new Date(`${date}T12:00:00Z`).getUTCDay() !== 1) throw new Error('Неделя начинается с понедельника');
      }
      if (sourceMonday === targetMonday) throw new Error('Выбери другую неделю');
      const source = api.listPlannedActivitiesInWeek(sourceMonday);
      if (!source.length) throw new Error('В прошлой неделе нет плана для повтора');
      // Validate the whole operation before creating anything.
      for (const row of source) {
        if (row.templateId && !api.getWorkoutTemplate(row.templateId)) throw new Error('В плане есть удалённый шаблон');
      }
      const sourceDates = datesInWeek(sourceMonday);
      const targetDates = datesInWeek(targetMonday);
      return source.map(row => api.copyPlannedActivity(row.id, {
        dateLocal: targetDates[sourceDates.indexOf(row.dateLocal)]!,
      }));
    },
    getTrainingCycle() { return trainingCycle ? cloneTrainingCycle(trainingCycle) : null; },
    restoreTrainingCycle(previous) { trainingCycle = previous ? cloneTrainingCycle(previous) : null; notify(); },
    saveTrainingCycle(input) {
      const next = cloneTrainingCycle({ ...input, updatedAt: nowIso() });
      for (const slot of next.slots) if (slot.templateId && !api.getWorkoutTemplate(slot.templateId)) throw new Error('В шаблоне есть удалённая силовая тренировка');
      trainingCycle = next; notify(); return cloneTrainingCycle(next);
    },
    applyTrainingCycleWeek(monday, opts) {
      assertLocalDate(monday);
      if (new Date(`${monday}T12:00:00Z`).getUTCDay() !== 1) throw new Error('Неделя начинается с понедельника');
      if (!trainingCycle) throw new Error('Сначала сохрани шаблон недели');
      const cycle = cloneTrainingCycle(trainingCycle);
      if (!cycle.slots.length) throw new Error('Добавь тренировки или дни отдыха в шаблон');
      for (const slot of cycle.slots) if (slot.templateId && !api.getWorkoutTemplate(slot.templateId)) throw new Error('В шаблоне есть удалённая силовая тренировка');
      if (opts?.replace) for (const row of api.listPlannedActivitiesInWeek(monday)) api.softDeletePlannedActivity(row.id);
      const dates = datesInWeek(monday);
      for (const slot of cycle.slots) api.addPlannedActivity({ ...slot, dateLocal: dates[slot.weekdayIndex]! });
      return { created: cycle.slots.length };
    },
    linkPlannedCycling(activityId, workoutId) {
      const row = plannedActivities.get(activityId);
      if (!row || row.deletedAt || row.kind !== 'cardio') throw new Error('Велоплан не найден');
      if (workoutId) {
        const workout = api.getWorkoutById(workoutId);
        if (!workout || workout.source !== 'garmin' || workout.type !== 'cycling') throw new Error('Выбери выполненную велотренировку Garmin');
        if ([...plannedActivities.values()].some(a => !a.deletedAt && a.id !== activityId && a.linkedWorkoutId === workoutId)) throw new Error('Эта велотренировка уже связана с другим планом');
      }
      row.linkedWorkoutId = workoutId; notify(); return { ...row };
    },
    fillTrainingCycleWeeks(monday, weeks) {
      assertLocalDate(monday);
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12 || new Date(`${monday}T12:00:00Z`).getUTCDay() !== 1) throw new Error('Выбери от 1 до 12 недель с понедельника');
      if (!trainingCycle) throw new Error('Сначала сохрани шаблон недели');
      if (!trainingCycle.slots.length) throw new Error('Добавь тренировки или дни отдыха в шаблон');
      for (const slot of trainingCycle.slots) if (slot.templateId && !api.getWorkoutTemplate(slot.templateId)) throw new Error('В шаблоне есть удалённая силовая тренировка');
      const starts = Array.from({ length: weeks }, (_, index) => { const d = new Date(`${monday}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + index * 7); const start = d.toISOString().slice(0, 10); assertLocalDate(start); return start; });
      const createdIds: string[] = []; let skippedWeeks = 0;
      for (const start of starts) {
        if (api.listPlannedActivitiesInWeek(start).length) { skippedWeeks++; continue; }
        api.applyTrainingCycleWeek(start);
        createdIds.push(...api.listPlannedActivitiesInWeek(start).map(a => a.id));
      }
      return { createdIds, skippedWeeks };
    },
    listStrengthExercises() {
      return [...strengthExercises.values()]
        .filter((e) => !e.deletedAt)
        .map((e) => ({
          ...e,
          primaryMuscles: [...e.primaryMuscles],
          secondaryMuscles: [...e.secondaryMuscles],
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    },
    getStrengthExercise(exerciseId) {
      const e = strengthExercises.get(exerciseId);
      if (!e || e.deletedAt) return null;
      return {
        ...e,
        primaryMuscles: [...e.primaryMuscles],
        secondaryMuscles: [...e.secondaryMuscles],
      };
    },
    createStrengthExercise(input) {
      const name = input.name.trim();
      if (!name) throw new Error('Exercise name required');
      const primary = input.primaryMuscles?.length ? [...input.primaryMuscles] : (['other'] as MuscleGroup[]);
      const secondary = input.secondaryMuscles ? [...input.secondaryMuscles] : [];
      const row: StrengthExercise = {
        id: newId(),
        name,
        primaryMuscles: primary,
        secondaryMuscles: secondary,
        equipment: input.equipment?.trim() ? input.equipment.trim() : null,
        createdAt: nowIso(),
        deletedAt: null,
      };
      strengthExercises.set(row.id, row);
      notify();
      return {
        ...row,
        primaryMuscles: [...row.primaryMuscles],
        secondaryMuscles: [...row.secondaryMuscles],
      };
    },
    softDeleteStrengthExercise(exerciseId) {
      const e = strengthExercises.get(exerciseId);
      if (!e || e.deletedAt) throw new Error('Exercise not found');
      e.deletedAt = nowIso();
      notify();
      return {
        ...e,
        primaryMuscles: [...e.primaryMuscles],
        secondaryMuscles: [...e.secondaryMuscles],
      };
    },
    listWorkoutTemplates() {
      return [...workoutTemplates.values()]
        .filter((t) => !t.deletedAt)
        .map((t) => ({ ...t }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    },
    getWorkoutTemplate(templateId) {
      const t = workoutTemplates.get(templateId);
      if (!t || t.deletedAt) return null;
      return { ...t };
    },
    listTemplateExercises(templateId) {
      return [...workoutTemplateExercises.values()]
        .filter((l) => l.templateId === templateId)
        .map((l) => ({ ...l }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    },
    createWorkoutTemplate(input) {
      const name = input.name.trim();
      if (!name) throw new Error('Template name required');
      const ts = nowIso();
      const template: WorkoutTemplate = {
        id: newId(),
        name,
        subtitle: input.subtitle?.trim() ? input.subtitle.trim() : null,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      workoutTemplates.set(template.id, template);
      const lines = input.exercises ?? [];
      lines.forEach((line, i) => {
        if (!strengthExercises.has(line.exerciseId)) {
          throw new Error(`Unknown exercise: ${line.exerciseId}`);
        }
        assertPositiveFinite(line.targetSets, 'targetSets');
        if (line.targetRepsMin != null) assertNonNegativeFinite(line.targetRepsMin, 'targetRepsMin');
        if (line.targetRepsMax != null) assertNonNegativeFinite(line.targetRepsMax, 'targetRepsMax');
        if (line.restSec != null) assertNonNegativeFinite(line.restSec, 'restSec');
        const row: WorkoutTemplateExercise = {
          id: newId(),
          templateId: template.id,
          exerciseId: line.exerciseId,
          sortOrder: i,
          targetSets: line.targetSets,
          targetRepsMin: line.targetRepsMin ?? null,
          targetRepsMax: line.targetRepsMax ?? null,
          restSec: line.restSec ?? null,
          notes: line.notes?.trim() ? line.notes.trim() : null,
        };
        workoutTemplateExercises.set(row.id, row);
      });
      notify();
      return { ...template };
    },
    updateWorkoutTemplate(templateId, fields) {
      const t = workoutTemplates.get(templateId);
      if (!t || t.deletedAt) throw new Error('Workout template not found');
      if (fields.name !== undefined) {
        const name = fields.name.trim();
        if (!name) throw new Error('Template name required');
        t.name = name;
      }
      if (fields.subtitle !== undefined) {
        t.subtitle = fields.subtitle?.trim() ? fields.subtitle.trim() : null;
      }
      t.updatedAt = nowIso();
      notify();
      return { ...t };
    },
    softDeleteWorkoutTemplate(templateId) {
      const t = workoutTemplates.get(templateId);
      if (!t || t.deletedAt) throw new Error('Workout template not found');
      const ts = nowIso();
      t.deletedAt = ts;
      t.updatedAt = ts;
      notify();
      return { ...t };
    },
    setTemplateExercises(templateId, lines) {
      const t = workoutTemplates.get(templateId);
      if (!t || t.deletedAt) throw new Error('Workout template not found');
      for (const existing of [...workoutTemplateExercises.values()]) {
        if (existing.templateId === templateId) workoutTemplateExercises.delete(existing.id);
      }
      const created: WorkoutTemplateExercise[] = [];
      lines.forEach((line, i) => {
        const ex = strengthExercises.get(line.exerciseId);
        if (!ex || ex.deletedAt) {
          throw new Error(`Unknown exercise: ${line.exerciseId}`);
        }
        assertPositiveFinite(line.targetSets, 'targetSets');
        if (line.targetRepsMin != null) assertNonNegativeFinite(line.targetRepsMin, 'targetRepsMin');
        if (line.targetRepsMax != null) assertNonNegativeFinite(line.targetRepsMax, 'targetRepsMax');
        if (line.restSec != null) assertNonNegativeFinite(line.restSec, 'restSec');
        const row: WorkoutTemplateExercise = {
          id: newId(),
          templateId,
          exerciseId: line.exerciseId,
          sortOrder: i,
          targetSets: line.targetSets,
          targetRepsMin: line.targetRepsMin ?? null,
          targetRepsMax: line.targetRepsMax ?? null,
          restSec: line.restSec ?? null,
          notes: line.notes?.trim() ? line.notes.trim() : null,
        };
        workoutTemplateExercises.set(row.id, row);
        created.push({ ...row });
      });
      t.updatedAt = nowIso();
      notify();
      return created;
    },
    reorderTemplateExercise(templateId, lineId, direction) {
      const t = workoutTemplates.get(templateId);
      if (!t || t.deletedAt) throw new Error('Workout template not found');
      const lines = [...workoutTemplateExercises.values()]
        .filter((l) => l.templateId === templateId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      const idx = lines.findIndex((l) => l.id === lineId);
      if (idx < 0) throw new Error('Template exercise not found');
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= lines.length) {
        return lines.map((l) => ({ ...l }));
      }
      const a = lines[idx]!;
      const b = lines[swapWith]!;
      const tmp = a.sortOrder;
      a.sortOrder = b.sortOrder;
      b.sortOrder = tmp;
      // Normalize to 0..n-1 after swap
      lines
        .sort((x, y) => x.sortOrder - y.sortOrder || x.id.localeCompare(y.id))
        .forEach((l, i) => {
          l.sortOrder = i;
        });
      t.updatedAt = nowIso();
      notify();
      return api.listTemplateExercises(templateId);
    },
    listPlannedActivitiesForDate(dateLocal) {
      return [...plannedActivities.values()]
        .filter((a) => !a.deletedAt && a.dateLocal === dateLocal)
        .map((a) => ({ ...a }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    },
    listPlannedActivitiesInWeek(weekStart) {
      const days = new Set(datesInWeek(weekStart));
      return [...plannedActivities.values()]
        .filter((a) => !a.deletedAt && days.has(a.dateLocal))
        .map((a) => ({ ...a }))
        .sort(
          (a, b) =>
            a.dateLocal.localeCompare(b.dateLocal) ||
            a.sortOrder - b.sortOrder ||
            a.createdAt.localeCompare(b.createdAt),
        );
    },
    addPlannedActivity(input) {
      assertLocalDate(input.dateLocal);
      assertLocalTime(input.timeLocal ?? null);
      const title = input.title.trim();
      if (!title) throw new Error('Activity title required');
      if (input.templateId && !api.getWorkoutTemplate(input.templateId)) {
        throw new Error('Workout template not found');
      }
      if (input.cardioMinutes != null) assertNonNegativeFinite(input.cardioMinutes, 'cardioMinutes');
      const sameDay = [...plannedActivities.values()].filter(
        (a) => !a.deletedAt && a.dateLocal === input.dateLocal,
      );
      const sortOrder =
        input.sortOrder ?? (sameDay.length === 0 ? 0 : Math.max(...sameDay.map((a) => a.sortOrder)) + 1);
      const row: PlannedActivity = {
        linkedWorkoutId: null,
        id: newId(),
        dateLocal: input.dateLocal,
        timeLocal: input.timeLocal ?? null,
        kind: input.kind,
        title,
        subtitle: input.subtitle?.trim() ? input.subtitle.trim() : null,
        templateId: input.templateId ?? null,
        cardioMinutes: input.cardioMinutes ?? null,
        sortOrder,
        createdAt: nowIso(),
        deletedAt: null,
      };
      plannedActivities.set(row.id, row);
      notify();
      return { ...row };
    },
    updatePlannedActivity(activityId, fields) {
      const a = plannedActivities.get(activityId);
      if (!a || a.deletedAt) throw new Error('Planned activity not found');
      if (fields.timeLocal !== undefined) assertLocalTime(fields.timeLocal);
      if (fields.templateId && !api.getWorkoutTemplate(fields.templateId)) throw new Error('Workout template not found');
      if (fields.cardioMinutes != null) assertNonNegativeFinite(fields.cardioMinutes, 'cardioMinutes');
      // All validation precedes mutation, including optional title/template/duration fields.
      if (fields.title !== undefined) {
        const title = fields.title.trim();
        if (!title) throw new Error('Activity title required');
        a.title = title;
      }
      if (fields.subtitle !== undefined) {
        a.subtitle = fields.subtitle?.trim() ? fields.subtitle.trim() : null;
      }
      if (fields.timeLocal !== undefined) a.timeLocal = fields.timeLocal;
      if (fields.templateId !== undefined) {
        if (fields.templateId && !workoutTemplates.has(fields.templateId)) {
          throw new Error('Workout template not found');
        }
        a.templateId = fields.templateId;
      }
      if (fields.cardioMinutes !== undefined) {
        if (fields.cardioMinutes != null) assertNonNegativeFinite(fields.cardioMinutes, 'cardioMinutes');
        a.cardioMinutes = fields.cardioMinutes;
      }
      notify();
      return { ...a };
    },
    reorderPlannedActivity(activityId, direction) {
      const a = plannedActivities.get(activityId);
      if (!a || a.deletedAt) throw new Error('Planned activity not found');
      const sameDay = [...plannedActivities.values()]
        .filter((x) => !x.deletedAt && x.dateLocal === a.dateLocal)
        .sort((x, y) => x.sortOrder - y.sortOrder || x.createdAt.localeCompare(y.createdAt));
      const idx = sameDay.findIndex((x) => x.id === activityId);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= sameDay.length) {
        return sameDay.map((x) => ({ ...x }));
      }
      const other = sameDay[swapWith]!;
      const tmp = a.sortOrder;
      a.sortOrder = other.sortOrder;
      other.sortOrder = tmp;
      sameDay
        .sort((x, y) => x.sortOrder - y.sortOrder || x.createdAt.localeCompare(y.createdAt))
        .forEach((row, i) => {
          row.sortOrder = i;
        });
      notify();
      return api.listPlannedActivitiesForDate(a.dateLocal);
    },
    movePlannedActivity(activityId, args) {
      const a = plannedActivities.get(activityId);
      if (!a || a.deletedAt) throw new Error('Planned activity not found');
      assertLocalDate(args.dateLocal);
      if (args.timeLocal !== undefined) assertLocalTime(args.timeLocal);
      if (args.sortOrder != null && (!Number.isInteger(args.sortOrder) || args.sortOrder < 0)) throw new Error('Некорректный порядок');
      const others = api.listPlannedActivitiesForDate(args.dateLocal).filter(row => row.id !== activityId);
      if (args.sortOrder === undefined && a.dateLocal !== args.dateLocal) {
        a.sortOrder = others.length ? Math.max(...others.map(row => row.sortOrder)) + 1 : 0;
      }
      a.dateLocal = args.dateLocal;
      if (args.timeLocal !== undefined) a.timeLocal = args.timeLocal;
      if (args.sortOrder !== undefined) a.sortOrder = args.sortOrder;
      notify();
      return { ...a };
    },
    swapPlannedActivities(firstId, secondId) {
      const first = plannedActivities.get(firstId);
      const second = plannedActivities.get(secondId);
      if (!first || first.deletedAt || !second || second.deletedAt) {
        throw new Error('Planned activity not found');
      }
      if (firstId === secondId) return [{ ...first }, { ...second }];
      const firstDate = first.dateLocal;
      const firstOrder = first.sortOrder;
      first.dateLocal = second.dateLocal;
      first.sortOrder = second.sortOrder;
      second.dateLocal = firstDate;
      second.sortOrder = firstOrder;
      notify();
      return [{ ...first }, { ...second }];
    },
    copyPlannedActivity(activityId, args) {
      const a = plannedActivities.get(activityId);
      if (!a || a.deletedAt) throw new Error('Planned activity not found');
      assertLocalDate(args.dateLocal);
      if (args.timeLocal !== undefined) assertLocalTime(args.timeLocal);
      const sameDay = [...plannedActivities.values()].filter(
        (x) => !x.deletedAt && x.dateLocal === args.dateLocal,
      );
      const sortOrder = sameDay.length === 0 ? 0 : Math.max(...sameDay.map((x) => x.sortOrder)) + 1;
      const copy: PlannedActivity = {
        ...a,
        linkedWorkoutId: null,
        id: newId(),
        dateLocal: args.dateLocal,
        timeLocal: args.timeLocal !== undefined ? args.timeLocal : a.timeLocal,
        sortOrder,
        createdAt: nowIso(),
        deletedAt: null,
      };
      plannedActivities.set(copy.id, copy);
      notify();
      return { ...copy };
    },
    softDeletePlannedActivity(activityId) {
      const a = plannedActivities.get(activityId);
      if (!a || a.deletedAt) throw new Error('Planned activity not found');
      a.deletedAt = nowIso();
      notify();
      return { ...a };
    },
    restorePlannedActivity(activityId) {
      const a = plannedActivities.get(activityId);
      if (!a) throw new Error('Planned activity not found');
      a.deletedAt = null;
      notify();
      return { ...a };
    },
    startWorkoutSession(input) {
      assertLocalDate(input.dateLocal);
      const title = input.title.trim();
      if (!title) throw new Error('Session title required');
      if (input.templateId && !api.getWorkoutTemplate(input.templateId)) {
        throw new Error('Workout template not found');
      }
      if (input.plannedActivityId) {
        const planned = plannedActivities.get(input.plannedActivityId);
        if (!planned || planned.deletedAt || planned.kind !== 'strength') throw new Error('Силовая тренировка не найдена в плане');
        const existing = api.getWorkoutSessionForPlan(input.plannedActivityId);
        if (existing) return { ...existing };
      } else {
        const draft = [...workoutSessions.values()].find(s => !s.deletedAt && s.status === 'in_progress' && s.dateLocal === input.dateLocal && s.templateId === (input.templateId ?? null) && s.title === title);
        if (draft) return { ...draft };
      }
      const ts = nowIso();
      const session: WorkoutSession = {
        id: newId(),
        dateLocal: input.dateLocal,
        templateId: input.templateId ?? null,
        plannedActivityId: input.plannedActivityId ?? null,
        title,
        status: 'in_progress' satisfies WorkoutSessionStatus,
        startedAt: ts,
        completedAt: null,
        feelingRpe: null,
        feelingNote: null,
        createdAt: ts,
        deletedAt: null,
      };
      workoutSessions.set(session.id, session);

      // Prefill empty set rows from template — targets only, no invented weights.
      if (session.templateId) {
        const lines = api.listTemplateExercises(session.templateId);
        for (const line of lines) {
          const prev = previousCompletedSetsForExercise({
            exerciseId: line.exerciseId,
            sessions: [...workoutSessions.values()],
            sets: [...workoutSets.values()],
            excludeSessionId: session.id,
          });
          for (let i = 1; i <= line.targetSets; i++) {
            const hint = prev[i - 1] ?? null;
            const set: WorkoutSet = {
              id: newId(),
              sessionId: session.id,
              exerciseId: line.exerciseId,
              setIndex: i,
              weightKg: null,
              reps: null,
              completed: false,
              completedAt: null,
              targetWeightKg: hint?.weightKg ?? null,
              targetReps:
                hint?.reps ??
                line.targetRepsMin ??
                line.targetRepsMax ??
                null,
              createdAt: ts,
              deletedAt: null,
            };
            workoutSets.set(set.id, set);
          }
        }
      }
      notify();
      return { ...session };
    },
    getWorkoutSession(sessionId) {
      const s = workoutSessions.get(sessionId);
      if (!s || s.deletedAt) return null;
      return { ...s };
    },
    getWorkoutSessionForPlan(activityId) {
      const rows = [...workoutSessions.values()].filter(s => !s.deletedAt && s.plannedActivityId === activityId && s.status !== 'abandoned');
      rows.sort((a, b) => Number(b.status === 'completed') - Number(a.status === 'completed') || b.startedAt.localeCompare(a.startedAt));
      return rows[0] ? { ...rows[0] } : null;
    },
    listWorkoutSessionsForDate(dateLocal) {
      return [...workoutSessions.values()]
        .filter((s) => !s.deletedAt && s.dateLocal === dateLocal)
        .map((s) => ({ ...s }))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    listInProgressWorkoutSessions() {
      return [...workoutSessions.values()]
        .filter((s) => !s.deletedAt && s.status === 'in_progress')
        .map((s) => ({ ...s }))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    completeWorkoutSession(sessionId, opts) {
      const s = workoutSessions.get(sessionId);
      if (!s || s.deletedAt) throw new Error('Workout session not found');
      if (opts?.feelingRpe != null) {
        assertPositiveFinite(opts.feelingRpe, 'feelingRpe');
        if (!Number.isInteger(opts.feelingRpe) || opts.feelingRpe < 1 || opts.feelingRpe > 10) {
          throw new Error('feelingRpe must be an integer 1–10');
        }
      }
      if (s.status === 'completed') return { ...s };
      if (s.status !== 'in_progress') throw new Error('Сессия уже закрыта');
      if (opts?.feelingRpe != null) s.feelingRpe = opts.feelingRpe;
      if (opts?.feelingNote !== undefined) {
        const note = opts.feelingNote?.trim() ? opts.feelingNote.trim() : null;
        s.feelingNote = note;
      }
      s.status = 'completed';
      s.completedAt = nowIso();
      const elapsed = (Date.parse(s.completedAt) - Date.parse(s.startedAt)) / 1000;
      api.applyWorkoutHabitAutoCredit({ dateLocal: s.dateLocal, workoutType: 'strength', durationSec: Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0 });
      notify();
      return { ...s };
    },
    abandonWorkoutSession(sessionId) {
      const s = workoutSessions.get(sessionId);
      if (!s || s.deletedAt) throw new Error('Workout session not found');
      if (s.status !== 'in_progress') throw new Error('Сессия уже закрыта');
      s.status = 'abandoned';
      s.completedAt = nowIso();
      notify();
      return { ...s };
    },
    listWorkoutSets(sessionId) {
      const rows = [...workoutSets.values()].filter(s => !s.deletedAt && s.sessionId === sessionId);
      // Map insertion order captures the template at session creation, even if edited later.
      const exerciseOrder = new Map<string, number>();
      for (const row of rows) if (!exerciseOrder.has(row.exerciseId)) exerciseOrder.set(row.exerciseId, exerciseOrder.size);
      return rows
        .map((s) => ({ ...s }))
        .sort(
          (a, b) =>
            exerciseOrder.get(a.exerciseId)! - exerciseOrder.get(b.exerciseId)! || a.setIndex - b.setIndex,
        );
    },
    upsertWorkoutSet(input) {
      const session = workoutSessions.get(input.sessionId);
      if (!session || session.deletedAt) throw new Error('Workout session not found');
      if (session.status !== 'in_progress') throw new Error('Завершённая сессия доступна только для просмотра');
      if (!strengthExercises.has(input.exerciseId)) throw new Error('Unknown exercise');
      if (!Number.isInteger(input.setIndex) || input.setIndex < 1) {
        throw new Error('setIndex must be a positive integer');
      }
      if (input.weightKg != null) assertNonNegativeFinite(input.weightKg, 'weightKg');
      if (input.reps != null) assertNonNegativeFinite(input.reps, 'reps');
      assertRepetitions(input.reps);
      assertRepetitions(input.targetReps);
      if (input.targetWeightKg != null) assertNonNegativeFinite(input.targetWeightKg, 'targetWeightKg');
      if (input.targetReps != null) assertNonNegativeFinite(input.targetReps, 'targetReps');

      const existing = [...workoutSets.values()].find(
        (s) =>
          !s.deletedAt &&
          s.sessionId === input.sessionId &&
          s.exerciseId === input.exerciseId &&
          s.setIndex === input.setIndex,
      );
      const completed = input.completed ?? existing?.completed ?? false;
      const ts = nowIso();
      if (existing) {
        existing.weightKg = input.weightKg !== undefined ? input.weightKg : existing.weightKg;
        existing.reps = input.reps !== undefined ? input.reps : existing.reps;
        existing.completed = completed;
        existing.completedAt = completed ? existing.completedAt ?? ts : null;
        if (input.targetWeightKg !== undefined) existing.targetWeightKg = input.targetWeightKg;
        if (input.targetReps !== undefined) existing.targetReps = input.targetReps;
        notify();
        return { ...existing };
      }
      const row: WorkoutSet = {
        id: newId(),
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        setIndex: input.setIndex,
        weightKg: input.weightKg ?? null,
        reps: input.reps ?? null,
        completed,
        completedAt: completed ? ts : null,
        targetWeightKg: input.targetWeightKg ?? null,
        targetReps: input.targetReps ?? null,
        createdAt: ts,
        deletedAt: null,
      };
      workoutSets.set(row.id, row);
      notify();
      return { ...row };
    },
    completeWorkoutSet(setId, args) {
      const s = workoutSets.get(setId);
      if (!s || s.deletedAt) throw new Error('Workout set not found');
      if (workoutSessions.get(s.sessionId)?.status !== 'in_progress') throw new Error('Завершённая сессия доступна только для просмотра');
      if (args.weightKg != null) assertNonNegativeFinite(args.weightKg, 'weightKg');
      if (args.reps != null) assertNonNegativeFinite(args.reps, 'reps');
      assertRepetitions(args.reps);
      s.weightKg = args.weightKg;
      s.reps = args.reps;
      s.completed = true;
      s.completedAt = nowIso();
      notify();
      return { ...s };
    },
    softDeleteWorkoutSet(setId) {
      const s = workoutSets.get(setId);
      if (!s || s.deletedAt) throw new Error('Workout set not found');
      if (workoutSessions.get(s.sessionId)?.status !== 'in_progress') throw new Error('Завершённая сессия доступна только для просмотра');
      s.deletedAt = nowIso();
      notify();
      return { ...s };
    },
    previousSetsForExercise(exerciseId, excludeSessionId) {
      return previousCompletedSetsForExercise({
        exerciseId,
        sessions: [...workoutSessions.values()],
        sets: [...workoutSets.values()],
        excludeSessionId: excludeSessionId ?? null,
      });
    },
    activityMinutesForDate(dateLocal) {
      const sec = completedTrainingFacts(api.listWorkoutsForDate(dateLocal), api.listWorkoutSessionsForDate(dateLocal))
        .reduce((sum, w) => sum + (w.durationSec ?? 0), 0);
      return Math.round(sec / 60);
    },
    activityEnergyKcalForDate(dateLocal) {
      const weight = api.latestWeight();
      const weightKg = weight ? weight.kg : null;
      return sumActivityKcal(
        api.listWorkoutsForDate(dateLocal).map((w) => ({
          type: w.type,
          durationSec: w.durationSec,
        })),
        weightKg,
      );
    },
    createFlexibleHabit(name, timesPerWeek, opts) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Введи название привычки');
      if (!Number.isInteger(timesPerWeek) || timesPerWeek < 1 || timesPerWeek > 7) {
        throw new Error('Частота — целое число от 1 до 7');
      }
      const kind: HabitKind = opts?.kind === 'quantity' ? 'quantity' : 'checkbox';
      let targetValue: number | null = opts?.targetValue ?? null;
      let unit: string | null = opts?.unit?.trim() || null;
      if (kind === 'quantity') {
        if (targetValue == null || !Number.isFinite(targetValue) || targetValue <= 0) {
          throw new Error('Для количественной привычки укажи цель > 0');
        }
        if (!unit) unit = 'раз';
      } else {
        targetValue = null;
        unit = null;
      }
      const habit: FlexibleHabit = {
        id: newId(),
        name: trimmed,
        timesPerWeek,
        kind,
        unit,
        targetValue,
        pausedAt: null,
        autoSource: opts?.autoSource ?? null,
        active: true,
        createdAt: nowIso(),
        deletedAt: null,
      };
      flexibleHabits.set(habit.id, habit);
      notify();
      return { ...habit };
    },
    listFlexibleHabits() {
      return [...flexibleHabits.values()]
        .filter((h) => h.active && h.deletedAt == null)
        .sort((a, b) => {
          const ap = a.pausedAt ? 1 : 0;
          const bp = b.pausedAt ? 1 : 0;
          if (ap !== bp) return ap - bp;
          return a.createdAt.localeCompare(b.createdAt);
        });
    },
    updateFlexibleHabit(habitId, fields) {
      const stored = flexibleHabits.get(habitId);
      if (!stored || stored.deletedAt != null) throw new Error('Привычка не найдена');
      const habit = { ...stored };
      if (fields.name !== undefined) {
        const trimmed = fields.name.trim();
        if (!trimmed) throw new Error('Введи название привычки');
        habit.name = trimmed;
      }
      if (fields.timesPerWeek !== undefined) {
        if (
          !Number.isInteger(fields.timesPerWeek) ||
          fields.timesPerWeek < 1 ||
          fields.timesPerWeek > 7
        ) {
          throw new Error('Частота — целое число от 1 до 7');
        }
        habit.timesPerWeek = fields.timesPerWeek;
      }
      if (fields.kind !== undefined) habit.kind = fields.kind;
      if (fields.unit !== undefined) habit.unit = fields.unit?.trim() || null;
      if (fields.targetValue !== undefined) habit.targetValue = fields.targetValue;
      if (fields.autoSource !== undefined) habit.autoSource = fields.autoSource;
      if (fields.paused === true) habit.pausedAt = nowIso();
      if (fields.paused === false) habit.pausedAt = null;
      if (habit.kind === 'quantity') {
        if (habit.targetValue == null || !Number.isFinite(habit.targetValue) || habit.targetValue <= 0) {
          throw new Error('Для количественной привычки укажи цель > 0');
        }
        if (!habit.unit) habit.unit = 'раз';
      }
      flexibleHabits.set(habit.id, habit);
      notify();
      return { ...habit };
    },
    softDeleteFlexibleHabit(habitId) {
      const habit = flexibleHabits.get(habitId);
      if (!habit || habit.deletedAt != null) throw new Error('Привычка не найдена');
      habit.active = false;
      habit.deletedAt = nowIso();
      notify();
    },
    restoreFlexibleHabit(habitId) {
      const habit = flexibleHabits.get(habitId);
      if (!habit) throw new Error('Привычка не найдена');
      habit.deletedAt = null;
      habit.active = true;
      notify();
    },
    logFlexibleHabit(habitId, dateLocal, value, source = 'manual') {
      assertLocalDate(dateLocal);
      if (value != null) assertPositiveFinite(value, 'habit value');
      const habit = flexibleHabits.get(habitId);
      if (!habit || !habit.active || habit.deletedAt != null) throw new Error('Habit not found');
      const amount =
        habit.kind === 'quantity'
          ? value == null || !Number.isFinite(value) || value <= 0
            ? 1
            : value
          : 1;
      const existing = [...flexibleHabitEvents.values()].find(
        (e) => e.habitId === habitId && e.dateLocal === dateLocal,
      );
      if (existing) {
        if (habit.kind === 'quantity' && source === 'manual') {
          existing.value = existing.value + amount;
          existing.source = source;
          notify();
        }
        return { ...existing };
      }
      const event: FlexibleHabitEvent = {
        id: newId(),
        habitId,
        dateLocal,
        value: amount,
        source,
        createdAt: nowIso(),
      };
      flexibleHabitEvents.set(event.id, event);
      notify();
      return { ...event };
    },
    setFlexibleHabitDayValue(habitId, dateLocal, value) {
      assertLocalDate(dateLocal); assertNonNegativeFinite(value, 'value');
      const habit = flexibleHabits.get(habitId);
      if (!habit || !habit.active || habit.deletedAt || habit.pausedAt) throw new Error('Привычка недоступна');
      const previous = [...flexibleHabitEvents.values()].find(e => e.habitId === habitId && e.dateLocal === dateLocal);
      if (value === 0) { api.unlogFlexibleHabit(habitId, dateLocal); return; }
      if (previous) { previous.value = habit.kind === 'quantity' ? value : 1; previous.source = 'manual'; notify(); }
      else api.logFlexibleHabit(habitId, dateLocal, value);
    },
    unlogFlexibleHabit(habitId, dateLocal) {
      for (const [id, e] of flexibleHabitEvents) {
        if (e.habitId === habitId && e.dateLocal === dateLocal) {
          flexibleHabitEvents.delete(id);
        }
      }
      notify();
    },
    isFlexibleHabitLogged(habitId, dateLocal) {
      return api.flexibleHabitDayValue(habitId, dateLocal) > 0;
    },
    flexibleHabitDayValue(habitId, dateLocal) {
      const hit = [...flexibleHabitEvents.values()].find(
        (e) => e.habitId === habitId && e.dateLocal === dateLocal && e.value > 0,
      );
      return hit ? hit.value : 0;
    },
    flexibleHabitWeekStats(habitId, dateLocal) {
      const habit = flexibleHabits.get(habitId);
      if (!habit) throw new Error('Habit not found');
      const weekStart = weekStartMonday(dateLocal);
      const days = new Set(datesInWeek(weekStart));
      const weekEvents = [...flexibleHabitEvents.values()].filter(
        (e) => e.habitId === habitId && days.has(e.dateLocal) && e.value > 0,
      );
      if (habit.kind === 'quantity') {
        const completed = weekEvents.reduce((s, e) => s + e.value, 0);
        return {
          completed,
          target: habit.targetValue ?? 0,
          weekStart,
          unit: habit.unit,
          kind: habit.kind,
        };
      }
      return {
        completed: weekEvents.length,
        target: habit.timesPerWeek,
        weekStart,
        unit: null,
        kind: habit.kind,
      };
    },
    applyWorkoutHabitAutoCredit({ dateLocal, workoutType, durationSec }) {
      const credited: FlexibleHabitEvent[] = [];
      const mins = Math.max(0, Math.round(durationSec / 60));
      for (const habit of api.listFlexibleHabits()) {
        if (habit.pausedAt) continue;
        const src = habit.autoSource;
        if (!src) continue;
        const match =
          src === 'any_workout' ||
          (src === 'walking' && workoutType === 'walking') ||
          (src === 'cycling' && workoutType === 'cycling') ||
          (src === 'strength' && workoutType === 'strength');
        if (!match) continue;
        if (api.isFlexibleHabitLogged(habit.id, dateLocal) && habit.kind === 'checkbox') continue;
        const unit = habit.unit?.trim().toLowerCase();
        const minuteUnit = ['мин', 'мин.', 'минут', 'минуты', 'min'].includes(unit ?? '');
        const countUnit = ['раз', 'шт', 'шт.', 'тренировки', 'тренировок'].includes(unit ?? '');
        if (habit.kind === 'quantity' && !minuteUnit && !countUnit) continue;
        const value = habit.kind === 'quantity' && minuteUnit ? mins : 1;
        if (!Number.isFinite(value) || value <= 0) continue;
        credited.push(api.logFlexibleHabit(habit.id, dateLocal, value, 'auto'));
      }
      return credited;
    },
    createChallenge(input) {
      assertLocalDate(input.periodStart);
      assertLocalDate(input.periodEnd);
      const name = input.name.trim();
      if (!name) throw new Error('Укажи название челленджа');
      if (!Number.isFinite(input.target) || input.target <= 0) {
        throw new Error('Цель челленджа должна быть > 0');
      }
      if (input.periodEnd < input.periodStart) {
        throw new Error('Конец периода раньше начала');
      }
      if (input.metric === 'habit_completions' && !input.habitId) {
        throw new Error('Выбери привычку для челленджа');
      }
      const challenge: Challenge = {
        id: newId(),
        name,
        metric: input.metric,
        target: input.target,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        habitId: input.habitId ?? null,
        status: 'active',
        createdAt: nowIso(),
        deletedAt: null,
      };
      challenges.set(challenge.id, challenge);
      notify();
      return { ...challenge };
    },
    listChallenges() {
      return [...challenges.values()]
        .filter((c) => c.deletedAt == null && c.status !== 'abandoned')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    abandonChallenge(challengeId) {
      const c = challenges.get(challengeId);
      if (!c || c.deletedAt) throw new Error('Челлендж не найден');
      c.status = 'abandoned';
      notify();
      return { ...c };
    },
    softDeleteChallenge(challengeId) {
      const c = challenges.get(challengeId);
      if (!c || c.deletedAt) throw new Error('Челлендж не найден');
      c.deletedAt = nowIso();
      notify();
    },
    challengeProgress(challengeId) {
      const c = challenges.get(challengeId);
      if (!c || c.deletedAt) throw new Error('Челлендж не найден');
      let current = 0;
      const training = completedTrainingFacts([...workouts.values()], [...workoutSessions.values()]);
      const inPeriod = training.filter(fact => {
        const date = fact.source === 'workout' ? workouts.get(fact.id)?.dateLocal : workoutSessions.get(fact.id)?.dateLocal;
        return date != null && date >= c.periodStart && date <= c.periodEnd;
      });
      if (c.metric === 'workouts_count') {
        current = inPeriod.length;
      } else if (c.metric === 'activity_minutes') {
        current = inPeriod.reduce((sum, fact) => sum + Math.round((fact.durationSec ?? 0) / 60), 0);
      } else if (c.metric === 'food_log_days') {
        const days = new Set(
          [...entries.values()]
            .filter(
              (e) =>
                !e.deletedAt && e.dateLocal >= c.periodStart && e.dateLocal <= c.periodEnd,
            )
            .map((e) => e.dateLocal),
        );
        current = days.size;
      } else if (c.metric === 'habit_completions' && c.habitId) {
        current = [...flexibleHabitEvents.values()].filter(
          (e) =>
            e.habitId === c.habitId &&
            e.dateLocal >= c.periodStart &&
            e.dateLocal <= c.periodEnd &&
            e.value > 0,
        ).length;
      }
      const ratio = c.target > 0 ? Math.min(1, current / c.target) : 0;
      // Soft complete without notify — avoids render loops; next mutation persists.
      if (c.status === 'active' && current >= c.target) {
        c.status = 'completed';
      }
      return { current, target: c.target, ratio, status: c.status };
    },
    listPantryItems() {
      return [...pantryItems.values()]
        .filter((p) => !p.deletedAt)
        .map((p) => ({ ...p }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));
    },
    upsertPantryItem(input) {
      if (!['fridge', 'freezer', 'pantry'].includes(input.location)) throw new Error('Некорректное место хранения');
      if (!['g', 'ml', 'pcs'].includes(input.unit)) throw new Error('Некорректная единица');
      if (input.expiresOn != null) assertLocalDate(input.expiresOn);
      const name = input.displayName.trim();
      if (!name) throw new Error('Pantry name required');
      if (input.quantityG != null) assertNonNegativeFinite(input.quantityG, 'quantityG');
      if (input.quantityCount != null) assertNonNegativeFinite(input.quantityCount, 'quantityCount');
      const ts = nowIso();
      const existing = input.id ? pantryItems.get(input.id) : undefined;
      if (input.id && (!existing || existing.deletedAt)) throw new Error('Pantry item not found');
      const source: PantrySource =
        input.source === 'purchase' || input.source === 'user'
          ? input.source
          : (existing?.source ?? 'user');
      const item: PantryItem = {
        id: existing?.id ?? newId(),
        displayName: name,
        productId: input.productId === undefined ? (existing?.productId ?? null) : input.productId,
        location: input.location,
        quantityG: input.quantityG === undefined ? (existing?.quantityG ?? null) : input.quantityG,
        quantityCount:
          input.quantityCount === undefined ? (existing?.quantityCount ?? null) : input.quantityCount,
        unit: input.unit,
        expiresOn: input.expiresOn === undefined ? (existing?.expiresOn ?? null) : input.expiresOn,
        source,
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
        deletedAt: null,
      };
      pantryItems.set(item.id, item);
      notify();
      return { ...item };
    },
    restorePantryItem(id) {
      const row = pantryItems.get(id);
      if (!row) throw new Error('Pantry item not found');
      row.deletedAt = null;
      row.updatedAt = nowIso();
      notify();
      return { ...row };
    },
    softDeletePantryItem(pantryItemId) {
      const item = pantryItems.get(pantryItemId);
      if (!item || item.deletedAt) throw new Error('Pantry item not found');
      item.deletedAt = nowIso();
      item.updatedAt = item.deletedAt;
      notify();
      return { ...item };
    },
    listPurchases() {
      return [...purchases.values()]
        .filter((p) => !p.deletedAt)
        .map((p) => ({ ...p }))
        .sort((a, b) => b.purchasedOn.localeCompare(a.purchasedOn) || b.createdAt.localeCompare(a.createdAt));
    },
    listPurchaseLines(purchaseId) {
      return [...purchaseLines.values()]
        .filter((l) => l.purchaseId === purchaseId && !l.deletedAt)
        .map((l) => ({ ...l }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    findPurchaseByFingerprint(fingerprint) {
      const hit = [...purchases.values()].find(
        (p) => !p.deletedAt && p.fingerprint === fingerprint && p.confirmedAt != null,
      );
      return hit ? { ...hit } : null;
    },
    confirmNewPurchase(input) {
      if (!isConfirmablePurchaseStatus(input.status)) {
        throw new Error('Подтверждение только для delivered / fiscal_receipt');
      }
      assertLocalDate(input.purchasedOn);
      if (input.totalRub != null) assertNonNegativeFinite(input.totalRub, 'totalRub');
      if (input.lines.length === 0) throw new Error('Нужна хотя бы одна позиция');

      const validatedLines = input.lines.map((l) => {
        const displayName = l.displayName.trim();
        if (!displayName) throw new Error('Пустое название позиции');
        if (l.quantity != null) assertNonNegativeFinite(l.quantity, 'quantity');
        if (l.lineTotalRub != null) assertNonNegativeFinite(l.lineTotalRub, 'lineTotalRub');
        if (l.unitPriceRub != null) assertNonNegativeFinite(l.unitPriceRub, 'unitPriceRub');
        if (l.discountRub != null) assertNonNegativeFinite(l.discountRub, 'discountRub');
        if (l.unit != null && !['g', 'ml', 'pcs'].includes(l.unit)) throw new Error('Некорректная единица');
        if (l.lineTotalRub != null && l.quantity != null && l.quantity > 0) assertNonNegativeFinite(l.lineTotalRub / l.quantity, 'unitPriceRub');
        return {
          rawName: l.rawName.trim() || displayName,
          displayName,
          quantity: l.quantity ?? null,
          unit: l.unit ?? null,
          packageSizeText: l.packageSizeText ?? null,
          unitPriceRub: l.unitPriceRub ?? null,
          lineTotalRub: l.lineTotalRub ?? null,
          discountRub: l.discountRub ?? null,
          isFood: !!l.isFood,
          excluded: !!l.excluded,
          productId: l.productId ?? null,
          barcode: l.barcode ?? null,
          retailerSku: l.retailerSku ?? null,
          matchConfidence: l.matchConfidence ?? null,
        };
      });

      const fingerprint = purchaseFingerprint({
        storeLabel: input.storeLabel ?? null,
        purchasedOn: input.purchasedOn,
        totalRub: input.totalRub ?? null,
        lines: validatedLines.map((l) => ({
          displayName: l.displayName,
          quantity: l.quantity,
          unit: l.unit,
          lineTotalRub: l.lineTotalRub,
          excluded: l.excluded,
        })),
      });

      const dup = api.findPurchaseByFingerprint(fingerprint);
      if (dup) throw new Error('Такая покупка уже подтверждена (дубликат чека)');

      // After dedupe: match or create catalog products (nutrition stays null unless matched seed/OFF).
      const catalogSnapshot = api.listProducts();
      const draftLines = validatedLines.map((l) => {
        let productId = l.productId;
        let matchConfidence = l.matchConfidence;
        if (l.isFood && !l.excluded) {
          const match = matchPurchaseProduct(
            { displayName: l.displayName, barcode: l.barcode, productId },
            catalogSnapshot,
          );
          if (match.productId) {
            productId = match.productId;
            matchConfidence = match.confidence;
          } else {
            const digits = l.barcode?.replace(/\D/g, '') ?? '';
            const created = api.createProduct({
              name: l.displayName,
              barcode: /^\d{8,14}$/.test(digits) ? digits : null,
              energyKcal: null,
              proteinG: null,
              fatG: null,
              carbG: null,
              source: 'user',
            });
            productId = created.id;
            matchConfidence = null;
            catalogSnapshot.push(created);
          }
        }
        return { ...l, productId, matchConfidence };
      });

      const ts = nowIso();
      const purchaseId = newId();
      const createdLines: PurchaseLine[] = [];
      const createdPantry: PantryItem[] = [];

      for (const l of draftLines) {
        const line: PurchaseLine = {
          id: newId(),
          purchaseId,
          rawName: l.rawName,
          displayName: l.displayName,
          quantity: l.quantity,
          unit: l.unit,
          packageSizeText: l.packageSizeText,
          unitPriceRub: l.unitPriceRub,
          lineTotalRub: l.lineTotalRub,
          discountRub: l.discountRub,
          isFood: l.isFood,
          excluded: l.excluded,
          productId: l.productId,
          barcode: l.barcode,
          retailerSku: l.retailerSku,
          matchConfidence: l.matchConfidence,
          pantryItemId: null,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        purchaseLines.set(line.id, line);
        createdLines.push(line);

        // Price observation only when unit + price known — never invent.
        if (l.isFood && !l.excluded && l.unit) {
          let unitPrice = l.unit === 'pcs' ? l.unitPriceRub : null;
          if (
            unitPrice == null &&
            l.lineTotalRub != null &&
            l.quantity != null &&
            l.quantity > 0
          ) {
            unitPrice = l.lineTotalRub / l.quantity;
          }
          if (unitPrice != null) {
            api.upsertProductPrice({
              productKey: shoppingKey(l.displayName, l.unit),
              priceRub: unitPrice,
              basisQuantity: 1,
              unit: l.unit,
              observedOn: input.purchasedOn,
              source: 'receipt',
              storeId: input.storePreferenceId ?? null,
            });
          }
        }
      }

      for (let i = 0; i < draftLines.length; i++) {
        const apply = draftLines[i];
        if (!linesForPantryApply([apply]).length) continue;
        const unit: PantryUnit = apply.unit ?? 'pcs';
        if (apply.quantity != null) assertNonNegativeFinite(apply.quantity, 'quantity');
        const quantityG = unit === 'g' || unit === 'ml' ? apply.quantity : null;
        const quantityCount = unit === 'pcs' ? apply.quantity : null;
        const pantry: PantryItem = {
          id: newId(),
          displayName: apply.displayName,
          productId: apply.productId,
          location: suggestPantryLocation(apply.displayName),
          quantityG,
          quantityCount,
          unit,
          expiresOn: null,
          source: 'purchase',
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        pantryItems.set(pantry.id, pantry);
        createdPantry.push(pantry);
        const line = createdLines[i];
        line.pantryItemId = pantry.id;
        line.updatedAt = ts;
        purchaseLines.set(line.id, line);
      }

      const expenseAmount = resolveExpenseAmountRub({
        totalRub: input.totalRub ?? null,
        lines: draftLines,
      });
      let expense: FoodExpense | null = null;
      if (expenseAmount != null) {
        expense = {
          id: newId(),
          amountRub: expenseAmount,
          category: input.expenseCategory ?? 'groceries',
          spentOn: input.purchasedOn,
          note: `Покупка · ${(input.storeLabel ?? 'чек').slice(0, 40)} · ${draftLines.length} поз.`,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        foodExpenses.set(expense.id, expense);
      }

      const purchase: Purchase = {
        id: purchaseId,
        status: input.status,
        storePreferenceId: input.storePreferenceId ?? null,
        storeLabel: input.storeLabel ?? null,
        purchasedOn: input.purchasedOn,
        currency: 'RUB',
        totalRub: input.totalRub ?? null,
        sourceKind: input.sourceKind,
        fingerprint,
        rawPayloadRef: input.rawPayloadRef ?? null,
        parseConfidence: input.parseConfidence ?? null,
        confirmedAt: ts,
        expenseId: expense?.id ?? null,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      purchases.set(purchase.id, purchase);
      api.reconcileOpenShoppingWithPurchase(purchase.id);
      notify();
      return {
        purchase: { ...purchase },
        lines: createdLines.map((l) => ({ ...purchaseLines.get(l.id)! })),
        pantryItems: createdPantry.map((p) => ({ ...p })),
        expense: expense ? { ...expense } : null,
      };
    },
    listCookedBatches(opts) {
      return [...cookedBatches.values()]
        .filter((b) => {
          if (b.deletedAt) return false;
          if (opts?.recipeId && b.recipeId !== opts.recipeId) return false;
          if (opts?.onlyRemaining && !(b.remainingG > 0)) return false;
          return true;
        })
        .map((b) => ({ ...b }))
        .sort((a, b) => a.cookedAt.localeCompare(b.cookedAt));
    },
    createCookedBatch(input) {
      const recipe = recipes.get(input.recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
      const yieldG = input.initialYieldG ?? recipe.cookedYieldG;
      assertPositiveFinite(yieldG, 'initialYieldG');
      const ts = nowIso();
      const batch: CookedBatch = {
        id: newId(),
        recipeId: recipe.id,
        cookedAt: input.cookedAt ?? ts,
        initialYieldG: yieldG,
        remainingG: yieldG,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      cookedBatches.set(batch.id, batch);
      notify();
      return { ...batch };
    },
    softDeleteCookedBatch(batchId) {
      const batch = cookedBatches.get(batchId);
      if (!batch || batch.deletedAt) throw new Error('Cooked batch not found');
      batch.deletedAt = nowIso();
      batch.updatedAt = batch.deletedAt;
      notify();
      return { ...batch };
    },
    listMealPlans() {
      return [...mealPlans.values()]
        .filter((p) => !p.deletedAt)
        .map((p) => ({ ...p }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    getMealPlan(planId) {
      const p = mealPlans.get(planId);
      if (!p || p.deletedAt) return null;
      return { ...p };
    },
    listPlannedMeals(planId) {
      return [...plannedMeals.values()]
        .filter((m) => m.planId === planId && !m.deletedAt)
        .map((m) => ({ ...m }))
        .sort((a, b) => {
          const d = a.dateLocal.localeCompare(b.dateLocal);
          if (d !== 0) return d;
          const order: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
          return order.indexOf(a.meal) - order.indexOf(b.meal);
        });
    },
    listPlannedMealsForDate(dateLocal) {
      const activePlanIds = new Set(
        [...mealPlans.values()]
          .filter((p) => !p.deletedAt && (p.status === 'draft' || p.status === 'active'))
          .map((p) => p.id),
      );
      return [...plannedMeals.values()]
        .filter(
          (m) =>
            !m.deletedAt &&
            m.dateLocal === dateLocal &&
            activePlanIds.has(m.planId) &&
            m.status !== 'skipped',
        )
        .map((m) => ({ ...m }))
        .sort((a, b) => {
          const order: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
          return order.indexOf(a.meal) - order.indexOf(b.meal);
        });
    },
    createMealPlanDraft(input) {
      if (input.budgetRub != null) assertNonNegativeFinite(input.budgetRub, 'budgetRub');
      const recipePicks = [...recipes.values()]
        .filter((r) => !r.deletedAt)
        .map((r) => ({
          id: r.id,
          name: r.name,
          defaultGrams: Math.min(200, Math.max(80, Math.round(r.cookedYieldG / 4))),
        }));
      const draft = buildMealPlanDraft({
        startDateLocal: input.startDateLocal,
        days: input.days,
        recipes: recipePicks,
        cookSessions: input.cookSessions ?? 2,
        diversity: input.diversity ?? 'balanced',
      });
      const ts = nowIso();
      // Keep one working draft: archive older drafts (not destructive).
      for (const prev of mealPlans.values()) {
        if (!prev.deletedAt && prev.status === 'draft') {
          prev.status = 'archived';
          prev.updatedAt = ts;
        }
      }
      const plan: MealPlan = {
        id: newId(),
        startDate: draft.startDateLocal,
        endDate: draft.endDateLocal,
        status: 'draft',
        budgetRub: input.budgetRub ?? null,
        cookSessions: input.cookSessions ?? 2,
        diversity: input.diversity ?? 'balanced',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      mealPlans.set(plan.id, plan);
      for (const line of draft.lines) {
        const meal: PlannedMeal = {
          id: newId(),
          planId: plan.id,
          dateLocal: line.dateLocal,
          meal: line.meal,
          recipeId: line.recipeId,
          productId: line.productId,
          displayName: line.displayName,
          grams: line.grams,
          status: 'planned',
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        plannedMeals.set(meal.id, meal);
      }
      notify();
      return { ...plan };
    },
    ensureWeekDraftPlan(weekStartMondayDate) {
      assertLocalDate(weekStartMondayDate);
      const weekEnd = (() => {
        const [y, m, d] = weekStartMondayDate.split('-').map(Number);
        const dt = new Date(Date.UTC(y!, m! - 1, d! + 6));
        return dt.toISOString().slice(0, 10);
      })();
      const ts = nowIso();
      const candidates = [...mealPlans.values()]
        .filter(
          (p) =>
            !p.deletedAt &&
            (p.status === 'draft' || p.status === 'active') &&
            p.startDate <= weekEnd &&
            p.endDate >= weekStartMondayDate,
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
          return b.createdAt.localeCompare(a.createdAt);
        });
      const existing = candidates[0] ?? null;
      if (existing) {
        let changed = false;
        if (existing.startDate > weekStartMondayDate) {
          existing.startDate = weekStartMondayDate;
          changed = true;
        }
        if (existing.endDate < weekEnd) {
          existing.endDate = weekEnd;
          changed = true;
        }
        if (changed) {
          existing.updatedAt = ts;
          notify();
        }
        return { ...existing };
      }
      const plan: MealPlan = {
        id: newId(),
        startDate: weekStartMondayDate,
        endDate: weekEnd,
        status: 'draft',
        budgetRub: null,
        cookSessions: null,
        diversity: null,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      mealPlans.set(plan.id, plan);
      notify();
      return { ...plan };
    },
    activateMealPlan(planId) {
      const plan = mealPlans.get(planId);
      if (!plan || plan.deletedAt) throw new Error('Meal plan not found');
      plan.status = 'active';
      plan.updatedAt = nowIso();
      notify();
      return { ...plan };
    },
    archiveMealPlan(planId) {
      const plan = mealPlans.get(planId);
      if (!plan || plan.deletedAt) throw new Error('Meal plan not found');
      plan.status = 'archived';
      plan.updatedAt = nowIso();
      notify();
      return { ...plan };
    },
    softDeleteMealPlan(planId) {
      const plan = mealPlans.get(planId);
      if (!plan || plan.deletedAt) throw new Error('Meal plan not found');
      const ts = nowIso();
      plan.deletedAt = ts;
      plan.updatedAt = ts;
      for (const m of plannedMeals.values()) {
        if (m.planId === planId && !m.deletedAt) {
          m.deletedAt = ts;
          m.updatedAt = ts;
        }
      }
      notify();
      return { ...plan };
    },
    updatePlannedMealGrams(plannedMealId, grams) {
      assertNonNegativeFinite(grams, 'grams');
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      m.grams = grams;
      m.updatedAt = nowIso();
      notify();
      return { ...m };
    },
    movePlannedMeal(plannedMealId, args) {
      assertLocalDate(args.dateLocal);
      if (!MEALS.includes(args.meal)) throw new Error('Выбери приём пищи');
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      m.dateLocal = args.dateLocal;
      m.meal = args.meal;
      m.updatedAt = nowIso();
      notify();
      return { ...m };
    },
    replacePlannedMeal(plannedMealId, args) {
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      const name = args.displayName.trim();
      if (!name) throw new Error('Display name required');
      assertNonNegativeFinite(args.grams, 'grams');
      m.displayName = name;
      m.grams = args.grams;
      m.recipeId = args.recipeId === undefined ? m.recipeId : args.recipeId;
      m.productId = args.productId === undefined ? m.productId : args.productId;
      m.status = 'planned';
      m.updatedAt = nowIso();
      notify();
      return { ...m };
    },
    restorePlannedMeal(id) {
      const row = plannedMeals.get(id);
      if (!row) throw new Error('Planned meal not found');
      row.deletedAt = null;
      row.updatedAt = nowIso();
      notify();
      return { ...row };
    },
    undoPlannedMealLog(id, entryId) {
      const row = plannedMeals.get(id);
      if (!row || row.deletedAt) throw new Error('Planned meal not found');
      api.undoDiaryAdds([entryId]);
      row.status = 'planned';
      row.updatedAt = nowIso();
      notify();
    },
    softDeletePlannedMeal(plannedMealId) {
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      m.deletedAt = nowIso();
      m.updatedAt = m.deletedAt;
      notify();
      return { ...m };
    },
    addPlannedMeal(input) {
      if (!MEALS.includes(input.meal)) throw new Error('Выбери приём пищи');
      const name = input.displayName.trim();
      if (!name) throw new Error('Display name required');
      assertPositiveFinite(input.grams, 'grams');
      assertLocalDate(input.dateLocal);
      const covering = [...mealPlans.values()]
        .filter(
          (p) =>
            !p.deletedAt &&
            (p.status === 'draft' || p.status === 'active') &&
            p.startDate <= input.dateLocal &&
            p.endDate >= input.dateLocal,
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
          return b.createdAt.localeCompare(a.createdAt);
        });
      let plan = covering[0] ?? null;
      const ts = nowIso();
      if (!plan) {
        for (const prev of mealPlans.values()) {
          if (!prev.deletedAt && prev.status === 'draft') {
            prev.status = 'archived';
            prev.updatedAt = ts;
          }
        }
        plan = {
          id: newId(),
          startDate: input.dateLocal,
          endDate: input.dateLocal,
          status: 'draft',
          budgetRub: null,
          cookSessions: null,
          diversity: null,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        mealPlans.set(plan.id, plan);
      }
      let recipeId = input.recipeId ?? null;
      let productId = input.productId ?? null;
      if (recipeId && productId) productId = null;
      const meal: PlannedMeal = {
        id: newId(),
        planId: plan.id,
        dateLocal: input.dateLocal,
        meal: input.meal,
        recipeId,
        productId,
        displayName: name,
        grams: input.grams,
        status: 'planned',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      plannedMeals.set(meal.id, meal);
      plan.updatedAt = ts;
      notify();
      return { ...meal };
    },
    logPlannedMealToDiary(plannedMealId) {
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      let entry: FoodEntry;
      if (m.recipeId) {
        entry = api.addEntryFromRecipe({
          recipeId: m.recipeId,
          dateLocal: m.dateLocal,
          meal: m.meal,
          grams: m.grams,
        });
      } else if (m.productId) {
        entry = api.addEntryFromProduct({
          productId: m.productId,
          dateLocal: m.dateLocal,
          meal: m.meal,
          grams: m.grams,
        });
      } else {
        entry = api.addQuickEntry({
          dateLocal: m.dateLocal,
          meal: m.meal,
          displayName: m.displayName,
          energyKcal: null,
        });
      }
      m.status = 'logged';
      m.updatedAt = nowIso();
      notify();
      return { ...entry };
    },
    listShoppingLists() {
      return [...shoppingLists.values()]
        .filter((l) => !l.deletedAt)
        .map((l) => ({ ...l }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    getShoppingList(listId) {
      const l = shoppingLists.get(listId);
      if (!l || l.deletedAt) return null;
      return { ...l };
    },
    listShoppingItems(listId) {
      return [...shoppingItems.values()]
        .filter((i) => i.listId === listId && !i.deletedAt)
        .map((i) => ({ ...i }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));
    },
    createEmptyShoppingList(title) {
      const ts = nowIso();
      const list: ShoppingList = {
        id: newId(),
        planId: null,
        title: (title?.trim() || 'Список покупок').slice(0, 120),
        status: 'open',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      shoppingLists.set(list.id, list);
      notify();
      return { ...list };
    },
    createShoppingListFromRecipe(recipeId, title) {
      const recipe = recipes.get(recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
      const ings = ingredients.get(recipeId) ?? [];
      const ingInputs = ings.map((ing) => ({
        displayName: ing.displayName,
        quantity: ing.rawGrams,
        unit: 'g' as const,
        productId: ing.productId,
      }));
      const pantryCov = [...pantryItems.values()]
        .filter((p) => !p.deletedAt)
        .map((p) => ({
          displayName: p.displayName,
          productId: p.productId,
          quantityG: p.quantityG,
          quantityCount: p.quantityCount,
          unit: p.unit,
        }));
      const priceMap = new Map<
        string,
        { priceRub: number; basisQuantity: number | null; priceAsOf: string; priceSource: ShoppingPriceSource }
      >();
      for (const pp of productPrices.values()) {
        if (pp.deletedAt) continue;
        const existing = priceMap.get(pp.productKey);
        if (!existing || pp.observedOn >= existing.priceAsOf) {
          priceMap.set(pp.productKey, {
            priceRub: pp.priceRub,
            basisQuantity: pp.basisQuantity ?? null,
            priceAsOf: pp.observedOn,
            priceSource: pp.source,
          });
        }
      }
      const lines = aggregateShopping(ingInputs, pantryCov, priceMap);
      const ts = nowIso();
      const list: ShoppingList = {
        id: newId(),
        planId: null,
        title: (title?.trim() || `Покупки · ${recipe.name}`).slice(0, 120),
        status: 'open',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      shoppingLists.set(list.id, list);
      for (const line of lines) {
        if (line.needToBuy <= 0) continue;
        const item: ShoppingItem = {
          id: newId(),
          listId: list.id,
          displayName: line.displayName,
          quantity: line.quantity,
          unit: line.unit,
          coveredByPantry: line.coveredByPantry,
          needToBuy: line.needToBuy,
          checked: false,
          priceRub: line.priceRub,
          priceAsOf: line.priceAsOf,
          priceSource: line.priceSource,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        shoppingItems.set(item.id, item);
      }
      notify();
      return { ...list };
    },
    addShoppingItem(input) {
      const list = shoppingLists.get(input.listId);
      if (!list || list.deletedAt) throw new Error('Shopping list not found');
      assertPositiveFinite(input.quantity, 'quantity');
      const name = input.displayName.trim();
      if (!name) throw new Error('Название позиции обязательно');
      const ts = nowIso();
      const item: ShoppingItem = {
        id: newId(),
        listId: input.listId,
        displayName: name.slice(0, 120),
        quantity: input.quantity,
        unit: input.unit,
        coveredByPantry: 0,
        needToBuy: input.quantity,
        checked: false,
        priceRub: null,
        priceAsOf: null,
        priceSource: null,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      shoppingItems.set(item.id, item);
      list.updatedAt = ts;
      notify();
      return { ...item };
    },
    reconcileOpenShoppingWithPurchase(purchaseId) {
      const purchase = purchases.get(purchaseId);
      if (!purchase || purchase.deletedAt) return { patched: 0 };
      const lines = [...purchaseLines.values()].filter(
        (l) => l.purchaseId === purchaseId && !l.deletedAt,
      );
      const purchasePayload = lines.map((l) => ({
        displayName: l.displayName,
        quantity: l.quantity,
        unit: l.unit,
        excluded: l.excluded,
        isFood: l.isFood,
      }));
      let patched = 0;
      for (const list of shoppingLists.values()) {
        if (list.deletedAt || list.status !== 'open') continue;
        const items = [...shoppingItems.values()]
          .filter((i) => i.listId === list.id && !i.deletedAt)
          .map((i) => ({
            id: i.id,
            displayName: i.displayName,
            unit: i.unit,
            needToBuy: i.needToBuy,
            checked: i.checked,
          }));
        const patches = reconcileShoppingWithPurchaseLines(items, purchasePayload);
        const ts = nowIso();
        for (const p of patches) {
          const item = shoppingItems.get(p.itemId);
          if (!item || item.deletedAt) continue;
          item.needToBuy = p.needToBuy;
          item.checked = p.checked;
          item.updatedAt = ts;
          patched += 1;
        }
        if (patches.length) list.updatedAt = ts;
      }
      return { patched };
    },
    createShoppingListFromPlan(planId, title) {
      const plan = mealPlans.get(planId);
      if (!plan || plan.deletedAt) throw new Error('Meal plan not found');
      const planned = [...plannedMeals.values()].filter(
        (m) => m.planId === planId && !m.deletedAt && m.status !== 'skipped',
      );
      const ingInputs: Array<{
        displayName: string;
        quantity: number;
        unit: 'g' | 'ml' | 'pcs';
        productId?: string | null;
      }> = [];
      for (const pm of planned) {
        if (pm.recipeId) {
          const recipe = recipes.get(pm.recipeId);
          if (!recipe || recipe.deletedAt) continue;
          const ings = ingredients.get(pm.recipeId) ?? [];
          for (const ing of ings) {
            const qty = scaleIngredientGrams(ing.rawGrams, recipe.cookedYieldG, pm.grams);
            ingInputs.push({
              displayName: ing.displayName,
              quantity: qty,
              unit: 'g',
              productId: ing.productId,
            });
          }
        } else if (pm.productId) {
          const product = products.get(pm.productId);
          ingInputs.push({
            displayName: product?.name ?? pm.displayName,
            quantity: pm.grams,
            unit: 'g',
            productId: pm.productId,
          });
        } else {
          ingInputs.push({
            displayName: pm.displayName,
            quantity: pm.grams,
            unit: 'g',
          });
        }
      }
      const pantryCov = [...pantryItems.values()]
        .filter((p) => !p.deletedAt)
        .map((p) => ({
          displayName: p.displayName,
          productId: p.productId,
          quantityG: p.quantityG,
          quantityCount: p.quantityCount,
          unit: p.unit,
        }));
      const priceMap = new Map<
        string,
        { priceRub: number; basisQuantity: number | null; priceAsOf: string; priceSource: ShoppingPriceSource }
      >();
      for (const pp of productPrices.values()) {
        if (pp.deletedAt) continue;
        const existing = priceMap.get(pp.productKey);
        if (!existing || pp.observedOn >= existing.priceAsOf) {
          priceMap.set(pp.productKey, {
            priceRub: pp.priceRub,
            basisQuantity: pp.basisQuantity ?? null,
            priceAsOf: pp.observedOn,
            priceSource: pp.source,
          });
        }
      }
      const lines = aggregateShopping(ingInputs, pantryCov, priceMap);
      const ts = nowIso();
      const list: ShoppingList = {
        id: newId(),
        planId,
        title: (title?.trim() || `Покупки ${plan.startDate}–${plan.endDate}`).slice(0, 120),
        status: 'open',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      shoppingLists.set(list.id, list);
      // Persist only missing quantities — fully covered lines stay out of the actionable list.
      for (const line of lines) {
        if (line.needToBuy <= 0) continue;
        const item: ShoppingItem = {
          id: newId(),
          listId: list.id,
          displayName: line.displayName,
          quantity: line.quantity,
          unit: line.unit,
          coveredByPantry: line.coveredByPantry,
          needToBuy: line.needToBuy,
          checked: false,
          priceRub: line.priceRub,
          priceAsOf: line.priceAsOf,
          priceSource: line.priceSource,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        };
        shoppingItems.set(item.id, item);
      }
      notify();
      return { ...list };
    },
    setShoppingItemChecked(itemId, checked) {
      const item = shoppingItems.get(itemId);
      if (!item || item.deletedAt) throw new Error('Shopping item not found');
      item.checked = checked;
      item.updatedAt = nowIso();
      notify();
      return { ...item };
    },
    setShoppingItemPrice(itemId, args) {
      const stored = shoppingItems.get(itemId);
      if (!stored || stored.deletedAt) throw new Error('Shopping item not found');
      if (args.priceAsOf != null) assertLocalDate(args.priceAsOf);
      const item = { ...stored };
      if (args.priceRub !== null) assertNonNegativeFinite(args.priceRub, 'priceRub');
      item.priceRub = args.priceRub;
      item.priceAsOf = args.priceAsOf === undefined ? item.priceAsOf : args.priceAsOf;
      item.priceSource =
        args.priceSource === undefined
          ? args.priceRub === null
            ? null
            : (item.priceSource ?? 'user')
          : args.priceSource;
      if (args.priceRub !== null && !item.priceAsOf) {
        item.priceAsOf = nowIso().slice(0, 10);
      }
      if (args.priceRub !== null && item.needToBuy > 0) {
        item.priceSource = item.priceSource ?? 'user';
        const key = shoppingKey(item.displayName, item.unit);
        // Persist ₽/kg (or ₽/L) for eaten-cost amortization; line price stays on item.
        let catalogPrice = args.priceRub;
        const basisQuantity = item.unit === 'pcs' ? 1 : 1000;
        catalogPrice = (args.priceRub / item.needToBuy) * basisQuantity;
        api.upsertProductPrice({
          productKey: key,
          priceRub: catalogPrice,
          basisQuantity,
          unit: item.unit,
          observedOn: item.priceAsOf ?? nowIso().slice(0, 10),
          source: item.priceSource ?? 'user',
        });
      }
      item.updatedAt = nowIso();
      shoppingItems.set(item.id, item);
      notify();
      return { ...item };
    },
    softDeleteShoppingList(listId) {
      const list = shoppingLists.get(listId);
      if (!list || list.deletedAt) throw new Error('Shopping list not found');
      const ts = nowIso();
      list.deletedAt = ts;
      list.updatedAt = ts;
      for (const i of shoppingItems.values()) {
        if (i.listId === listId && !i.deletedAt) {
          i.deletedAt = ts;
          i.updatedAt = ts;
        }
      }
      notify();
      return { ...list };
    },
    openShoppingProjection() {
      const baskets = [...shoppingLists.values()]
        .filter((l) => !l.deletedAt)
        .map((l) => {
          const total = api.shoppingBasketTotal(l.id);
          return {
            status: l.status,
            deletedAt: l.deletedAt,
            totalRub: total.totalRub,
            needLineCount: total.needLineCount,
            pricedNeedCount: total.pricedNeedCount,
            label: total.label,
          };
        });
      return projectOpenShoppingSpend(baskets);
    },
    shoppingBasketTotal(listId) {
      const items = api.listShoppingItems(listId).map((i) => ({
        key: shoppingKey(i.displayName, i.unit),
        displayName: i.displayName,
        quantity: i.quantity,
        unit: i.unit,
        coveredByPantry: i.coveredByPantry,
        needToBuy: i.checked ? 0 : i.needToBuy,
        priceRub: i.priceRub,
        priceAsOf: i.priceAsOf,
        priceSource: i.priceSource,
      }));
      return estimateBasketTotal(items);
    },
    upsertProductPrice(input) {
      const basisQuantity = input.basisQuantity ?? (input.unit === 'pcs' ? 1 : 1000);
      assertPositiveFinite(basisQuantity, 'basisQuantity');
      assertLocalDate(input.observedOn);
      assertNonNegativeFinite(input.priceRub, 'priceRub');
      const key = input.productKey.trim();
      if (!key) throw new Error('productKey required');
      const ts = nowIso();
      const existing = [...productPrices.values()].find(
        (p) => !p.deletedAt && p.productKey === key && (p.storeId ?? null) === (input.storeId ?? null),
      );
      if (existing) {
        existing.priceRub = input.priceRub;
        existing.basisQuantity = basisQuantity;
        existing.unit = input.unit;
        existing.observedOn = input.observedOn;
        existing.source = input.source ?? 'user';
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const row: ProductPrice = {
        basisQuantity,
        id: newId(),
        productKey: key,
        storeId: input.storeId ?? null,
        priceRub: input.priceRub,
        unit: input.unit,
        observedOn: input.observedOn,
        source: input.source ?? 'user',
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      productPrices.set(row.id, row);
      notify();
      return { ...row };
    },
    getFoodBudget(month) {
      const b = [...foodBudgets.values()].find((x) => !x.deletedAt && x.month === month);
      return b ? { ...b } : null;
    },
    setFoodBudget(month, limitRub) {
      assertPositiveFinite(limitRub, 'limitRub');
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('month must be YYYY-MM');
      const ts = nowIso();
      const existing = [...foodBudgets.values()].find((x) => !x.deletedAt && x.month === month);
      if (existing) {
        existing.limitRub = limitRub;
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const row: FoodBudget = {
        id: newId(),
        month,
        limitRub,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      foodBudgets.set(row.id, row);
      notify();
      return { ...row };
    },
    listFoodExpenses(month) {
      return [...foodExpenses.values()]
        .filter((e) => !e.deletedAt && e.spentOn.startsWith(month))
        .map((e) => ({ ...e }))
        .sort((a, b) => b.spentOn.localeCompare(a.spentOn));
    },
    addFoodExpense(input) {
      assertLocalDate(input.spentOn);
      if (!['groceries', 'cafe', 'office', 'delivery'].includes(input.category)) throw new Error('Некорректная категория');
      assertNonNegativeFinite(input.amountRub, 'amountRub');
      const ts = nowIso();
      const row: FoodExpense = {
        id: newId(),
        amountRub: input.amountRub,
        category: input.category,
        spentOn: input.spentOn,
        note: input.note?.trim() ? input.note.trim() : null,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      foodExpenses.set(row.id, row);
      notify();
      return { ...row };
    },
    restoreFoodExpense(id) {
      const row = foodExpenses.get(id);
      if (!row) throw new Error('Expense not found');
      row.deletedAt = null;
      row.updatedAt = nowIso();
      notify();
      return { ...row };
    },
    softDeleteFoodExpense(expenseId) {
      const e = foodExpenses.get(expenseId);
      if (!e || e.deletedAt) throw new Error('Expense not found');
      e.deletedAt = nowIso();
      e.updatedAt = e.deletedAt;
      notify();
      return { ...e };
    },
    monthBudgetSnapshot(month, asOfDateLocal) {
      const budget = api.getFoodBudget(month);
      const amounts = api.listFoodExpenses(month).map((e) => e.amountRub);
      return buildMonthBudgetSnapshot({
        month,
        limitRub: budget?.limitRub ?? null,
        expenseAmounts: amounts,
        asOfDateLocal,
      });
    },
    monthEatenCostEstimate(month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('month must be YYYY-MM');
      const priceByKey = new Map<string, ProductPrice>();
      for (const pp of productPrices.values()) {
        if (pp.deletedAt) continue;
        const prev = priceByKey.get(pp.productKey);
        if (!prev || pp.observedOn >= prev.observedOn) priceByKey.set(pp.productKey, pp);
      }
      const monthEntries = [...entries.values()].filter(
        (e) => !e.deletedAt && e.dateLocal.startsWith(month),
      );
      const estimates: Array<number | null> = monthEntries.map((e) => {
        const keyG = shoppingKey(e.displayName, 'g');
        const keyMl = shoppingKey(e.displayName, 'ml');
        const keyPcs = shoppingKey(e.displayName, 'pcs');
        const pp = priceByKey.get(keyG) ?? null;
        if (!pp) return null;
        if (pp.unit !== 'g' || pp.basisQuantity == null) {
          // Diary is grams — cannot amortize piece price honestly.
          return null;
        }
        return estimateEatenCostRub({
          grams: e.grams,
          priceRub: pp.priceRub,
          pricePerUnitG: pp.basisQuantity,
        });
      });
      const summed = sumEatenCost(estimates);
      return {
        totalRub: summed.total,
        knownSumRub: summed.knownSum,
        knownCount: summed.knownCount,
        totalCount: summed.totalCount,
        incomplete: summed.incomplete,
      };
    },
    listStorePreferences() {
      if (storePreferences.size === 0) {
        for (const s of defaultStorePreferences(nowIso())) storePreferences.set(s.id, s);
      }
      return [...storePreferences.values()]
        .map((s) => ({ ...s }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    },
    setStorePreferenceSelected(storeId, selected) {
      const row = [...storePreferences.values()].find((s) => s.storeId === storeId);
      if (!row) throw new Error('Store preference not found');
      row.selected = selected;
      row.updatedAt = nowIso();
      notify();
      return { ...row };
    },
    exportAll() {
      return JSON.stringify(
        {
          exportedAt: nowIso(),
          ...api.toSnapshot(),
        },
        null,
        2,
      );
    },
    importAll(json) {
      const parsed = parseExportJson(json);
      if (!parsed.ok) throw new Error(parsed.error);
      const next = normalizeSnapshot(parsed.snapshot);
      if (!next) throw new Error('Не удалось нормализовать снимок');

      products.clear();
      recipes.clear();
      ingredients.clear();
      entries.clear();
      waterEntries.clear();
      weightEntries.clear();
      habitChecks.clear();
      workouts.clear();
      flexibleHabits.clear();
      flexibleHabitEvents.clear();
      savedMeals.clear();
      challenges.clear();
      pantryItems.clear();
      cookedBatches.clear();
      mealPlans.clear();
      plannedMeals.clear();
      shoppingLists.clear();
      shoppingItems.clear();
      productPrices.clear();
      foodBudgets.clear();
      foodExpenses.clear();
      storePreferences.clear();
      purchases.clear();
      purchaseLines.clear();
      dailyActivityStats.clear();
      sleepNights.clear();
      strengthExercises.clear();
      workoutTemplates.clear();
      workoutTemplateExercises.clear();
      plannedActivities.clear();
      workoutSessions.clear();
      workoutSets.clear();

      Object.assign(profile, next.profile);
      garminSync = normalizeGarminSync(next.garminSync);
      trainingCycle = next.trainingCycle ? cloneTrainingCycle(next.trainingCycle) : null;
      for (const p of next.products) products.set(p.id, { ...p });
      mergeCommonFoodCatalog(products);
      for (const r of next.recipes) recipes.set(r.id, { ...r });
      for (const ing of next.ingredients) {
        const list = ingredients.get(ing.recipeId) ?? [];
        list.push({ ...ing });
        ingredients.set(ing.recipeId, list);
      }
      for (const e of next.entries) entries.set(e.id, { ...e });
      for (const w of next.waterEntries) waterEntries.set(w.id, { ...w });
      for (const w of next.weightEntries) weightEntries.set(w.id, { ...w });
      for (const h of next.habitChecks) habitChecks.set(h.id, { ...h });
      for (const w of next.workouts) workouts.set(w.id, { ...w });
      for (const h of next.flexibleHabits) flexibleHabits.set(h.id, { ...h });
      for (const e of next.flexibleHabitEvents) flexibleHabitEvents.set(e.id, { ...e });
      for (const m of next.savedMeals) {
        savedMeals.set(m.id, { ...m, items: m.items.map((i) => ({ ...i })) });
      }
      for (const c of next.challenges) challenges.set(c.id, { ...c });
      for (const p of next.pantryItems) pantryItems.set(p.id, { ...p });
      for (const b of next.cookedBatches) cookedBatches.set(b.id, { ...b });
      for (const p of next.mealPlans) mealPlans.set(p.id, { ...p });
      for (const m of next.plannedMeals) plannedMeals.set(m.id, { ...m });
      for (const l of next.shoppingLists) shoppingLists.set(l.id, { ...l });
      for (const i of next.shoppingItems) shoppingItems.set(i.id, { ...i });
      for (const p of next.productPrices) productPrices.set(p.id, { ...p });
      for (const b of next.foodBudgets) foodBudgets.set(b.id, { ...b });
      for (const e of next.foodExpenses) foodExpenses.set(e.id, { ...e });
      for (const s of next.storePreferences) storePreferences.set(s.id, { ...s });
      for (const p of next.purchases) purchases.set(p.id, { ...p });
      for (const l of next.purchaseLines) purchaseLines.set(l.id, { ...l });
      for (const s of next.dailyActivityStats) dailyActivityStats.set(s.id, { ...s });
      for (const s of next.sleepNights) sleepNights.set(s.id, { ...s });
      for (const e of next.strengthExercises) {
        strengthExercises.set(e.id, {
          ...e,
          primaryMuscles: [...e.primaryMuscles],
          secondaryMuscles: [...e.secondaryMuscles],
        });
      }
      for (const t of next.workoutTemplates) workoutTemplates.set(t.id, { ...t });
      for (const l of next.workoutTemplateExercises) workoutTemplateExercises.set(l.id, { ...l });
      for (const a of next.plannedActivities) plannedActivities.set(a.id, { ...a });
      for (const s of next.workoutSessions) workoutSessions.set(s.id, { ...s });
      for (const s of next.workoutSets) workoutSets.set(s.id, { ...s });
      syncBuiltinStrengthProgram();

      notify();
      return summarizeSnapshot(next);
    },
    deleteAllUserData() {
      products.clear();
      recipes.clear();
      ingredients.clear();
      entries.clear();
      waterEntries.clear();
      weightEntries.clear();
      habitChecks.clear();
      workouts.clear();
      flexibleHabits.clear();
      flexibleHabitEvents.clear();
      savedMeals.clear();
      challenges.clear();
      pantryItems.clear();
      cookedBatches.clear();
      mealPlans.clear();
      plannedMeals.clear();
      shoppingLists.clear();
      shoppingItems.clear();
      productPrices.clear();
      foodBudgets.clear();
      foodExpenses.clear();
      storePreferences.clear();
      purchases.clear();
      purchaseLines.clear();
      dailyActivityStats.clear();
      sleepNights.clear();
      strengthExercises.clear();
      workoutTemplates.clear();
      workoutTemplateExercises.clear();
      plannedActivities.clear();
      workoutSessions.clear();
      workoutSets.clear();
      garminSync = emptyGarminSync();
      trainingCycle = null;
      for (const s of defaultStorePreferences(nowIso())) storePreferences.set(s.id, s);
      profile.dogfoodStartedOn = null;
      profile.heightCm = null;
      profile.dailyEnergyKcal = null;
      profile.dailyProteinG = null;
      profile.dailyFatG = null;
      profile.dailyCarbG = null;
      profile.waterTargetMl = 2000;
      // Keep offline staples searchable after wipe.
      mergeCommonFoodCatalog(products);
      syncBuiltinStrengthProgram();
      notify();
    },
  };

  return api;
}

export type PersistableFoodRepository = ReturnType<typeof createMemoryFoodRepository> & {
  setPersistHook(fn: (snap: StoreSnapshot) => void): void;
  flushPersist(): void;
  setPersistStatusListener(fn: ((error: Error | null) => void) | null): void;
};

export function asPersistable(repo: FoodRepository): PersistableFoodRepository {
  return repo as PersistableFoodRepository;
}
