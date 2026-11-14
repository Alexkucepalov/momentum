import { usePathname } from "expo-router";
import { FlashBar } from "./FlashBar";
import { UndoBar } from "./UndoBar";

/** One owner across tabs and nested routes; messages also survive navigation. */
export function FeedbackHost() {
  const path = usePathname();
  const hasFoodDock = path === "/" || path === "/food";
  const isTab =
    hasFoodDock || ["/activity", "/progress", "/profile"].includes(path);
  const bottomOffset = hasFoodDock ? 168 : isTab ? 96 : 20;
  return (
    <>
      <FlashBar bottomOffset={bottomOffset} />
      <UndoBar bottomOffset={bottomOffset} />
    </>
  );
}
