"use client";

import { useEffect } from "react";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

interface UseAcademicContextBarActionsParams {
  onPromoteCarryOver?: () => void;
  showPromoteCarryOver?: boolean;
  disablePromoteCarryOver?: boolean;
  disableYearTermEditing?: boolean;
}

export function useAcademicContextBarActions(
  actions: UseAcademicContextBarActionsParams | null
) {
  const { setContextBarActions } = useAcademicYearTermLayoutContext();

  useEffect(() => {
    setContextBarActions(actions);

    return () => {
      setContextBarActions(null);
    };
  }, [actions, setContextBarActions]);
}
