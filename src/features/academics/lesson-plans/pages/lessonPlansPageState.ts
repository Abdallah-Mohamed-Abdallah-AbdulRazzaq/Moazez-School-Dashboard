import type { LessonPlansScopeStatus } from "../hooks/useLessonPlansData";
import type { LessonPlansMissingDataStatus } from "../components/lessonPlansMissingData";

export function canEditLessonPlans(input: {
  canManage: boolean;
  termStatus: string;
}) {
  return input.canManage && input.termStatus !== "closed";
}

export function canOpenAutoPlan(input: {
  canManage: boolean;
  canPreview: boolean;
}): boolean {
  return input.canManage && input.canPreview;
}

export type LessonPlansViewState =
  | "loading"
  | "no-selection"
  | "no-allocation"
  | "no-curriculum"
  | "no-weeks"
  | "no-lessons"
  | "ready";

const actionableScopeStatuses = new Set<LessonPlansScopeStatus>([
  "missing-grade",
  "missing-section",
  "missing-classroom",
  "missing-subject",
  "missing-teacher-allocation",
  "missing-curriculum",
]);

export function missingDataStatusForLessonPlansView(
  scopeStatus: LessonPlansScopeStatus,
  viewState: LessonPlansViewState,
): LessonPlansMissingDataStatus | null {
  if (actionableScopeStatuses.has(scopeStatus)) {
    return scopeStatus as LessonPlansMissingDataStatus;
  }
  if (viewState === "no-allocation") return "missing-teacher-allocation";
  if (viewState === "no-curriculum") return "missing-curriculum";
  if (viewState === "no-lessons") return "no-curriculum-lessons";
  return null;
}

export function resolveLessonPlansView(input: {
  loading: boolean;
  scopeResolved: boolean;
  dataChecked: boolean;
  selectedSectionId?: string;
  selectedSubjectId?: string;
  teacherSubjectAllocationId?: string;
  curriculumId?: string;
  weeks?: unknown[];
  lessons?: unknown[];
}): LessonPlansViewState {
  if (input.loading || !input.scopeResolved) return "loading";
  if (!input.selectedSectionId || !input.selectedSubjectId) {
    return "no-selection";
  }
  if (!input.teacherSubjectAllocationId) return "no-allocation";
  if (!input.curriculumId) return "no-curriculum";
  if (!input.dataChecked) return "loading";
  if ((input.weeks ?? []).length === 0) return "no-weeks";
  if ((input.lessons ?? []).length === 0) return "no-lessons";
  return "ready";
}
