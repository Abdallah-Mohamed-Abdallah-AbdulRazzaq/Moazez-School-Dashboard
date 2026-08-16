import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AbsenceRecord } from "../types";

type StructureLevel = "stage" | "grade" | "section" | "classroom";

export function getLocalizedStructureName(
  record: AbsenceRecord,
  tree: StructureTree | null,
  level: StructureLevel,
  locale: string,
): string {
  const isArabic = locale === "ar";
  const responseName = {
    stage: isArabic ? record.stageNameAr || record.stageNameEn : record.stageNameEn || record.stageNameAr,
    grade: isArabic ? record.gradeNameAr || record.gradeNameEn : record.gradeNameEn || record.gradeNameAr,
    section: isArabic ? record.sectionNameAr || record.sectionNameEn : record.sectionNameEn || record.sectionNameAr,
    classroom: isArabic ? record.classroomNameAr || record.classroomNameEn : record.classroomNameEn || record.classroomNameAr,
  }[level];

  if (responseName) return responseName;

  const id = record.scopeIds?.[`${level}Id` as keyof NonNullable<AbsenceRecord["scopeIds"]>];
  const items = tree?.[`${level}s` as keyof StructureTree] || [];
  const item = items.find((candidate) => candidate.id === id);
  return (isArabic ? item?.nameAr || item?.nameEn : item?.nameEn || item?.nameAr) || item?.name || "-";
}
