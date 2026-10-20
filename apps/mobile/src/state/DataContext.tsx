import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { mealSlotForNow } from '../../../../src/domain/mealSlotForNow';
import type { FoodRepository } from '../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../src/storage/validation';
import type { MealSlot } from '../../../../src/storage/types';

type UndoState = { entryId: string; message: string } | null;

type DataContextValue = {
  repo: FoodRepository;
  dateLocal: string;
  setDateLocal: (d: string) => void;
  meal: MealSlot;
  setMeal: (m: MealSlot) => void;
  revision: number;
  refresh: () => void;
  undo: UndoState;
  setUndo: (u: UndoState) => void;
  performUndo: () => void;
  flash: string | null;
  showFlash: (message: string) => void;
  clearFlash: () => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({
  repo,
  children,
}: {
  repo: FoodRepository;
  children: React.ReactNode;
}) {
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const [dateLocal, setDateLocal] = useState(today);
  const [meal, setMeal] = useState<MealSlot>(() => mealSlotForNow());
  const [revision, setRevision] = useState(0);
  const [undo, setUndo] = useState<UndoState>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const showFlash = useCallback((message: string) => setFlash(message), []);
  const clearFlash = useCallback(() => setFlash(null), []);

  const performUndo = useCallback(() => {
    if (!undo) return;
    repo.undoDeleteEntry(undo.entryId);
    setUndo(null);
    refresh();
  }, [undo, repo, refresh]);

  const value = useMemo(
    () => ({
      repo,
      dateLocal,
      setDateLocal,
      meal,
      setMeal,
      revision,
      refresh,
      undo,
      setUndo,
      performUndo,
      flash,
      showFlash,
      clearFlash,
    }),
    [repo, dateLocal, meal, revision, refresh, undo, performUndo, flash, showFlash, clearFlash],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData requires DataProvider');
  return ctx;
}
