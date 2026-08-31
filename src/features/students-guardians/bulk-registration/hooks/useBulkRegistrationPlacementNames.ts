"use client";

import { useEffect, useState } from "react";
import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type StructureTree,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { BulkRegistrationBatchPlacement } from "../api/bulkRegistrationDtos";
import type { BulkRegistrationPlacementNames } from "../components/BulkRegistrationBatchSummary";

type SupportedLocale = "ar" | "en";

function localizedName(
  record: { name: string; nameAr?: string; nameEn?: string },
  locale: SupportedLocale,
): string {
  return locale === "ar"
    ? record.nameAr || record.name || record.nameEn || ""
    : record.nameEn || record.name || record.nameAr || "";
}

function hierarchyNames(
  tree: StructureTree,
  classroomId: string,
  locale: SupportedLocale,
): Omit<BulkRegistrationPlacementNames, "academicYear" | "term"> | null {
  const classroom = tree.classrooms.find((entry) => entry.id === classroomId);
  const section = tree.sections.find((entry) => entry.id === classroom?.sectionId);
  const grade = tree.grades.find((entry) => entry.id === section?.gradeId);
  const stage = tree.stages.find((entry) => entry.id === grade?.stageId);
  if (!classroom || !section || !grade || !stage) return null;

  return {
    classroom: localizedName(classroom, locale),
    section: localizedName(section, locale),
    grade: localizedName(grade, locale),
    stage: localizedName(stage, locale),
  };
}

function structureTerm(terms: Term[], termId: string | null): Term | undefined {
  if (termId) return terms.find((term) => term.id === termId);
  return terms.find((term) => term.status === "open") || terms[0];
}

async function resolvePlacementNames(
  placement: BulkRegistrationBatchPlacement,
  locale: SupportedLocale,
): Promise<BulkRegistrationPlacementNames | null> {
  const [years, terms] = await Promise.all([
    fetchAcademicYears(),
    fetchTermsByYear(placement.academicYearId),
  ]);
  const year = years.find((entry) => entry.id === placement.academicYearId);
  const selectedTerm = structureTerm(terms, placement.termId);
  if (!year || !selectedTerm) return null;

  const tree = await fetchStructureTree(year.id, selectedTerm.id);
  const hierarchy = hierarchyNames(tree, placement.classroomId, locale);
  if (!hierarchy) return null;

  return {
    academicYear: localizedName(year, locale),
    term: placement.termId ? localizedName(selectedTerm, locale) : null,
    ...hierarchy,
  };
}

export function useBulkRegistrationPlacementNames(
  placement: BulkRegistrationBatchPlacement | null,
  locale: SupportedLocale,
): BulkRegistrationPlacementNames | null {
  const [resolved, setResolved] = useState<{
    key: string;
    names: BulkRegistrationPlacementNames | null;
  } | null>(null);
  const academicYearId = placement?.academicYearId;
  const classroomId = placement?.classroomId;
  const enrollmentDate = placement?.enrollmentDate;
  const termId = placement?.termId ?? null;
  const placementKey = [academicYearId, termId, classroomId, locale].join(":");

  useEffect(() => {
    if (!academicYearId || !classroomId || !enrollmentDate) return;

    let active = true;
    void resolvePlacementNames(
      { academicYearId, classroomId, enrollmentDate, termId },
      locale,
    ).then(
      (resolvedNames) => {
        if (active) setResolved({ key: placementKey, names: resolvedNames });
      },
      () => {
        if (active) setResolved({ key: placementKey, names: null });
      },
    );

    return () => {
      active = false;
    };
  }, [academicYearId, classroomId, enrollmentDate, locale, placementKey, termId]);

  return resolved?.key === placementKey ? resolved.names : null;
}
