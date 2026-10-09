export function validDateOnlyFilter(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? value
    : "";
}

export const STAGE_FILTER_RESET = {
  gradeId: "",
  sectionId: "",
  classroomId: "",
} as const;

export const GRADE_FILTER_RESET = {
  sectionId: "",
  classroomId: "",
} as const;

export const SECTION_FILTER_RESET = { classroomId: "" } as const;

export function listAudienceOptions(
  type: AcademicContentType,
  label: (audience: AcademicContentAudience) => string,
) {
  return allowedAudiences(type).map((value) => ({
    value,
    label: label(value),
  }));
}
import type {
  AcademicContentAudience,
  AcademicContentType,
} from "../types/contracts";
import { allowedAudiences } from "./academicContentPolicy";
