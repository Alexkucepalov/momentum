import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { createAddGuard } from "../../../../src/domain/addGuard";
import { getLocalDataWipeEpoch } from "../../../../src/domain/localDataWipeEpoch";
import { mealSlotForNow } from "../../../../src/domain/mealSlotForNow";
import type { FoodRepository } from "../../../../src/storage/foodRepository";
import { localDateKey } from "../../../../src/storage/validation";
import type { MealSlot } from "../../../../src/storage/types";
import { feedbackDayChange } from "@/src/utils/dayChangeFeedback";

/**
 * Undo toast:
 * - `entryId` — restore soft-deleted entry (undo delete)
 * - `entryIds` — soft-delete newly added entries (undo add / copy yesterday)
 */
export type UndoState = {
  message: string;
  entryId?: string;
  entryIds?: string[];
  action?: () => void;
  wipeEpoch?: number;
  scope?: DataRefreshScope | "all";
} | null;

/** Narrow re-render fan-out: screens subscribe via use*Revision hooks. */
export type DataRefreshScope = "diary" | "activity" | "profile" | "plan";

type AreaRevisions = Record<DataRefreshScope, number>;

const EMPTY_AREAS: AreaRevisions = {
  diary: 0,
  activity: 0,
  profile: 0,
  plan: 0,
};

type DataContextValue = {
  repo: FoodRepository;
  dateLocal: string;
  setDateLocal: (d: string) => void;
  meal: MealSlot;
  setMeal: (m: MealSlot) => void;
  /** Default `all` keeps old call sites safe; pass a scope to limit fan-out. */
  refresh: (scope?: DataRefreshScope | "all") => void;
  undo: UndoState;
  setUndo: (u: UndoState) => void;
  performUndo: () => void;
  allowFoodAdd: () => boolean;
  flash: string | null;
  flashId: number;
  showFlash: (message: string) => void;
  clearFlash: () => void;
};

const DataContext = createContext<DataContextValue | null>(null);
const DiaryRevisionContext = createContext(0);
const ActivityRevisionContext = createContext(0);
const ProfileRevisionContext = createContext(0);
const PlanRevisionContext = createContext(0);

export function DataProvider({
  repo,
  children,
}: {
  repo: FoodRepository;
  children: ReactNode;
}) {
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const [dateLocal, setDateLocal] = useState(today);
  const [meal, setMeal] = useState<MealSlot>(() => mealSlotForNow());
  const [areas, setAreas] = useState<AreaRevisions>(EMPTY_AREAS);
  const [undo, setUndoState] = useState<UndoState>(null);
  const addGuard = useRef(createAddGuard());
  const allowFoodAdd = useCallback(() => addGuard.current.tryAllow(), []);
  const setUndo = useCallback(
    (next: UndoState) =>
      setUndoState(
        next ? { ...next, wipeEpoch: getLocalDataWipeEpoch() } : null,
      ),
    [],
  );
  const [flashId, setFlashId] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  // One expiry owner: hidden tab instances must not clear a newer screen's Undo.
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(timer);
  }, [undo, setUndo]);

  const refresh = useCallback((scope: DataRefreshScope | "all" = "all") => {
    setAreas((prev) => {
      if (scope === "all") {
        return {
          diary: prev.diary + 1,
          activity: prev.activity + 1,
          profile: prev.profile + 1,
          plan: prev.plan + 1,
        };
      }
      return { ...prev, [scope]: prev[scope] + 1 };
    });
  }, []);

  const showFlash = useCallback((message: string) => {
    setUndo(null);
    setFlash(message);
    setFlashId(id => id + 1);
  }, [setUndo]);
  const clearFlash = useCallback(() => setFlash(null), []);

  const setDateLocalWithFeedback = useCallback((d: string) => {
    setDateLocal((prev) => {
      if (prev !== d) void feedbackDayChange();
      return d;
    });
  }, []);

  const performUndo = useCallback(() => {
    if (!undo) return;
    try {
      if (undo.wipeEpoch !== getLocalDataWipeEpoch())
        throw new Error("После очистки данных отмена недоступна");
      if (undo.action) undo.action();
      else if (undo.entryIds?.length) repo.undoDiaryAdds(undo.entryIds);
      else if (undo.entryId) repo.undoDeleteEntry(undo.entryId);
      setUndo(null);
      clearFlash();
      refresh(undo.scope ?? "diary");
    } catch (e) {
      setUndo(null);
      showFlash(e instanceof Error ? e.message : "Не удалось отменить");
    }
  }, [undo, repo, refresh, setUndo, clearFlash, showFlash]);

  const value = useMemo(
    () => ({
      repo,
      dateLocal,
      setDateLocal: setDateLocalWithFeedback,
      meal,
      setMeal,
      refresh,
      undo,
      setUndo,
      performUndo,
      allowFoodAdd,
      flash,
      flashId,
      showFlash,
      clearFlash,
    }),
    [
      repo,
      dateLocal,
      setDateLocalWithFeedback,
      meal,
      refresh,
      undo,
      performUndo,
      allowFoodAdd,
      flash,
      flashId,
      showFlash,
      clearFlash,
    ],
  );

  return (
    <DataContext.Provider value={value}>
      <DiaryRevisionContext.Provider value={areas.diary}>
        <ActivityRevisionContext.Provider value={areas.activity}>
          <ProfileRevisionContext.Provider value={areas.profile}>
            <PlanRevisionContext.Provider value={areas.plan}>
              <React.Fragment key={getLocalDataWipeEpoch()}>{children}</React.Fragment>
            </PlanRevisionContext.Provider>
          </ProfileRevisionContext.Provider>
        </ActivityRevisionContext.Provider>
      </DiaryRevisionContext.Provider>
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData requires DataProvider");
  return ctx;
}

/** Subscribe only to diary mutations (Food / Today / AddFood). */
export function useDiaryRevision(): number {
  return useContext(DiaryRevisionContext);
}

export function useActivityRevision(): number {
  return useContext(ActivityRevisionContext);
}

export function useProfileRevision(): number {
  return useContext(ProfileRevisionContext);
}

export function usePlanRevision(): number {
  return useContext(PlanRevisionContext);
}

/** Subscribe to every area — Progress / cross-cutting surfaces. */
export function useAnyRevision(): number {
  return (
    useDiaryRevision() +
    useActivityRevision() +
    useProfileRevision() +
    usePlanRevision()
  );
}
