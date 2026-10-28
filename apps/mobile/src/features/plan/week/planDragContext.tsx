import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { MealSlot, PlannedMeal } from '../../../../../../src/storage/types';

export type DropTarget =
  | { kind: 'slot'; slot: MealSlot }
  | { kind: 'day'; dateLocal: string };

export type ZoneBox = { x: number; y: number; width: number; height: number };

type PlanDragContextValue = {
  /** Meal currently lifted; null when idle. */
  activeMeal: PlannedMeal | null;
  hover: DropTarget | null;
  beginDrag: (meal: PlannedMeal, x: number, y: number) => void;
  /** Updates hover only when the resolved target changes (no per-frame React state). */
  updatePointer: (x: number, y: number) => void;
  endDrag: () => DropTarget | null;
  cancelDrag: () => void;
  setSlotBox: (slot: MealSlot, box: ZoneBox | null) => void;
  setDayBox: (dateLocal: string, box: ZoneBox | null) => void;
  isHoveringSlot: (slot: MealSlot) => boolean;
  isHoveringDay: (dateLocal: string) => boolean;
  /** True while any drag is active — use to lock scroll. */
  dragging: boolean;
};

const PlanDragContext = createContext<PlanDragContextValue | null>(null);

function contains(box: ZoneBox, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

function targetKey(t: DropTarget | null): string {
  if (!t) return '';
  return t.kind === 'slot' ? `slot:${t.slot}` : `day:${t.dateLocal}`;
}

export function PlanDragProvider({ children }: { children: ReactNode }) {
  const [activeMeal, setActiveMeal] = useState<PlannedMeal | null>(null);
  const [hover, setHover] = useState<DropTarget | null>(null);
  const activeRef = useRef<PlannedMeal | null>(null);
  const hoverRef = useRef<DropTarget | null>(null);
  const slotBoxes = useRef<Map<MealSlot, ZoneBox>>(new Map());
  const dayBoxes = useRef<Map<string, ZoneBox>>(new Map());

  const resolveHover = useCallback((x: number, y: number): DropTarget | null => {
    for (const [dateLocal, box] of dayBoxes.current) {
      if (contains(box, x, y)) return { kind: 'day', dateLocal };
    }
    for (const [slot, box] of slotBoxes.current) {
      if (contains(box, x, y)) return { kind: 'slot', slot };
    }
    return null;
  }, []);

  const beginDrag = useCallback(
    (meal: PlannedMeal, x: number, y: number) => {
      const nextHover = resolveHover(x, y);
      activeRef.current = meal;
      hoverRef.current = nextHover;
      setActiveMeal(meal);
      setHover(nextHover);
    },
    [resolveHover],
  );

  const updatePointer = useCallback(
    (x: number, y: number) => {
      if (!activeRef.current) return;
      const next = resolveHover(x, y);
      if (targetKey(next) === targetKey(hoverRef.current)) return;
      hoverRef.current = next;
      setHover(next);
    },
    [resolveHover],
  );

  const endDrag = useCallback(() => {
    const result = hoverRef.current;
    activeRef.current = null;
    hoverRef.current = null;
    setActiveMeal(null);
    setHover(null);
    return result;
  }, []);

  const cancelDrag = useCallback(() => {
    activeRef.current = null;
    hoverRef.current = null;
    setActiveMeal(null);
    setHover(null);
  }, []);

  const setSlotBox = useCallback((slot: MealSlot, box: ZoneBox | null) => {
    if (!box) slotBoxes.current.delete(slot);
    else slotBoxes.current.set(slot, box);
  }, []);

  const setDayBox = useCallback((dateLocal: string, box: ZoneBox | null) => {
    if (!box) dayBoxes.current.delete(dateLocal);
    else dayBoxes.current.set(dateLocal, box);
  }, []);

  const isHoveringSlot = useCallback(
    (slot: MealSlot) => hover?.kind === 'slot' && hover.slot === slot,
    [hover],
  );

  const isHoveringDay = useCallback(
    (dateLocal: string) => hover?.kind === 'day' && hover.dateLocal === dateLocal,
    [hover],
  );

  const value = useMemo(
    () => ({
      activeMeal,
      hover,
      beginDrag,
      updatePointer,
      endDrag,
      cancelDrag,
      setSlotBox,
      setDayBox,
      isHoveringSlot,
      isHoveringDay,
      dragging: activeMeal != null,
    }),
    [
      activeMeal,
      hover,
      beginDrag,
      updatePointer,
      endDrag,
      cancelDrag,
      setSlotBox,
      setDayBox,
      isHoveringSlot,
      isHoveringDay,
    ],
  );

  return <PlanDragContext.Provider value={value}>{children}</PlanDragContext.Provider>;
}

export function usePlanDrag(): PlanDragContextValue {
  const ctx = useContext(PlanDragContext);
  if (!ctx) throw new Error('usePlanDrag requires PlanDragProvider');
  return ctx;
}
