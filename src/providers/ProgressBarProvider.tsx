"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { LinearProgress } from "@mui/material";

interface ProgressBarContextType {
  start: () => void;
  done: () => void;
  setProgress: (progress: number) => void;
}

const ProgressBarContext = createContext<ProgressBarContextType | undefined>(undefined);

export function useProgressBar() {
  const context = useContext(ProgressBarContext);
  if (!context) {
    throw new Error("useProgressBar must be used within ProgressBarProvider");
  }
  return context;
}

interface ProgressBarProviderProps {
  children: React.ReactNode;
}

export function ProgressBarProvider({ children }: ProgressBarProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  // Clear interval helper
  const clearProgressInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start progress
  const start = useCallback(() => {
    clearProgressInterval();
    setIsActive(true);
    setProgress(15);

    // Simulate loading progress
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearProgressInterval();
          return 90;
        }
        // Slow down as we approach 90%
        const increment = prev < 50 ? 10 : prev < 70 ? 5 : 2;
        return Math.min(prev + increment, 90);
      });
    }, 300);
  }, [clearProgressInterval]);

  // Complete progress
  const done = useCallback(() => {
    clearProgressInterval();
    setProgress(100);

    // Hide after animation completes
    setTimeout(() => {
      setIsActive(false);
      setProgress(0);
    }, 200);
  }, [clearProgressInterval]);

  // Manual progress setter
  const setProgressManual = useCallback((value: number) => {
    setProgress(Math.min(Math.max(value, 0), 100));
  }, []);

  // Auto-complete when pathname changes
  useEffect(() => {
    if (isActive) {
      // Small delay to avoid flicker
      const timer = setTimeout(() => {
        done();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [pathname, isActive, done]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
    };
  }, [clearProgressInterval]);

  return (
    <ProgressBarContext.Provider
      value={{
        start,
        done,
        setProgress: setProgressManual,
      }}
    >
      {/* Progress Bar */}
      {isActive && (
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{ height: "3px" }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: "3px",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "var(--primary-color, #036C80)",
                transition: "transform 0.2s ease",
              },
            }}
          />
        </div>
      )}
      {children}
    </ProgressBarContext.Provider>
  );
}
