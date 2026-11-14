import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { portion } from "../../../../src/domain/nutrition";
import {
  entryDetails,
  MEALS,
  MEAL_LABELS,
} from "../../../../src/domain/diaryEntry";
import type {
  FoodEntry,
  FoodProduct,
  MealSlot,
  Recipe,
} from "../../../../src/storage/types";
import { localDateKey } from "../../../../src/storage/validation";
import { CopyYesterdayButton } from "@/src/components/CopyYesterdayButton";
import { DiaryDayHeader } from "@/src/features/diary/DiaryDayHeader";
import { DaySwipeArea } from "@/src/components/DaySwipeArea";
import { FlashBar } from "@/src/components/FlashBar";
import { FormScrollView } from "@/src/components/FormScrollView";
import { KcalRing } from "@/src/components/KcalRing";
import { SaveMealModal } from "@/src/components/SaveMealModal";
import { ScreenFooter } from "@/src/components/ScreenFooter";
import { UndoBar } from "@/src/components/UndoBar";
import { ActionMenuSheet } from "@/src/components/ActionMenuSheet";
import { DayCalendarSheet } from "@/src/features/calendar/DayCalendarSheet";
import { AddFoodSheet } from "@/src/features/diary/AddFoodSheet";
import { BarcodeLookupSheet } from "@/src/features/diary/BarcodeLookupSheet";
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from "@/src/features/diary/ConfirmPortionSheet";
import {
  FoodCatalogList,
  type CatalogFilter,
} from "@/src/features/diary/FoodCatalogList";
import { FoodQuickStrips } from "@/src/features/diary/FoodQuickStrips";
import {
  FoodSegmentTabs,
  type FoodSegment,
} from "@/src/features/diary/FoodSegmentTabs";
import { MealSection } from "@/src/features/diary/MealSection";
import { MealPickerRow } from "@/src/features/diary/MealPickerRow";
import { EntryAmountSheet } from "@/src/features/diary/EntryAmountSheet";
import { EntryLocationSheet } from "@/src/features/diary/EntryLocationSheet";
import { useQuickFood } from "@/src/features/diary/useQuickFood";
import { useAddGuard } from "@/src/hooks/useAddGuard";
import { useData, useDiaryRevision } from "@/src/state/DataContext";
import type { AddFoodTab } from "@/src/features/diary/addFood/types";
import {
  AppButton,
  AppText,
  Field,
  colors,
  radius,
  space,
  touchMin,
} from "@/src/design-system";

export default function FoodScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
  const {
    repo,
    dateLocal,
    setDateLocal,
    meal,
    setMeal,
    refresh,
    setUndo,
    showFlash,
  } = useData();
  const revision = useDiaryRevision();
  const quick = useQuickFood();
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<AddFoodTab>("recent");
  const [segment, setSegment] = useState<FoodSegment>(
    params.segment === "catalog" ? "catalog" : "diary",
  );
  useFocusEffect(
    useCallback(() => {
      if (params.segment === "catalog" || params.segment === "diary")
        setSegment(params.segment);
    }, [params.segment]),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [entryMenu, setEntryMenu] = useState<FoodEntry | null>(null);
  const [location, setLocation] = useState<{
    entry: FoodEntry;
    mode: "move" | "copy";
  } | null>(null);
  const [savingMeal, setSavingMeal] = useState<MealSlot | null>(null);
  const [portionTarget, setPortionTarget] = useState<{
    target: PortionTarget;
    grams: number;
  } | null>(null);
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const entries = repo.listEntriesForDate(dateLocal);
  const totals = repo.dailyTotals(dateLocal);
  const products = useMemo(() => repo.listProducts(), [repo, revision]);
  const recipes = useMemo(() => repo.listRecipes(), [repo, revision]);
  const recent = useMemo(() => repo.listRecentEntries(16), [repo, revision]);
  const mealEntries = useMemo(
    () =>
      Object.fromEntries(
        MEALS.map((slot) => [slot, entries.filter((e) => e.meal === slot)]),
      ) as Record<MealSlot, FoodEntry[]>,
    [entries],
  );
  const ingredientCounts = useMemo(
    () =>
      Object.fromEntries(
        recipes.map((r) => [r.id, repo.getRecipeIngredients(r.id).length]),
      ),
    [repo, recipes],
  );
  const add = (slot = meal, tab: AddFoodTab = "recent") => {
    setMeal(slot);
    setInitialTab(tab);
    setOpen(true);
  };
  const changed = (message: string, action: () => void) => {
    refresh("diary");
    showFlash(message);
    setUndo({ message, action });
  };
  const openProduct = (product: FoodProduct) =>
    setPortionTarget({
      target: { kind: "product", product },
      grams: repo.lastGramsForProduct(product.id) ?? 100,
    });
  const openRecipe = (recipe: Recipe) =>
    setPortionTarget({
      target: {
        kind: "recipe",
        recipe,
        ingredients: repo.getRecipeIngredients(recipe.id),
      },
      grams: Math.min(200, recipe.cookedYieldG),
    });
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRow}>
          <Pressable
            style={styles.icon}
            accessibilityRole="button"
            accessibilityLabel="План питания"
            onPress={() => router.push("/plan")}
          >
            <Ionicons name="compass-outline" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            style={styles.icon}
            accessibilityRole="button"
            accessibilityLabel="Рецепты"
            onPress={() => router.push("/recipes")}
          >
            <Ionicons name="book-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router]);
  const chrome = (
    <>
      <DiaryDayHeader
        compact={segment === "catalog"}
        dateLocal={dateLocal}
        today={today}
        onSelect={setDateLocal}
        onOpenCalendar={() => setCalendarOpen(true)}
      />
      <FoodSegmentTabs value={segment} onChange={setSegment} />
    </>
  );
  return (
    <View style={styles.root} testID="food-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        {segment === "diary" ? (
          <FormScrollView contentContainerStyle={styles.content}>
            {chrome}
            <KcalRing
              variant="compact"
              totals={totals}
              targets={{
                energyKcal: profile.dailyEnergyKcal,
                proteinG: profile.dailyProteinG,
                fatG: profile.dailyFatG,
                carbG: profile.dailyCarbG,
              }}
              onSetTarget={() => router.push("/profile?section=goals")}
            />
            <View style={styles.quick}>
              <MealPickerRow value={meal} onChange={setMeal} />
              <FoodQuickStrips
                savedMeals={repo.listSavedMeals()}
                recent={recent}
                onLogSaved={quick.logSaved}
                onRecentConfirm={quick.setRepeating}
                onRecentQuick={quick.quickRepeat}
                onOpenSavedInSheet={() => add(meal, "meals")}
                onOpenRecentInSheet={() => add(meal)}
              />
              <CopyYesterdayButton />
            </View>
            <View style={styles.diaryHead}>
              <AppText variant="subtitle">Дневник</AppText>
              <AppText variant="caption" tone="secondary">
                {entries.length} поз. за день
              </AppText>
            </View>
            {!entries.length ? (
              <AppText variant="body" tone="secondary" testID="diary-empty">
                Начни с любого приёма. Можно найти продукт, отсканировать
                упаковку или записать калории вручную.
              </AppText>
            ) : null}
            {MEALS.map((slot) => (
              <MealSection
                key={slot}
                meal={slot}
                entries={mealEntries[slot]}
                onEditGrams={setEditing}
                onEntryActions={setEntryMenu}
                onAdd={() => add(slot)}
                onRepeatMeal={() => {
                  if (!allowAdd()) return;
                  try {
                    const created = repo.copyDiaryEntries({
                      items: mealEntries[slot].map((e) => ({ entryId: e.id })),
                      dateLocal,
                      meal: slot,
                    });
                    changed(`Повторён ${MEAL_LABELS[slot].toLowerCase()}`, () =>
                      repo.undoDiaryAdds(created.map((e) => e.id)),
                    );
                  } catch (e) {
                    showFlash(
                      e instanceof Error ? e.message : "Не удалось повторить",
                    );
                  }
                }}
                onSaveMeal={() => setSavingMeal(slot)}
              />
            ))}
            <Pressable
              style={styles.planLink}
              onPress={() => router.push("/plan")}
              accessibilityRole="button"
              accessibilityLabel="Открыть план питания"
            >
              <View style={{ flex: 1, gap: space.xs }}>
                <AppText variant="body">План питания</AppText>
                <AppText variant="caption" tone="secondary">
                  Запланированное отдельно от съеденного
                </AppText>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </Pressable>
          </FormScrollView>
        ) : (
          <View style={styles.catalogRoot}>
            <View style={styles.catalogChrome}>
              {chrome}
              <Field
                label="Найти продукт или рецепт"
                value={query}
                onChangeText={setQuery}
                placeholder="Яйцо, овсянка, рецепт…"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              <MealPickerRow value={meal} onChange={setMeal} />
              <AppText variant="caption" tone="secondary">
                Нажми на продукт, чтобы выбрать порцию.
              </AppText>
            </View>
            <FoodCatalogList
              filter={filter}
              onFilterChange={setFilter}
              products={products}
              recipes={recipes}
              recent={recent}
              frequent={repo.listFrequentProducts(24)}
              query={query}
              recipeIngredientCounts={ingredientCounts}
              onAddProduct={openProduct}
              onAddRecipe={openRecipe}
              onOpenRecipe={(r) => router.push(`/recipes/${r.id}`)}
              onBrowseRecipes={() => router.push("/recipes")}
              onToggleFavorite={(p) => {
                const previous = p.isFavorite;
                repo.setFavorite(p.id, !previous);
                changed(
                  previous ? "Убрано из избранного" : "Добавлено в избранное",
                  () => repo.setFavorite(p.id, previous),
                );
              }}
              onRepeatEntry={quick.quickRepeat}
            />
          </View>
        )}
      </DaySwipeArea>
      <ScreenFooter>
        <AppButton
          label="Добавить еду"
          onPress={() => add()}
          style={{ flex: 1 }}
          testID="food-add-cta"
        />
        <Pressable
          style={styles.scan}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
          testID="food-scan-cta"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </Pressable>
      </ScreenFooter>
      <AddFoodSheet
        visible={open}
        onClose={() => setOpen(false)}
        initialTab={initialTab}
      />
      <BarcodeLookupSheet
        visible={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
      />
      <DayCalendarSheet
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
      <EntryAmountSheet
        entry={editing ?? quick.repeating}
        mode={editing ? "edit" : "repeat"}
        context={`${MEAL_LABELS[editing?.meal ?? meal]} · ${dateLocal}`}
        onClose={() => {
          setEditing(null);
          quick.setRepeating(null);
        }}
        onSave={(amount) => {
          if (editing) {
            const previous = entryDetails(editing);
            repo.updateEntryGrams(editing.id, amount);
            changed("Порция изменена", () =>
              repo.updateEntryDetails(editing.id, previous),
            );
            setEditing(null);
          } else if (quick.repeating) quick.repeat(quick.repeating, amount);
        }}
      />
      <ActionMenuSheet
        visible={!!entryMenu}
        onClose={() => setEntryMenu(null)}
        title={entryMenu?.displayName ?? "Запись"}
        actions={
          entryMenu
            ? [
                {
                  id: "edit-entry",
                  label: "Изменить порцию",
                  onPress: () => setEditing(entryMenu),
                },
                {
                  id: "move-entry",
                  label: "Перенести в другой приём или день",
                  onPress: () =>
                    setLocation({ entry: entryMenu, mode: "move" }),
                },
                {
                  id: "copy-entry",
                  label: "Скопировать в приём или день",
                  onPress: () =>
                    setLocation({ entry: entryMenu, mode: "copy" }),
                },
                {
                  id: "delete-entry",
                  label: "Удалить запись",
                  destructive: true,
                  onPress: () => {
                    repo.softDeleteEntry(entryMenu.id);
                    changed(`Удалено: ${entryMenu.displayName}`, () =>
                      repo.undoDeleteEntry(entryMenu.id),
                    );
                  },
                },
              ]
            : []
        }
      />
      <EntryLocationSheet
        entry={location?.entry ?? null}
        mode={location?.mode ?? "move"}
        onClose={() => setLocation(null)}
        onSave={(date, slot) => {
          if (!location) return;
          const previous = entryDetails(location.entry);
          if (location.mode === "move") {
            repo.updateEntryDetails(location.entry.id, {
              dateLocal: date,
              meal: slot,
            });
            changed(`Перенесено · ${MEAL_LABELS[slot]} · ${date}`, () => {
              repo.updateEntryDetails(location.entry.id, previous);
              setDateLocal(previous.dateLocal);
            });
          } else {
            if (!allowAdd()) return;
            const created = repo.copyDiaryEntries({
              items: [{ entryId: location.entry.id }],
              dateLocal: date,
              meal: slot,
            });
            changed(`Скопировано · ${MEAL_LABELS[slot]} · ${date}`, () => {
              repo.undoDiaryAdds(created.map((e) => e.id));
              setDateLocal(previous.dateLocal);
            });
          }
          setDateLocal(date);
          setLocation(null);
        }}
      />
      <SaveMealModal
        hint={
          savingMeal &&
          mealEntries[savingMeal].some((e) => !e.productId && !e.recipeId)
            ? "В шаблон войдут только продукты и рецепты. Быстрый ввод останется в дневнике."
            : undefined
        }
        visible={!!savingMeal}
        defaultName={savingMeal ? MEAL_LABELS[savingMeal] : ""}
        onClose={() => setSavingMeal(null)}
        onSave={(name) => {
          if (!savingMeal) return;
          const hasQuick = mealEntries[savingMeal].some(
            (e) => !e.productId && !e.recipeId,
          );
          repo.createSavedMealFromEntries(
            name,
            mealEntries[savingMeal],
            savingMeal,
          );
          refresh("diary");
          showFlash(
            `Сохранён приём «${name}»${hasQuick ? " · только продукты и рецепты" : ""}`,
          );
        }}
      />
      <ConfirmPortionSheet
        visible={!!portionTarget}
        target={portionTarget?.target ?? null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={portionTarget?.grams}
        onClose={() => setPortionTarget(null)}
        onConfirm={(result) => {
          if (!portionTarget || !allowAdd()) return;
          let created: FoodEntry;
          if (portionTarget.target.kind === "product") {
            repo.updateProductNutrition(
              portionTarget.target.product.id,
              result.per100g,
            );
            created = repo.addEntryFromProduct({
              productId: portionTarget.target.product.id,
              dateLocal,
              meal,
              grams: result.grams,
            });
          } else {
            const n = portion(
              {
                kcal: result.per100g.energyKcal,
                protein: result.per100g.proteinG,
                fat: result.per100g.fatG,
                carbs: result.per100g.carbG,
              },
              result.grams,
            );
            created = repo.addEntryFromRecipe({
              recipeId: portionTarget.target.recipe.id,
              dateLocal,
              meal,
              grams: result.grams,
              nutritionSnapshot: {
                energyKcal: n.kcal,
                proteinG: n.protein,
                fatG: n.fat,
                carbG: n.carbs,
              },
            });
          }
          changed(`Добавлено: ${created.displayName}`, () =>
            repo.undoDiaryAdds([created.id]),
          );
          setPortionTarget(null);
        }}
      />
      <FlashBar />
      <UndoBar />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.screen, paddingBottom: 112, gap: space.sm },
  headerRow: { flexDirection: "row", marginRight: space.sm },
  icon: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
  scan: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  quick: { paddingTop: space.md, gap: space.sm },
  diaryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.lg,
    gap: space.sm,
  },
  planLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.lg,
  },
  catalogRoot: { flex: 1 },
  catalogChrome: {
    paddingHorizontal: space.screen,
    paddingTop: space.screen,
    gap: space.sm,
  },
});
