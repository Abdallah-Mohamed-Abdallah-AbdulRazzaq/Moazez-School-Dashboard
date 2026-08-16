import type { Classroom, Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "./attendanceScope";

interface AttendanceScopePresentationParams {
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms?: Classroom[];
  locale: string;
  schoolLabel?: string;
  fallbackLabel?: string;
}

interface ScopePathItem {
  level: "school" | "stage" | "grade" | "section" | "classroom";
  label: string;
}

function getLocalizedName<T extends { nameAr?: string; nameEn?: string; name?: string }>(
  item: T | undefined,
  locale: string
) {
  if (!item) return undefined;
  if (locale === "ar") return item.nameAr || item.name || "";
  return item.nameEn || item.name || "";
}

export function getAttendanceScopePath({
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  classrooms = [],
  locale,
  schoolLabel,
  fallbackLabel = "-",
}: AttendanceScopePresentationParams): ScopePathItem[] {
  if (scopeType === "SCHOOL") {
    return [
      {
        level: "school",
        label: schoolLabel || (locale === "ar" ? "المدرسة" : "School"),
      },
    ];
  }

  const items: ScopePathItem[] = [];

  if (scopeIds?.stageId) {
    items.push({
      level: "stage",
      label: getLocalizedName(stages.find((item) => item.id === scopeIds.stageId), locale) || fallbackLabel,
    });
  }

  if (scopeIds?.gradeId) {
    items.push({
      level: "grade",
      label: getLocalizedName(grades.find((item) => item.id === scopeIds.gradeId), locale) || fallbackLabel,
    });
  }

  if (scopeIds?.sectionId) {
    items.push({
      level: "section",
      label: getLocalizedName(sections.find((item) => item.id === scopeIds.sectionId), locale) || fallbackLabel,
    });
  }

  if (scopeType === "CLASSROOM" && scopeIds?.classroomId) {
    items.push({
      level: "classroom",
      label: getLocalizedName(classrooms.find((item) => item.id === scopeIds.classroomId), locale) || fallbackLabel,
    });
  }

  return items;
}

export function getAttendanceScopeLabel(params: AttendanceScopePresentationParams): string {
  const path = getAttendanceScopePath(params);
  return path[path.length - 1]?.label || params.fallbackLabel || "-";
}
