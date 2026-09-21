"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface UseGradesRouteYearTermResult {
  academicYearId: string;
  termId: string;
  termName: string;
  termStatus: "open" | "closed";
  isInitializing: boolean;
}

export function useGradesRouteYearTerm(): UseGradesRouteYearTermResult {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const academicYearId = searchParams.get("year") || "";
  const termId = searchParams.get("term") || "";

  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [termName, setTermName] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadTermStatus = async () => {
      // Focused builder flows keep year/term in the route without rendering
      // the shared section ContextBar, so they only need lightweight term metadata.
      if (!academicYearId || !termId) {
        setTermName("");
        setTermStatus("open");
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      setTermName("");

      try {
        const terms = await fetchTermsByYear(academicYearId);
        if (isCancelled) {
          return;
        }

        const selectedTerm = terms.find((term: Term) => term.id === termId);
        setTermName(
          locale === "ar"
            ? selectedTerm?.nameAr || selectedTerm?.name || ""
            : selectedTerm?.nameEn || selectedTerm?.name || "",
        );
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
  }, [academicYearId, locale, termId]);

  return {
    academicYearId,
    termId,
    termName,
    termStatus,
    isInitializing,
  };
}
