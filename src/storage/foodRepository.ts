import { sumActivityKcal } from '../domain/activityEnergy';
import { buildCookAgainInput, type CookAgainDraft } from '../domain/cookAgain';
import { mergeCommonFoodCatalog } from '../domain/commonFoodCatalog';
import { decreaseCookedRemaining, pickFifoBatchId } from '../domain/cookedBatch';
import { dogfoodStatus, type DogfoodStatus } from '../domain/dogfood';
import { parseExportJson, summarizeSnapshot, type ImportSummary } from '../domain/importExport';
import {
  aggregateShopping,
  estimateBasketTotal,
  scaleIngredientGrams,
  shoppingKey,
  type BasketTotal,
} from '../domain/aggregateShopping';
import {
  buildMealPlanDraft,
  type MealPlanDiversity,
  type MealPlanPeriodDays,
} from '../domain/mealPlanDraft';
import { portion, type Nutrition } from '../domain/nutrition';
import { rankProductFrequency } from '../domain/productFrequency';
import { nutritionForRecipePortion } from '../domain/recipeNutrition';
import { computeDailyTotals } from './dailyTotals';
import {
  assertNonNegativeFinite,
  assertPositiveFinite,
  nutritionFromProductFields,
} from './validation';
import type {
  CookedBatch,
  DailyNutritionTargets,
  DailyTotals,
  FoodEntry,
  FoodProduct,
  HabitCheck,
  HabitKey,
  MealPlan,
  MealPlanStatus,
  MealSlot,
  NutritionSource,
  PantryItem,
  PantryLocation,
  PantryUnit,
  PlannedMeal,
  ProductPrice,
  Profile,
  ShoppingItem,
  ShoppingList,
  ShoppingListStatus,
  ShoppingPriceSource,
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
} from './types';
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
  updateEntryGrams(entryId: string, grams: number): FoodEntry;
  softDeleteEntry(entryId: string): FoodEntry;
  undoDeleteEntry(entryId: string): FoodEntry;
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
  addWeight(kg: number, weighedAt?: string): WeightEntry;
  listWeights(limit?: number): WeightEntry[];
  latestWeight(): WeightEntry | null;
  toggleHabit(dateLocal: string, habitKey: HabitKey): HabitCheck;
  isHabitDone(dateLocal: string, habitKey: HabitKey): boolean;
  addWorkout(input: {
    dateLocal: string;
    type: WorkoutType;
    durationSec: number;
    distanceM?: number | null;
    notes?: string | null;
  }): Workout;
  listWorkoutsForDate(dateLocal: string): Workout[];
  softDeleteWorkout(workoutId: string): Workout;
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
  logFlexibleHabit(
    habitId: string,
    dateLocal: string,
    value?: number,
    source?: 'manual' | 'auto',
  ): FlexibleHabitEvent;
  unlogFlexibleHabit(habitId: string, dateLocal: string): void;
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
  }): PantryItem;
  softDeletePantryItem(pantryItemId: string): PantryItem;
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
  /**
   * Explicitly log a planned meal into the diary. Marks planned status `logged`.
   * Never auto-called on plan create.
   */
  logPlannedMealToDiary(plannedMealId: string): FoodEntry;
  listShoppingLists(): ShoppingList[];
  getShoppingList(listId: string): ShoppingList | null;
  listShoppingItems(listId: string): ShoppingItem[];
  /** Build list from meal plan ingredients; does not invent prices. */
  createShoppingListFromPlan(planId: string, title?: string): ShoppingList;
  setShoppingItemChecked(itemId: string, checked: boolean): ShoppingItem;
  setShoppingItemPrice(
    itemId: string,
    args: { priceRub: number | null; priceAsOf?: string | null; priceSource?: ShoppingPriceSource | null },
  ): ShoppingItem;
  softDeleteShoppingList(listId: string): ShoppingList;
  shoppingBasketTotal(listId: string): BasketTotal;
  upsertProductPrice(input: {
    productKey: string;
    priceRub: number;
    unit: PantryUnit;
    observedOn: string;
    storeId?: string | null;
    source?: ShoppingPriceSource;
  }): ProductPrice;
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
    waterTargetMl: raw.waterTargetMl ?? 2000,
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
  return {
    id: raw.id,
    displayName: raw.displayName,
    productId: raw.productId ?? null,
    location,
    quantityG: raw.quantityG ?? null,
    quantityCount: raw.quantityCount ?? null,
    unit,
    expiresOn: raw.expiresOn ?? null,
    source: 'user',
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

function normalizeSnapshot(raw?: StoreSnapshotAny): StoreSnapshot | undefined {
  if (!raw) return undefined;
  return {
    version: 12,
    profile: normalizeProfile(raw.profile),
    products: raw.products ?? [],
    recipes: (raw.recipes ?? []).map(normalizeRecipe),
    ingredients: raw.ingredients ?? [],
    entries: raw.entries ?? [],
    waterEntries: raw.waterEntries ?? [],
    weightEntries: raw.weightEntries ?? [],
    habitChecks: raw.habitChecks ?? [],
    workouts: raw.workouts ?? [],
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
  const profile: Profile = snap?.profile ?? {
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
  const products = new Map<string, FoodProduct>((snap?.products ?? []).map((p) => [p.id, { ...p }]));
  mergeCommonFoodCatalog(products);
  const recipes = new Map<string, Recipe>((snap?.recipes ?? []).map((r) => [r.id, { ...r }]));
  const ingredients = new Map<string, RecipeIngredient[]>();
  for (const ing of snap?.ingredients ?? []) {
    const list = ingredients.get(ing.recipeId) ?? [];
    list.push({ ...ing });
    ingredients.set(ing.recipeId, list);
  }
  const entries = new Map<string, FoodEntry>((snap?.entries ?? []).map((e) => [e.id, { ...e }]));
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

  let persistHook: ((snap: StoreSnapshot) => void) | null = null;

  const notify = () => {
    if (persistHook) persistHook(api.toSnapshot());
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

  const api: FoodRepository & { setPersistHook(fn: (snap: StoreSnapshot) => void): void } = {
    setPersistHook(fn) {
      persistHook = fn;
    },
    toSnapshot(): StoreSnapshot {
      return {
        version: 12,
        profile: { ...profile },
        products: [...products.values()].map((p) => ({ ...p })),
        recipes: [...recipes.values()].map((r) => ({ ...r })),
        ingredients: [...ingredients.values()].flat().map((i) => ({ ...i })),
        entries: [...entries.values()].map((e) => ({ ...e })),
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
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
        throw new Error('dateLocal must be YYYY-MM-DD');
      }
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
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
        deduped.push(e);
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
      return { ...entry };
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
      return { ...entry };
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
      entries.set(entry.id, entry);
      const batchId = pickFifoBatchId([...cookedBatches.values()].filter((b) => b.recipeId === recipeId));
      if (batchId) {
        const batch = cookedBatches.get(batchId);
        if (batch && !batch.deletedAt) {
          batch.remainingG = decreaseCookedRemaining(batch.remainingG, grams);
          batch.updatedAt = ts;
        }
      }
      notify();
      return { ...entry };
    },
    updateEntryGrams(entryId, grams) {
      assertNonNegativeFinite(grams, 'grams');
      const entry = entries.get(entryId);
      if (!entry || entry.deletedAt) throw new Error('Entry not found');
      let snapN: Nutrition;
      if (entry.productId) {
        const product = products.get(entry.productId);
        if (!product) throw new Error('Product missing for entry');
        snapN = portion(
          {
            kcal: product.energyKcal,
            protein: product.proteinG,
            fat: product.fatG,
            carbs: product.carbG,
          },
          grams,
        );
      } else if (entry.recipeId) {
        const recipe = recipes.get(entry.recipeId);
        if (!recipe) throw new Error('Recipe missing for entry');
        snapN = nutritionForRecipePortion(
          recipe,
          ingredients.get(entry.recipeId) ?? [],
          grams,
        );
      } else {
        const factor = entry.grams === 0 ? 0 : grams / entry.grams;
        snapN = {
          kcal: entry.energyKcal === null ? null : entry.energyKcal * factor,
          protein: entry.proteinG === null ? null : entry.proteinG * factor,
          fat: entry.fatG === null ? null : entry.fatG * factor,
          carbs: entry.carbG === null ? null : entry.carbG * factor,
        };
      }
      entry.grams = grams;
      entry.energyKcal = snapN.kcal;
      entry.proteinG = snapN.protein;
      entry.fatG = snapN.fat;
      entry.carbG = snapN.carbs;
      entry.updatedAt = nowIso();
      notify();
      return { ...entry };
    },
    softDeleteEntry(entryId) {
      const entry = entries.get(entryId);
      if (!entry) throw new Error('Entry not found');
      entry.deletedAt = nowIso();
      entry.updatedAt = entry.deletedAt;
      notify();
      return { ...entry };
    },
    undoDeleteEntry(entryId) {
      const entry = entries.get(entryId);
      if (!entry) throw new Error('Entry not found');
      entry.deletedAt = null;
      entry.updatedAt = nowIso();
      notify();
      return { ...entry };
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
      const recipe = recipes.get(recipeId);
      if (!recipe || recipe.deletedAt) throw new Error('Recipe not found');
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
        ingredients.set(
          recipe.id,
          input.ingredients.map((ing) => ({
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
      }
      const ings = ingredients.get(recipe.id) ?? [];
      const hasManual =
        recipe.energyKcalPer100g !== null ||
        recipe.proteinGPer100g !== null ||
        recipe.fatGPer100g !== null ||
        recipe.carbGPer100g !== null;
      if (ings.length === 0 && !hasManual) {
        throw new Error('Add ingredients or nutrition per 100g');
      }
      recipe.updatedAt = nowIso();
      notify();
      return { ...recipe };
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
    addWeight(kg, weighedAt) {
      assertPositiveFinite(kg, 'kg');
      const ts = weighedAt ?? nowIso();
      const entry: WeightEntry = {
        id: newId(),
        weighedAt: ts,
        kg,
        createdAt: nowIso(),
      };
      weightEntries.set(entry.id, entry);
      notify();
      return { ...entry };
    },
    listWeights(limit = 30) {
      return [...weightEntries.values()]
        .sort((a, b) => b.weighedAt.localeCompare(a.weighedAt))
        .slice(0, limit);
    },
    latestWeight() {
      const list = api.listWeights(1);
      return list[0] ?? null;
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
    listWorkoutsForDate(dateLocal) {
      return [...workouts.values()]
        .filter((w) => w.dateLocal === dateLocal && w.deletedAt == null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    softDeleteWorkout(workoutId) {
      const w = workouts.get(workoutId);
      if (!w) throw new Error('Workout not found');
      w.deletedAt = nowIso();
      notify();
      return { ...w };
    },
    activityMinutesForDate(dateLocal) {
      const sec = api
        .listWorkoutsForDate(dateLocal)
        .reduce((sum, w) => sum + w.durationSec, 0);
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
      const habit = flexibleHabits.get(habitId);
      if (!habit || habit.deletedAt != null) throw new Error('Привычка не найдена');
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
        if (habit.targetValue == null || habit.targetValue <= 0) {
          throw new Error('Для количественной привычки укажи цель > 0');
        }
        if (!habit.unit) habit.unit = 'раз';
      }
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
    logFlexibleHabit(habitId, dateLocal, value, source = 'manual') {
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
      const mins = Math.max(1, Math.round(durationSec / 60));
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
        const value = habit.kind === 'quantity' ? mins : 1;
        credited.push(api.logFlexibleHabit(habit.id, dateLocal, value, 'auto'));
      }
      return credited;
    },
    createChallenge(input) {
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
      if (c.metric === 'workouts_count') {
        current = [...workouts.values()].filter(
          (w) =>
            !w.deletedAt && w.dateLocal >= c.periodStart && w.dateLocal <= c.periodEnd,
        ).length;
      } else if (c.metric === 'activity_minutes') {
        current = [...workouts.values()]
          .filter(
            (w) =>
              !w.deletedAt && w.dateLocal >= c.periodStart && w.dateLocal <= c.periodEnd,
          )
          .reduce((s, w) => s + Math.round(w.durationSec / 60), 0);
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
      const name = input.displayName.trim();
      if (!name) throw new Error('Pantry name required');
      if (input.quantityG != null) assertNonNegativeFinite(input.quantityG, 'quantityG');
      if (input.quantityCount != null) assertNonNegativeFinite(input.quantityCount, 'quantityCount');
      const ts = nowIso();
      const existing = input.id ? pantryItems.get(input.id) : undefined;
      if (input.id && (!existing || existing.deletedAt)) throw new Error('Pantry item not found');
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
        source: 'user',
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
        deletedAt: null,
      };
      pantryItems.set(item.id, item);
      notify();
      return { ...item };
    },
    softDeletePantryItem(pantryItemId) {
      const item = pantryItems.get(pantryItemId);
      if (!item || item.deletedAt) throw new Error('Pantry item not found');
      item.deletedAt = nowIso();
      item.updatedAt = item.deletedAt;
      notify();
      return { ...item };
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
    softDeletePlannedMeal(plannedMealId) {
      const m = plannedMeals.get(plannedMealId);
      if (!m || m.deletedAt) throw new Error('Planned meal not found');
      m.deletedAt = nowIso();
      m.updatedAt = m.deletedAt;
      notify();
      return { ...m };
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
        { priceRub: number; priceAsOf: string; priceSource: ShoppingPriceSource }
      >();
      for (const pp of productPrices.values()) {
        if (pp.deletedAt) continue;
        const existing = priceMap.get(pp.productKey);
        if (!existing || pp.observedOn >= existing.priceAsOf) {
          priceMap.set(pp.productKey, {
            priceRub: pp.priceRub,
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
      for (const line of lines) {
        const item: ShoppingItem = {
          id: newId(),
          listId: list.id,
          displayName: line.displayName,
          quantity: line.quantity,
          unit: line.unit,
          coveredByPantry: line.coveredByPantry,
          needToBuy: line.needToBuy,
          checked: line.needToBuy <= 0,
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
      const item = shoppingItems.get(itemId);
      if (!item || item.deletedAt) throw new Error('Shopping item not found');
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
      if (args.priceRub !== null) {
        item.priceSource = item.priceSource ?? 'user';
        const key = shoppingKey(item.displayName, item.unit);
        api.upsertProductPrice({
          productKey: key,
          priceRub: args.priceRub,
          unit: item.unit,
          observedOn: item.priceAsOf ?? nowIso().slice(0, 10),
          source: item.priceSource ?? 'user',
        });
      }
      item.updatedAt = nowIso();
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
      assertNonNegativeFinite(input.priceRub, 'priceRub');
      const key = input.productKey.trim();
      if (!key) throw new Error('productKey required');
      const ts = nowIso();
      const existing = [...productPrices.values()].find(
        (p) => !p.deletedAt && p.productKey === key && (p.storeId ?? null) === (input.storeId ?? null),
      );
      if (existing) {
        existing.priceRub = input.priceRub;
        existing.unit = input.unit;
        existing.observedOn = input.observedOn;
        existing.source = input.source ?? 'user';
        existing.updatedAt = ts;
        notify();
        return { ...existing };
      }
      const row: ProductPrice = {
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

      Object.assign(profile, next.profile);
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
      profile.dogfoodStartedOn = null;
      profile.heightCm = null;
      profile.dailyEnergyKcal = null;
      profile.dailyProteinG = null;
      profile.dailyFatG = null;
      profile.dailyCarbG = null;
      profile.waterTargetMl = 2000;
      // Keep offline staples searchable after wipe.
      mergeCommonFoodCatalog(products);
      notify();
    },
  };

  return api;
}

export type PersistableFoodRepository = ReturnType<typeof createMemoryFoodRepository> & {
  setPersistHook(fn: (snap: StoreSnapshot) => void): void;
};

export function asPersistable(repo: FoodRepository): PersistableFoodRepository {
  return repo as PersistableFoodRepository;
}
