import { useState, useCallback, useEffect, useRef } from "react";

interface PanelConstraints {
  leftMin: number;
  leftMax: number;
  rightMin: number;
  rightMax: number;
  centerMin: number;
}

interface UseResizablePanelsProps {
  defaultLeftWidth: number;
  defaultRightWidth: number;
  constraints: PanelConstraints;
  storageKey: string;
  isRTL?: boolean;
}

interface PanelState {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  focusMode: boolean;
}

export function useResizablePanels({
  defaultLeftWidth,
  defaultRightWidth,
  constraints,
  storageKey,
  isRTL = false,
}: UseResizablePanelsProps) {
  // Load initial state from localStorage
  const loadState = (): PanelState => {
    if (typeof window === "undefined") return {
      leftWidth: defaultLeftWidth,
      rightWidth: defaultRightWidth,
      leftCollapsed: false,
      rightCollapsed: false,
      focusMode: false,
    };

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          leftWidth: parsed.leftWidth ?? defaultLeftWidth,
          rightWidth: parsed.rightWidth ?? defaultRightWidth,
          leftCollapsed: parsed.leftCollapsed ?? false,
          rightCollapsed: parsed.rightCollapsed ?? false,
          focusMode: parsed.focusMode ?? false,
        };
      }
    } catch (e) {
      console.error("Failed to load panel state:", e);
    }

    return {
      leftWidth: defaultLeftWidth,
      rightWidth: defaultRightWidth,
      leftCollapsed: false,
      rightCollapsed: false,
      focusMode: false,
    };
  };

  const [state, setState] = useState<PanelState>(loadState);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizingSide, setResizingSide] = useState<"left" | "right" | null>(
    null,
  );

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey]);

  const toggleLeftPanel = useCallback(() => {
    setState((prev) => ({ ...prev, leftCollapsed: !prev.leftCollapsed }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState((prev) => ({ ...prev, rightCollapsed: !prev.rightCollapsed }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      focusMode: !prev.focusMode,
      leftCollapsed: !prev.focusMode ? true : prev.leftCollapsed,
      rightCollapsed: !prev.focusMode ? true : prev.rightCollapsed,
    }));
  }, []);

  const handleResizeStart = useCallback((side: "left" | "right") => {
    setResizingSide(side);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleResizeMove = useCallback(
    (e: PointerEvent) => {
      if (!resizingSide || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;

      if (resizingSide === "left") {
        // Calculate new left width
        let newLeftWidth: number;
        if (isRTL) {
          // In RTL, left panel is visually on the right
          newLeftWidth = rect.right - e.clientX;
        } else {
          newLeftWidth = e.clientX - rect.left;
        }

        // Apply constraints
        newLeftWidth = Math.max(constraints.leftMin, Math.min(constraints.leftMax, newLeftWidth));

        // Ensure center has minimum width
        const availableForCenter = containerWidth - newLeftWidth - state.rightWidth;
        if (availableForCenter < constraints.centerMin) {
          newLeftWidth = containerWidth - constraints.centerMin - state.rightWidth;
        }

        setState((prev) => ({ ...prev, leftWidth: newLeftWidth }));
      } else if (resizingSide === "right") {
        // Calculate new right width
        let newRightWidth: number;
        if (isRTL) {
          // In RTL, right panel is visually on the left
          newRightWidth = e.clientX - rect.left;
        } else {
          newRightWidth = rect.right - e.clientX;
        }

        // Apply constraints
        newRightWidth = Math.max(constraints.rightMin, Math.min(constraints.rightMax, newRightWidth));

        // Ensure center has minimum width
        const availableForCenter = containerWidth - state.leftWidth - newRightWidth;
        if (availableForCenter < constraints.centerMin) {
          newRightWidth = containerWidth - constraints.centerMin - state.leftWidth;
        }

        setState((prev) => ({ ...prev, rightWidth: newRightWidth }));
      }
    },
    [constraints, state.leftWidth, state.rightWidth, isRTL, resizingSide],
  );

  const resizeLeftBy = useCallback(
    (delta: number) => {
      setState((previous) => {
        const containerWidth =
          containerRef.current?.getBoundingClientRect().width;
        const centerSafeMaximum = containerWidth
          ? containerWidth - constraints.centerMin - previous.rightWidth
          : constraints.leftMax;
        const maximumWidth = Math.min(constraints.leftMax, centerSafeMaximum);

        return {
          ...previous,
          leftWidth: Math.max(
            constraints.leftMin,
            Math.min(maximumWidth, previous.leftWidth + delta),
          ),
        };
      });
    },
    [constraints.centerMin, constraints.leftMax, constraints.leftMin],
  );

  const handleResizeEnd = useCallback(() => {
    setResizingSide(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    const handleMove = (e: PointerEvent) => handleResizeMove(e);
    const handleEnd = () => handleResizeEnd();

    if (resizingSide) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleEnd);
      window.addEventListener("pointercancel", handleEnd);

      return () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleEnd);
        window.removeEventListener("pointercancel", handleEnd);
      };
    }
  }, [handleResizeMove, handleResizeEnd, resizingSide]);

  return {
    state,
    containerRef,
    toggleLeftPanel,
    toggleRightPanel,
    toggleFocusMode,
    handleResizeStart,
    resizeLeftBy,
  };
}
