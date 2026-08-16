"use client";

import { useCallback, useRef, useState } from "react";
import {
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface UseStructureCarryOverFlowParams {
  academicYearId: string;
  onCarryOver: (options: {
    fromYearId: string;
    fromTermId: string;
    copyCapacities: boolean;
    copyOrdering: boolean;
  }) => Promise<boolean>;
}

export function useStructureCarryOverFlow({
  academicYearId,
  onCarryOver,
}: UseStructureCarryOverFlowParams) {
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const [carryOverSourceYearId, setCarryOverSourceYearId] = useState("");
  const [carryOverSourceTermId, setCarryOverSourceTermId] = useState("");
  const [carryOverSourceTerms, setCarryOverSourceTerms] = useState<Term[]>([]);
  const [copyCapacities, setCopyCapacities] = useState(true);
  const [copyOrdering, setCopyOrdering] = useState(true);
  const [isCarryingOver, setIsCarryingOver] = useState(false);
  const loadTermsRequestIdRef = useRef(0);

  const loadSourceTerms = useCallback(async (yearId: string) => {
    const requestId = ++loadTermsRequestIdRef.current;
    const yearTerms = await fetchTermsByYear(yearId);
    if (requestId !== loadTermsRequestIdRef.current) {
      return;
    }
    setCarryOverSourceTerms(yearTerms);
    setCarryOverSourceTermId("");
  }, []);

  const openCarryOverDialog = useCallback(async () => {
    setShowCarryOverDialog(true);
    setCarryOverSourceYearId(academicYearId);
    await loadSourceTerms(academicYearId);
  }, [academicYearId, loadSourceTerms]);

  const closeCarryOverDialog = useCallback(() => {
    setShowCarryOverDialog(false);
    setCarryOverSourceTermId("");
    setCarryOverSourceTerms([]);
    loadTermsRequestIdRef.current += 1;
  }, []);

  const handleCarryOverSourceYearChange = useCallback(async (yearId: string) => {
    setCarryOverSourceYearId(yearId);
    await loadSourceTerms(yearId);
  }, [loadSourceTerms]);

  const submitCarryOver = useCallback(async () => {
    if (!carryOverSourceYearId || !carryOverSourceTermId) return;

    setIsCarryingOver(true);
    try {
      const carried = await onCarryOver({
        fromYearId: carryOverSourceYearId,
        fromTermId: carryOverSourceTermId,
        copyCapacities,
        copyOrdering,
      });
      if (carried) {
        setShowCarryOverDialog(false);
      }
    } catch (error) {
      console.error("Carry over submission failed:", error);
    } finally {
      setIsCarryingOver(false);
    }
  }, [
    carryOverSourceTermId,
    carryOverSourceYearId,
    copyCapacities,
    copyOrdering,
    onCarryOver,
  ]);

  return {
    showCarryOverDialog,
    carryOverSourceYearId,
    carryOverSourceTermId,
    carryOverSourceTerms,
    copyCapacities,
    copyOrdering,
    isCarryingOver,
    setCarryOverSourceTermId,
    setCopyCapacities,
    setCopyOrdering,
    openCarryOverDialog,
    closeCarryOverDialog,
    handleCarryOverSourceYearChange,
    submitCarryOver,
  };
}
