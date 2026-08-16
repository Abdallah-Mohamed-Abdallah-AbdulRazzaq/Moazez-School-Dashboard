// FILE: src/hooks/useResponsiveChart.ts

"use client";

import { useState, useEffect } from "react";

interface ChartDimensions {
  height: number;
  width: number;
  leftMargin: number;
  isMobile: boolean;
}

export function useResponsiveChart(): ChartDimensions {
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    height: 300,
    width: 400,
    leftMargin: 40,
    isMobile: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 640;
      setDimensions({
        height: isMobile ? 240 : 300,
        width: isMobile ? 280 : 400,
        leftMargin: isMobile ? 30 : 40,
        isMobile,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Update on resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return dimensions;
}
