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

export type DragSession = {
  meal: PlannedMeal;
  pointerX: number;
  pointerY: number;
  hover: DropTarget | null;
};

type ZoneBox = { x: number; y: number; width: number; height: number };

type PlanDragContextValue = {
  session: DragSession | null;
  beginDrag: (meal: PlannedMeal, x: number, y: number) => void;
  updatePointer: (x: number, y: number) => void;
  endDrag: () => DropTarget | null;
  cancelDrag: () => void;
  setSlotBox: (slot: MealSlot, box: ZoneBox | null) => void;
  setDayBox: (dateLocal: string, box: ZoneBox | null) => void;
  isHoveringSlot: (slot: MealSlot) => boolean;
  isHoveringDay: (dateLocal: string) => boolean;
};

const PlanDragContext = createContext<PlanDragContextValue | null>(null);

function contains(box: ZoneBox, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

export function PlanDragProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DragSession | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const slotBoxes = useRef<Map<MealSlot, ZoneBox>>(new Map());
  const dayBoxes = useRef<Map<string, ZoneBox>>(new Map());

  const resolveHover = useCallback((x: number, y: number): DropTarget | null => {
    // Days first (smaller targets at top), then slots.
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
      const s: DragSession = {
        meal,
        pointerX: x,
        pointerY: y,
        hover: resolveHover(x, y),
      };
      sessionRef.current = s;
      setSession(s);
    },
    [resolveHover],
  );

  const updatePointer = useCallback(
    (x: number, y: number) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const hover = resolveHover(x, y);
      const next = { ...prev, pointerX: x, pointerY: y, hover };
      sessionRef.current = next;
      setSession(next);
    },
    [resolveHover],
  );

  const endDrag = useCallback(() => {
    const hover = sessionRef.current?.hover ?? null;
    sessionRef.current = null;
    setSession(null);
    return hover;
  }, []);

  const cancelDrag = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
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
    (slot: MealSlot) => session?.hover?.kind === 'slot' && session.hover.slot === slot,
    [session],
  );

  const isHoveringDay = useCallback(
    (dateLocal: string) =>
      session?.hover?.kind === 'day' && session.hover.dateLocal === dateLocal,
    [session],
  );

  const value = useMemo(
    () => ({
      session,
      beginDrag,
      updatePointer,
      endDrag,
      cancelDrag,
      setSlotBox,
      setDayBox,
      isHoveringSlot,
      isHoveringDay,
    }),
    [
      session,
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
