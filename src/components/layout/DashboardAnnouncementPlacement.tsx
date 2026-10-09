"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createPortal } from "react-dom";

interface AnnouncementPlacement {
  target: HTMLDivElement | null;
  setTarget: Dispatch<SetStateAction<HTMLDivElement | null>>;
}

const AnnouncementPlacementContext = createContext<AnnouncementPlacement | null>(null);

export function DashboardAnnouncementProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const placement = useMemo(() => ({ target, setTarget }), [target]);
  return (
    <AnnouncementPlacementContext.Provider value={placement}>
      {children}
    </AnnouncementPlacementContext.Provider>
  );
}

export function DashboardAnnouncementSlot() {
  const setTarget = useContext(AnnouncementPlacementContext)?.setTarget;
  const registerSlot = useCallback((element: HTMLDivElement | null) => {
    setTarget?.(element);
  }, [setTarget]);
  return setTarget ? <div ref={registerSlot} /> : null;
}

export function DashboardAnnouncementOutlet({ children }: { children: ReactNode }) {
  const placement = useContext(AnnouncementPlacementContext);
  return placement?.target ? createPortal(children, placement.target) : children;
}
