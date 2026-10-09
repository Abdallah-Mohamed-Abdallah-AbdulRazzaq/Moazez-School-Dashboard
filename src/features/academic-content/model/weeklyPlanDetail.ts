import type {
  AcademicContentWeeklyPlanDetail,
  ReplaceAcademicContentWeeklyPlanDetailRequest,
} from "../types/contracts";

export const WEEKLY_PLAN_PANELS = [
  "details",
  "targets",
  "objectives",
  "topics",
  "homework",
  "assessments",
  "notes",
  "resources",
  "readiness",
  "publication",
  "revisions",
] as const;

export type WeeklyPlanPanel = (typeof WEEKLY_PLAN_PANELS)[number];
export type WeeklyPlanValidationError =
  "dates_required" | "date_order" | "term_bounds" | "empty_items";

export interface WeeklyPlanTermBounds {
  startDate: string;
  endDate: string;
}

export function emptyWeeklyPlanDetail(
  termStartDate = "",
): AcademicContentWeeklyPlanDetail {
  return {
    weekStartDate: termStartDate,
    weekEndDate: termStartDate,
    objectives: [],
    topics: [],
    expectedHomework: null,
    upcomingAssessments: null,
    notes: null,
    homeworkAssignmentIds: [],
    gradeAssessmentIds: [],
  };
}

function normalizedText(value: string | null): string | null {
  return value?.trim() || null;
}

function normalizedRows(rows: string[]): string[] {
  return rows.map((row) => row.trim()).filter(Boolean);
}

export function normalizeWeeklyPlanDetail(
  detail: AcademicContentWeeklyPlanDetail,
): ReplaceAcademicContentWeeklyPlanDetailRequest {
  return {
    weekStartDate: detail.weekStartDate,
    weekEndDate: detail.weekEndDate,
    objectives: normalizedRows(detail.objectives),
    topics: normalizedRows(detail.topics),
    expectedHomework: normalizedText(detail.expectedHomework),
    upcomingAssessments: normalizedText(detail.upcomingAssessments),
    notes: normalizedText(detail.notes),
    homeworkAssignmentIds: [...new Set(detail.homeworkAssignmentIds)],
    gradeAssessmentIds: [...new Set(detail.gradeAssessmentIds)],
  };
}

function isValidDateOnly(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

export function validateWeeklyPlanDetail(
  detail: AcademicContentWeeklyPlanDetail,
  termBounds?: WeeklyPlanTermBounds,
): WeeklyPlanValidationError | null {
  if (
    !isValidDateOnly(detail.weekStartDate) ||
    !isValidDateOnly(detail.weekEndDate)
  ) {
    return "dates_required";
  }
  if (detail.weekStartDate > detail.weekEndDate) return "date_order";
  if (
    termBounds &&
    (detail.weekStartDate < termBounds.startDate ||
      detail.weekEndDate > termBounds.endDate)
  ) {
    return "term_bounds";
  }
  return [...detail.objectives, ...detail.topics].some((row) => !row.trim())
    ? "empty_items"
    : null;
}
