"use client";

import { useEffect } from "react";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

interface UseGuardedAcademicContextChangeParams {
  hasUnsavedChanges: boolean;
  confirmDiscard: () => boolean | Promise<boolean>;
  onDiscard?: () => void;
}

export function useGuardedAcademicContextChange({
  hasUnsavedChanges,
  confirmDiscard,
  onDiscard,
}: UseGuardedAcademicContextChangeParams) {
  const {
    changeAcademicYear,
    changeTerm,
    setGuardHandlers,
  } = useAcademicYearTermLayoutContext();

  useEffect(() => {
    setGuardHandlers({
      onAcademicYearChange: async (yearId: string) => {
        if (hasUnsavedChanges && !(await confirmDiscard())) {
          return;
        }

        if (hasUnsavedChanges) {
          onDiscard?.();
        }

        await changeAcademicYear(yearId);
      },
      onTermChange: async (termId: string) => {
        if (hasUnsavedChanges && !(await confirmDiscard())) {
          return;
        }

        if (hasUnsavedChanges) {
          onDiscard?.();
        }

        changeTerm(termId);
      },
    });

    return () => {
      setGuardHandlers(null);
    };
  }, [
    changeAcademicYear,
    changeTerm,
    confirmDiscard,
    hasUnsavedChanges,
    onDiscard,
    setGuardHandlers,
  ]);
}
