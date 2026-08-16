"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import {
  useAcademicYearTermContext,
  type UseAcademicYearTermContextOptions,
  type UseAcademicYearTermContextResult,
} from "@/features/academics/hooks/useAcademicYearTermContext";

const GradesYearTermLayoutContext =
  createContext<UseAcademicYearTermContextResult | null>(null);

interface GradesYearTermLayoutProviderProps extends PropsWithChildren {
  options?: UseAcademicYearTermContextOptions;
}

export function GradesYearTermLayoutProvider({
  children,
  options,
}: GradesYearTermLayoutProviderProps) {
  // Workspace-style grades pages live under a visible section ContextBar,
  // so they can reuse the shared layout year/term controller directly.
  const value = useAcademicYearTermContext(options);

  return (
    <GradesYearTermLayoutContext.Provider value={value}>
      {children}
    </GradesYearTermLayoutContext.Provider>
  );
}

export function useGradesYearTermLayoutContext() {
  const context = useContext(GradesYearTermLayoutContext);

  if (!context) {
    throw new Error(
      "useGradesYearTermLayoutContext must be used within GradesYearTermLayoutProvider"
    );
  }

  return context;
}
