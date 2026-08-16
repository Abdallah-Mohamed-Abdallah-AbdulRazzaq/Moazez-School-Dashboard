"use client";

import { useEffect, useState } from "react";
import {
  fetchStructureTree,
  fetchTermsByYear,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface AdmissionGradeReference {
  requestedAcademicYearId?: string | null;
  requestedGradeId?: string | null;
}

const emptyGradeLabels = new Map<string, string>();

async function loadYearGradeLabels(yearId: string, locale: string) {
  const terms = await fetchTermsByYear(yearId);
  const term = terms.find((candidate) => candidate.status === "open") ?? terms[0];
  if (!term) return new Map<string, string>();

  const structure = await fetchStructureTree(yearId, term.id);
  return new Map(
    structure.grades.map((grade) => [
      grade.id,
      locale === "ar"
        ? grade.nameAr || grade.name
        : grade.nameEn || grade.name,
    ]),
  );
}

export function useAdmissionsGradeLabels(
  references: AdmissionGradeReference[],
  locale: string,
) {
  const [resolvedLabels, setResolvedLabels] = useState<{
    yearsKey: string;
    labels: Map<string, string>;
  }>({ yearsKey: "", labels: emptyGradeLabels });
  const yearIds = Array.from(
    new Set(
      references
        .filter((reference) => reference.requestedGradeId)
        .map((reference) => reference.requestedAcademicYearId)
        .filter((yearId): yearId is string => Boolean(yearId)),
    ),
  );
  const yearsKey = yearIds.slice().sort().join("|");

  useEffect(() => {
    if (!yearsKey) return;

    let cancelled = false;
    void Promise.all(
      yearsKey.split("|").map(async (yearId) => {
        try {
          return await loadYearGradeLabels(yearId, locale);
        } catch (error) {
          console.error(`Failed to load grade labels for year ${yearId}:`, error);
          return new Map<string, string>();
        }
      }),
    ).then((yearLabels) => {
      if (cancelled) return;
      setResolvedLabels({
        yearsKey,
        labels: new Map(yearLabels.flatMap((gradeLabels) => [...gradeLabels])),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, yearsKey]);

  return resolvedLabels.yearsKey === yearsKey
    ? resolvedLabels.labels
    : emptyGradeLabels;
}
