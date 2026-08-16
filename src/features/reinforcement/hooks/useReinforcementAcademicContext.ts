"use client";

import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface ReinforcementAcademicContextResult {
  selectedAcademicYear: AcademicYear | null;
  selectedTerm: Term | null;
}

export function useReinforcementAcademicContext(): ReinforcementAcademicContextResult {
  const { selectedAcademicYear, selectedTerm } =
    useAcademicYearTermLayoutContext();

  return {
    selectedAcademicYear,
    selectedTerm,
  };
}
