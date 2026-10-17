import { type RefObject, useEffect, useState } from "react";

import { createFocusTrap } from "@/lib/accessibility/focusTrap";

export function useTimetableFocusMode(
  workspaceRef: RefObject<HTMLElement | null>,
) {
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    if (!focusMode) return;
    const releaseFocus = workspaceRef.current
      ? createFocusTrap(workspaceRef.current)
      : undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (
        event.target instanceof Node &&
        event.target !== document.body &&
        !workspaceRef.current?.contains(event.target)
      )
        return;
      if (
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]',
        )
      )
        return;
      setFocusMode(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => {
      releaseFocus?.();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", exitOnEscape);
    };
  }, [focusMode, workspaceRef]);
  return { focusMode, setFocusMode };
}
