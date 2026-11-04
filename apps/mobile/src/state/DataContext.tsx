import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { mealSlotForNow } from '../../../../src/domain/mealSlotForNow';
import type { FoodRepository } from '../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../src/storage/validation';
import type { MealSlot } from '../../../../src/storage/types';
import { feedbackDayChange } from '@/src/utils/dayChangeFeedback';

/**
 * Undo toast:
 * - `entryId` — restore soft-deleted entry (undo delete)
 * - `entryIds` — soft-delete newly added entries (undo add / copy yesterday)
 */
export type UndoState = {
  message: string;
  entryId?: string;
  entryIds?: string[];
} | null;

/** Narrow re-render fan-out: screens subscribe via use*Revision hooks. */
export type DataRefreshScope = 'diary' | 'activity' | 'profile' | 'plan';

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
  refresh: (scope?: DataRefreshScope | 'all') => void;
  undo: UndoState;
  setUndo: (u: UndoState) => void;
  performUndo: () => void;
  flash: string | null;
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
  const [undo, setUndo] = useState<UndoState>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback((scope: DataRefreshScope | 'all' = 'all') => {
    setAreas((prev) => {
      if (scope === 'all') {
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

  const showFlash = useCallback((message: string) => setFlash(message), []);
  const clearFlash = useCallback(() => setFlash(null), []);

  const setDateLocalWithFeedback = useCallback((d: string) => {
    setDateLocal((prev) => {
      if (prev !== d) void feedbackDayChange();
      return d;
    });
  }, []);

  const performUndo = useCallback(() => {
    if (!undo) return;
    if (undo.entryIds && undo.entryIds.length > 0) {
      for (const id of undo.entryIds) {
        try {
          repo.softDeleteEntry(id);
        } catch {
          // Entry may already be gone — ignore.
        }
      }
    } else if (undo.entryId) {
      repo.undoDeleteEntry(undo.entryId);
    }
    setUndo(null);
    refresh('diary');
  }, [undo, repo, refresh]);

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
      flash,
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
      flash,
      showFlash,
      clearFlash,
    ],
  );

  return (
    <DataContext.Provider value={value}>
      <DiaryRevisionContext.Provider value={areas.diary}>
        <ActivityRevisionContext.Provider value={areas.activity}>
          <ProfileRevisionContext.Provider value={areas.profile}>
            <PlanRevisionContext.Provider value={areas.plan}>{children}</PlanRevisionContext.Provider>
          </ProfileRevisionContext.Provider>
        </ActivityRevisionContext.Provider>
      </DiaryRevisionContext.Provider>
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData requires DataProvider');
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
    useDiaryRevision() + useActivityRevision() + useProfileRevision() + usePlanRevision()
  );
}
