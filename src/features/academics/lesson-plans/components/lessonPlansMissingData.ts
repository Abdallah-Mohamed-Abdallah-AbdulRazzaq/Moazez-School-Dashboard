export type LessonPlansMissingDataStatus =
  | "missing-grade"
  | "missing-section"
  | "missing-classroom"
  | "missing-subject"
  | "missing-teacher-allocation"
  | "missing-curriculum"
  | "no-curriculum-lessons"
  | "missing-timetable-slots";

export interface LessonPlansMissingDataScope {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
}

function setIfPresent(params: URLSearchParams, key: string, value?: string) {
  if (value) params.set(key, value);
}

function addStructureParent(
  params: URLSearchParams,
  nodeType: "stage" | "grade" | "section",
  nodeId?: string,
) {
  if (!nodeId) return;
  params.set("nodeType", nodeType);
  params.set("nodeId", nodeId);
}

type RouteConfig = {
  pathname: string;
  addScope: (
    params: URLSearchParams,
    scope: LessonPlansMissingDataScope,
  ) => void;
};

const addGradeParent = (
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) => addStructureParent(params, "stage", scope.stageId);
const addSectionParent = (
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) => addStructureParent(params, "grade", scope.gradeId);
const addClassroomParent = (
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) => addStructureParent(params, "section", scope.sectionId);

function addSubjectScope(params: URLSearchParams) {
  params.set("tab", "subjects");
}

function addAllocationScope(
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) {
  params.set("tab", "matrix");
  setIfPresent(params, "grade", scope.gradeId);
  setIfPresent(params, "section", scope.sectionId);
  setIfPresent(params, "classroom", scope.classroomId);
  setIfPresent(params, "subject", scope.subjectId);
}

function addCurriculumScope(
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) {
  setIfPresent(params, "filterGrade", scope.gradeId);
  setIfPresent(params, "filterSubject", scope.subjectId);
}

function addTimetableScope(
  params: URLSearchParams,
  scope: LessonPlansMissingDataScope,
) {
  setIfPresent(params, "grade", scope.gradeId);
  setIfPresent(params, "section", scope.sectionId);
  setIfPresent(params, "classroom", scope.classroomId);
}

const routeByStatus: Record<LessonPlansMissingDataStatus, RouteConfig> = {
  "missing-grade": {
    pathname: "/academics/structure",
    addScope: addGradeParent,
  },
  "missing-section": {
    pathname: "/academics/structure",
    addScope: addSectionParent,
  },
  "missing-classroom": {
    pathname: "/academics/structure",
    addScope: addClassroomParent,
  },
  "missing-subject": {
    pathname: "/academics/subjects",
    addScope: addSubjectScope,
  },
  "missing-teacher-allocation": {
    pathname: "/academics/teacher-allocation",
    addScope: addAllocationScope,
  },
  "missing-curriculum": {
    pathname: "/academics/curriculum",
    addScope: addCurriculumScope,
  },
  "no-curriculum-lessons": {
    pathname: "/academics/curriculum",
    addScope: addCurriculumScope,
  },
  "missing-timetable-slots": {
    pathname: "/academics/timetable",
    addScope: addTimetableScope,
  },
};

export function buildLessonPlansMissingDataHref(
  status: LessonPlansMissingDataStatus,
  locale: string,
  scope: LessonPlansMissingDataScope,
): string {
  const params = new URLSearchParams();
  setIfPresent(params, "year", scope.academicYearId);
  setIfPresent(params, "term", scope.termId);
  const route = routeByStatus[status];
  route.addScope(params, scope);
  const query = params.toString();
  return `/${locale}${route.pathname}${query ? `?${query}` : ""}`;
}
