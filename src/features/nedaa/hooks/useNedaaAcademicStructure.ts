"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

export function useNedaaAcademicStructure() {
  const { academicYearId, termId, isInitializing } =
    useAcademicYearTermLayoutContext();
  const requestIdRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);
  const [tree, setTree] = useState<StructureTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    void Promise.resolve().then(async () => {
      if (isInitializing || !academicYearId || !termId) {
        if (requestId === requestIdRef.current) {
          setTree(null);
          setIsLoading(isInitializing);
          setError(null);
        }
        return;
      }

      setTree(null);
      setIsLoading(true);
      setError(null);
      try {
        const nextTree = await fetchStructureTree(academicYearId, termId);
        if (requestId === requestIdRef.current) setTree(nextTree);
      } catch (requestError) {
        if (requestId === requestIdRef.current) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "academic_structure_load_failed",
          );
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    });

    return () => {
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [academicYearId, isInitializing, retryKey, termId]);

  const retry = useCallback(() => setRetryKey((current) => current + 1), []);

  return { tree, isLoading, error, retry };
}
