"use client";

import { useEffect, useState } from "react";

const OVERLAY_BREAKPOINT = "(max-width: 1279px)";

export default function useHeroJourneyOverlayMode() {
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(OVERLAY_BREAKPOINT);

    const updateOverlayMode = () => {
      setIsOverlayMode(mediaQuery.matches);
    };

    updateOverlayMode();
    mediaQuery.addEventListener("change", updateOverlayMode);

    return () => {
      mediaQuery.removeEventListener("change", updateOverlayMode);
    };
  }, []);

  return isOverlayMode;
}
