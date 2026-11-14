import { useState } from "react";
import { MEAL_LABELS } from "../../../../../src/domain/diaryEntry";
import type { FoodEntry, SavedMeal } from "../../../../../src/storage/types";
import { useData } from "@/src/state/DataContext";
import { useAddGuard } from "@/src/hooks/useAddGuard";
export function useQuickFood() {
  const { repo, dateLocal, meal, refresh, setUndo, showFlash } = useData();
  const allowAdd = useAddGuard();
  const [repeating, setRepeating] = useState<FoodEntry | null>(null);
  const repeat = (entry: FoodEntry, grams?: number) => {
    if (!allowAdd()) return;
    const created = repo.copyDiaryEntries({
      items: [{ entryId: entry.id, grams }],
      dateLocal,
      meal,
    });
    const message = `${MEAL_LABELS[meal]} · добавлено: ${entry.displayName}`;
    refresh("diary");
    showFlash(message);
    setUndo({ message, entryIds: created.map((e) => e.id) });
    setRepeating(null);
  };
  return {
    repeating,
    setRepeating,
    repeat,
    quickRepeat: (entry: FoodEntry) => {
      try {
        repeat(entry);
      } catch (e) {
        showFlash(e instanceof Error ? e.message : "Не удалось повторить");
      }
    },
    logSaved: (saved: SavedMeal) => {
      if (!allowAdd()) return;
      try {
        const created = repo.logSavedMeal({
          savedMealId: saved.id,
          dateLocal,
          meal,
        });
        const message = `${MEAL_LABELS[meal]} · ${saved.name}`;
        refresh("diary");
        showFlash(message);
        setUndo({ message, entryIds: created.map((e) => e.id) });
      } catch (e) {
        showFlash(e instanceof Error ? e.message : "Не удалось добавить приём");
      }
    },
  };
}
