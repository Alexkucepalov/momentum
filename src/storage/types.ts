export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutritionSource = 'user' | 'label' | 'catalog' | 'recipe' | 'missing';

export type HabitKey = 'walk' | 'stretch' | 'read';

export type WorkoutType = 'cycling' | 'strength' | 'walking' | 'football' | 'other';

export type Workout = {
  id: string;
  dateLocal: string;
  type: WorkoutType;
  durationSec: number;
  distanceM: number | null;
  notes: string | null;
  source: 'user';
  createdAt: string;
  deletedAt: string | null;
};

export type FoodProduct = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  source: NutritionSource;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Recipe = {
  id: string;
  name: string;
  cookedYieldG: number;
  /** Free-text description of the dish. */
  description: string | null;
  /** Cooking steps / notes. */
  instructions: string | null;
  /** Local file URI for an optional photo (offline). */
  photoUri: string | null;
  /**
   * Optional nutrition of the finished dish per 100 g.
   * When set, used for diary logging instead of ingredient-derived math.
   */
  energyKcalPer100g: number | null;
  proteinGPer100g: number | null;
  fatGPer100g: number | null;
  carbGPer100g: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  productId: string | null;
  displayName: string;
  rawGrams: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type FoodEntry = {
  id: string;
  dateLocal: string;
  meal: MealSlot;
  productId: string | null;
  recipeId: string | null;
  displayName: string;
  grams: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  source: NutritionSource;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Profile = {
  id: string;
  timezone: string;
  locale: string;
  units: 'metric';
  /** Soft personal water cue in ml — not medical advice. null = no target shown. */
  waterTargetMl: number | null;
  /** Local calendar day (YYYY-MM-DD) when founder started the 14-day dogfood gate. */
  dogfoodStartedOn: string | null;
  /** Height for BMI; null = BMI unavailable. */
  heightCm: number | null;
  /** User-set daily energy target (kcal). null = no target. Not estimated by the app. */
  dailyEnergyKcal: number | null;
  dailyProteinG: number | null;
  dailyFatG: number | null;
  dailyCarbG: number | null;
  /**
   * ISO timestamp when user skipped first-run goals sheet (UX-03).
   * null = may still prompt when all daily* targets are null.
   */
  targetsPromptDismissedAt: string | null;
};

export type DailyNutritionTargets = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type DailyTotals = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  hasUnknownFields: boolean;
  entryCount: number;
};

export type WaterEntry = {
  id: string;
  dateLocal: string;
  ml: number;
  createdAt: string;
};

export type WeightEntry = {
  id: string;
  /** ISO instant */
  weighedAt: string;
  kg: number;
  createdAt: string;
  /** Soft-delete; absent/null = active (legacy snapshots). */
  deletedAt?: string | null;
};

export type HabitCheck = {
  id: string;
  dateLocal: string;
  habitKey: HabitKey;
  done: boolean;
  updatedAt: string;
};

/** checkbox = mark days; quantity = sum values toward a weekly target. */
export type HabitKind = 'checkbox' | 'quantity';

/**
 * Optional auto-credit from app events (Sprint 4).
 * Never invents values — only credits when a matching local event exists.
 */
export type HabitAutoSource =
  | null
  | 'any_workout'
  | 'walking'
  | 'cycling'
  | 'strength'
  | 'food_log';

/** Flexible weekly habit — missed days are fine; no punishment UI. */
export type FlexibleHabit = {
  id: string;
  name: string;
  /** Days-per-week goal for checkbox habits (1–7). */
  timesPerWeek: number;
  kind: HabitKind;
  /** Unit label for quantity habits (мин, км, стр, раз…). */
  unit: string | null;
  /** Weekly sum target for quantity habits; null for checkbox. */
  targetValue: number | null;
  /** Soft pause — hidden from Today until resumed. */
  pausedAt: string | null;
  autoSource: HabitAutoSource;
  active: boolean;
  createdAt: string;
  deletedAt: string | null;
};

export type FlexibleHabitEvent = {
  id: string;
  habitId: string;
  dateLocal: string;
  /** 1 for checkbox; measured amount for quantity. */
  value: number;
  /** Who/what wrote the event (manual | auto:*). */
  source: 'manual' | 'auto';
  createdAt: string;
};

export type ChallengeMetric =
  | 'workouts_count'
  | 'activity_minutes'
  | 'food_log_days'
  | 'habit_completions';

export type ChallengeStatus = 'active' | 'completed' | 'abandoned';

/** Personal challenge — no shaming; progress is observational. */
export type Challenge = {
  id: string;
  name: string;
  metric: ChallengeMetric;
  target: number;
  periodStart: string;
  periodEnd: string;
  /** Required when metric is habit_completions. */
  habitId: string | null;
  status: ChallengeStatus;
  createdAt: string;
  deletedAt: string | null;
};

/** Named multi-item meal template (MFP-style «My Meals»). */
export type SavedMealItem = {
  productId: string | null;
  recipeId: string | null;
  displayName: string;
  grams: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  /** Hint which slot this was saved from; logging can override. */
  defaultMeal: MealSlot | null;
  items: SavedMealItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PantryLocation = 'fridge' | 'freezer' | 'pantry';

export type PantryUnit = 'g' | 'ml' | 'pcs';

export type PantrySource = 'user' | 'purchase';

/** User-managed stock at home (offline). Quantities may be null if unknown — never coerced to 0. */
export type PantryItem = {
  id: string;
  displayName: string;
  productId: string | null;
  location: PantryLocation;
  quantityG: number | null;
  quantityCount: number | null;
  unit: PantryUnit;
  expiresOn: string | null;
  source: PantrySource;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** Leftover prepared recipe batch. remainingG decreases when diary logs that recipe. */
export type CookedBatch = {
  id: string;
  recipeId: string;
  cookedAt: string;
  initialYieldG: number;
  remainingG: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MealPlanStatus = 'draft' | 'active' | 'archived';

export type MealPlanDiversity = 'balanced' | 'fewer';

/** Weekly (or multi-day) meal plan. Planned meals are never auto-logged as eaten. */
export type MealPlan = {
  id: string;
  startDate: string;
  endDate: string;
  status: MealPlanStatus;
  budgetRub: number | null;
  cookSessions: number | null;
  diversity: MealPlanDiversity | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PlannedMealStatus = 'planned' | 'logged' | 'skipped';

export type PlannedMeal = {
  id: string;
  planId: string;
  dateLocal: string;
  meal: MealSlot;
  recipeId: string | null;
  productId: string | null;
  displayName: string;
  grams: number;
  status: PlannedMealStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ShoppingListStatus = 'open' | 'done' | 'archived';

export type ShoppingPriceSource = 'user' | 'receipt' | 'estimate';

export type ShoppingList = {
  id: string;
  planId: string | null;
  title: string;
  status: ShoppingListStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ShoppingItem = {
  id: string;
  listId: string;
  displayName: string;
  quantity: number;
  unit: PantryUnit;
  coveredByPantry: number;
  needToBuy: number;
  checked: boolean;
  priceRub: number | null;
  priceAsOf: string | null;
  priceSource: ShoppingPriceSource | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** User-observed price for a shopping key (never shown as live «сегодня» alone). */
export type ProductPrice = {
  id: string;
  productKey: string;
  storeId: string | null;
  priceRub: number;
  unit: PantryUnit;
  observedOn: string;
  source: ShoppingPriceSource;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FoodExpenseCategory = 'groceries' | 'cafe' | 'office' | 'delivery';

/** Monthly food spend limit (user-set). */
export type FoodBudget = {
  id: string;
  month: string; // YYYY-MM
  limitRub: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FoodExpense = {
  id: string;
  amountRub: number;
  category: FoodExpenseCategory;
  spentOn: string; // YYYY-MM-DD
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** Lifecycle of an imported or manual purchase. Unconfirmed never writes pantry. */
export type PurchaseStatus =
  | 'cart'
  | 'submitted'
  | 'paid'
  | 'delivered'
  | 'fiscal_receipt'
  | 'cancelled';

export type PurchaseSourceKind = 'manual' | 'paste' | 'photo' | 'screenshots' | 'qr';

export type Purchase = {
  id: string;
  status: PurchaseStatus;
  storePreferenceId: string | null;
  storeLabel: string | null;
  purchasedOn: string; // YYYY-MM-DD
  currency: 'RUB';
  totalRub: number | null;
  sourceKind: PurchaseSourceKind;
  fingerprint: string;
  rawPayloadRef: string | null;
  parseConfidence: number | null;
  confirmedAt: string | null;
  expenseId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PurchaseLine = {
  id: string;
  purchaseId: string;
  rawName: string;
  displayName: string;
  quantity: number | null;
  unit: PantryUnit | null;
  packageSizeText: string | null;
  unitPriceRub: number | null;
  lineTotalRub: number | null;
  discountRub: number | null;
  isFood: boolean;
  excluded: boolean;
  productId: string | null;
  barcode: string | null;
  retailerSku: string | null;
  matchConfidence: number | null;
  pantryItemId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** Preferred retailers — tags only, no live catalog. */
export type StorePreferenceId =
  | 'pyaterochka'
  | 'chizhik'
  | 'krasnoe_beloe'
  | 'metro'
  | 'samokat'
  | 'perekrestok'
  | 'magnit'
  | 'vkusvill'
  | 'other';

export type StorePreference = {
  id: string;
  storeId: StorePreferenceId;
  label: string;
  selected: boolean;
  updatedAt: string;
};

export type StoreSnapshot = {
  version: 14;
  profile: Profile;
  products: FoodProduct[];
  recipes: Recipe[];
  ingredients: RecipeIngredient[];
  entries: FoodEntry[];
  waterEntries: WaterEntry[];
  weightEntries: WeightEntry[];
  habitChecks: HabitCheck[];
  workouts: Workout[];
  flexibleHabits: FlexibleHabit[];
  flexibleHabitEvents: FlexibleHabitEvent[];
  savedMeals: SavedMeal[];
  challenges: Challenge[];
  pantryItems: PantryItem[];
  cookedBatches: CookedBatch[];
  mealPlans: MealPlan[];
  plannedMeals: PlannedMeal[];
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingItem[];
  productPrices: ProductPrice[];
  foodBudgets: FoodBudget[];
  foodExpenses: FoodExpense[];
  storePreferences: StorePreference[];
  purchases: Purchase[];
  purchaseLines: PurchaseLine[];
};

type LegacyRecipe = Omit<
  Recipe,
  | 'description'
  | 'instructions'
  | 'photoUri'
  | 'energyKcalPer100g'
  | 'proteinGPer100g'
  | 'fatGPer100g'
  | 'carbGPer100g'
> & {
  description?: string | null;
  instructions?: string | null;
  photoUri?: string | null;
  energyKcalPer100g?: number | null;
  proteinGPer100g?: number | null;
  fatGPer100g?: number | null;
  carbGPer100g?: number | null;
};

type LegacyFlexibleHabit = Omit<
  FlexibleHabit,
  'kind' | 'unit' | 'targetValue' | 'pausedAt' | 'autoSource'
> & {
  kind?: HabitKind;
  unit?: string | null;
  targetValue?: number | null;
  pausedAt?: string | null;
  autoSource?: HabitAutoSource;
};

type LegacyFlexibleHabitEvent = Omit<FlexibleHabitEvent, 'value' | 'source'> & {
  value?: number;
  source?: 'manual' | 'auto';
};

/** Accept older snapshots from prior installs. */
export type StoreSnapshotAny = {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
  profile: Omit<
    Profile,
    | 'waterTargetMl'
    | 'dogfoodStartedOn'
    | 'heightCm'
    | 'dailyEnergyKcal'
    | 'dailyProteinG'
    | 'dailyFatG'
    | 'dailyCarbG'
  > & {
    waterTargetMl?: number | null;
    dogfoodStartedOn?: string | null;
    heightCm?: number | null;
    dailyEnergyKcal?: number | null;
    dailyProteinG?: number | null;
    dailyFatG?: number | null;
    dailyCarbG?: number | null;
    targetsPromptDismissedAt?: string | null;
  };
  products: FoodProduct[];
  recipes: LegacyRecipe[];
  ingredients: RecipeIngredient[];
  entries: FoodEntry[];
  waterEntries?: WaterEntry[];
  weightEntries?: WeightEntry[];
  habitChecks?: HabitCheck[];
  workouts?: Workout[];
  flexibleHabits?: LegacyFlexibleHabit[];
  flexibleHabitEvents?: LegacyFlexibleHabitEvent[];
  savedMeals?: SavedMeal[];
  challenges?: Challenge[];
  pantryItems?: PantryItem[];
  cookedBatches?: CookedBatch[];
  mealPlans?: MealPlan[];
  plannedMeals?: PlannedMeal[];
  shoppingLists?: ShoppingList[];
  shoppingItems?: ShoppingItem[];
  productPrices?: ProductPrice[];
  foodBudgets?: FoodBudget[];
  foodExpenses?: FoodExpense[];
  storePreferences?: StorePreference[];
  purchases?: Purchase[];
  purchaseLines?: PurchaseLine[];
};
