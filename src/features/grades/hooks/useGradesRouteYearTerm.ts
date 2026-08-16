"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface UseGradesRouteYearTermResult {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  isInitializing: boolean;
}

export function useGradesRouteYearTerm(): UseGradesRouteYearTermResult {
  const searchParams = useSearchParams();
  const academicYearId = searchParams.get("year") || "";
  const termId = searchParams.get("term") || "";

  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadTermStatus = async () => {
      // Focused builder flows keep year/term in the route without rendering
      // the shared section ContextBar, so they only need lightweight term metadata.
      if (!academicYearId || !termId) {
        setTermStatus("open");
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);

      try {
        const terms = await fetchTermsByYear(academicYearId);
        if (isCancelled) {
          return;
        }

        const selectedTerm = terms.find((term: Term) => term.id === termId);
        setTermStatus(selectedTerm?.status || "open");
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    void loadTermStatus();

    return () => {
      isCancelled = true;
    };
  }, [academicYearId, termId]);

  return {
    academicYearId,
    termId,
    termStatus,
    isInitializing,
  };
}
