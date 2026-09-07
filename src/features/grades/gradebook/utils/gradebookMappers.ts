import type {
  BackendApprovalStatus,
  BackendAssessmentResponse,
  BackendGradebookCell,
  BackendGradebookColumn,
  BackendGradebookResponse,
  BackendGradebookRow,
  BackendGradeItemStatus,
  BackendGradeItemStatusPayload,
  BackendGradeRuleResponse,
  BackendGradesBootstrapResponse,
  BackendNamedEntity,
  BackendAssessmentRosterItem,
} from "../types/api.types";
import type {
  Assessment,
  AssessmentRosterItem,
  AssessmentTrendPoint,
  ExamScopeType,
  GradebookStudentRow,
  GradeItemStatus,
  GradeRule,
  GradesFiltersData,
  GradesPageSummary,
  GradebookResponse,
  ScopeEntityOption,
  ScopeOption,
  AssessmentDeliveryMode,
} from "../../shared/types";

// ── Name resolution ──────────────────────────────────────────────────

export function resolveEntityName(
  entity: BackendNamedEntity,
): { name: string; nameAr: string; nameEn: string } {
  return {
    name: entity.name || entity.title || entity.nameEn || entity.titleEn || entity.nameAr || entity.titleAr || "",
    nameAr: entity.nameAr || entity.titleAr || entity.name || entity.title || "",
    nameEn: entity.nameEn || entity.titleEn || entity.name || entity.title || "",
  };
}

// ── Status mappers ───────────────────────────────────────────────────

const FRONTEND_TO_BACKEND_STATUS: Record<GradeItemStatus, BackendGradeItemStatusPayload> = {
  entered: "ENTERED",
  missing: "MISSING",
  absent: "ABSENT",
};

const BACKEND_TO_FRONTEND_STATUS: Record<BackendGradeItemStatus, GradeItemStatus> = {
  entered: "entered",
  missing: "missing",
  absent: "absent",
};

export function toBackendGradeItemStatus(status: GradeItemStatus): BackendGradeItemStatusPayload {
  return FRONTEND_TO_BACKEND_STATUS[status] ?? "MISSING";
}

export function fromBackendGradeItemStatus(status: BackendGradeItemStatus | null | undefined): GradeItemStatus {
  if (!status) return "missing";
  return BACKEND_TO_FRONTEND_STATUS[status] ?? "missing";
}

const BACKEND_TO_FRONTEND_APPROVAL: Record<BackendApprovalStatus, Assessment["approvalStatus"]> = {
  draft: "draft",
  published: "published",
  approved: "approved",
};

export function fromBackendApprovalStatus(
  status: BackendApprovalStatus | null | undefined,
): Assessment["approvalStatus"] {
  if (!status) return "draft";
  return BACKEND_TO_FRONTEND_APPROVAL[status] ?? "draft";
}

function fromBackendDeliveryMode(
  deliveryMode: string | null | undefined,
): AssessmentDeliveryMode {
  return deliveryMode?.toLowerCase() === "question_based"
    ? "QUESTION_BASED"
    : "SCORE_ONLY";
}

// ── Bootstrap → FiltersData ──────────────────────────────────────────

function mapNamedEntitiesToScopeEntities(
  entities: BackendNamedEntity[] | undefined,
  scopeType: ExamScopeType,
): ScopeEntityOption[] {
  return (entities ?? []).map((entity) => {
    const names = resolveEntityName(entity);
    return {
      id: entity.id,
      name: names.name,
      nameAr: names.nameAr,
      nameEn: names.nameEn,
      scopeType,
      parentId: entity.parentId
        ?? (scopeType === "grade" ? entity.stageId : scopeType === "section" ? entity.gradeId : scopeType === "classroom" ? entity.sectionId : undefined)
        ?? undefined,
    };
  });
}

function mapNamedEntitiesToScopeOptions(
  entities: BackendNamedEntity[] | undefined,
): ScopeOption[] {
  return (entities ?? []).map((entity) => {
    const names = resolveEntityName(entity);
    return {
      id: entity.id,
      name: names.name,
      nameAr: names.nameAr,
      nameEn: names.nameEn,
    };
  });
}

function wholeSchoolScopeEntity(): ScopeEntityOption {
  return {
    id: "",
    name: "Whole School",
    nameAr: "المدرسة بالكامل",
    nameEn: "Whole School",
    scopeType: "school",
  };
}

export function mapBootstrapToFiltersData(
  response: BackendGradesBootstrapResponse,
): GradesFiltersData {
  const scopeTypes = response.supportedScopes ?? ["school", "stage", "grade", "section", "classroom"];

  const stages = mapNamedEntitiesToScopeEntities(response.stages, "stage");
  const grades = mapNamedEntitiesToScopeEntities(response.grades, "grade");
  const sections = mapNamedEntitiesToScopeEntities(response.sections, "section");
  const classrooms = mapNamedEntitiesToScopeEntities(response.classrooms, "classroom");

  const scopeEntities: Record<ExamScopeType, ScopeEntityOption[]> = {
    school: [wholeSchoolScopeEntity()],
    stage: stages,
    grade: grades,
    section: sections,
    classroom: classrooms,
  };

  return {
    scopeTypes,
    scopeEntities,
    stages,
    grades,
    sections,
    classrooms,
    subjects: mapNamedEntitiesToScopeOptions(response.subjects),
  };
}

// ── Gradebook column → Assessment ────────────────────────────────────

export function mapBackendColumnToAssessment(column: BackendGradebookColumn): Assessment {
  const names = resolveEntityName({
    id: column.assessmentId,
    title: column.title,
    titleAr: column.titleAr,
    titleEn: column.titleEn,
  });

  return {
    id: column.assessmentId,
    termId: "",
    subjectId: column.subjectId ?? column.subject?.id ?? "",
    scopeType: column.scopeType ?? "school",
    scopeId: column.scopeId ?? "",
    stageId: column.stageId ?? undefined,
    gradeId: column.gradeId ?? undefined,
    sectionId: column.sectionId ?? undefined,
    classroomId: column.classroomId ?? undefined,
    title: names.nameEn || names.name,
    titleAr: names.nameAr || names.name,
    type: column.type ?? "QUIZ",
    deliveryMode: fromBackendDeliveryMode(column.deliveryMode),
    date: column.date ?? "",
    weight: column.weight ?? 0,
    maxScore: column.maxScore ?? 0,
    expectedTimeMinutes: column.expectedTimeMinutes ?? undefined,
    isLocked: column.isLocked ?? false,
    approvalStatus: fromBackendApprovalStatus(column.approvalStatus),
  };
}

// ── BackendAssessmentResponse → Assessment ───────────────────────────

export function mapBackendAssessmentToAssessment(item: BackendAssessmentResponse): Assessment {
  const names = resolveEntityName({
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    titleEn: item.titleEn,
  });

  return {
    id: item.id,
    academicYearId: item.academicYearId,
    termId: item.termId ?? "",
    subjectId: item.subjectId ?? item.subject?.id ?? "",
    scopeType: item.scopeType ?? "school",
    scopeId: (item.scopeType ?? "school") === "school" ? "" : item.scopeId ?? "",
    scopeKey: item.scopeKey,
    stageId: item.stageId ?? undefined,
    gradeId: item.gradeId ?? undefined,
    sectionId: item.sectionId ?? undefined,
    classroomId: item.classroomId ?? undefined,
    title: names.nameEn || names.name,
    titleAr: names.nameAr || names.name,
    type: item.type ?? "QUIZ",
    deliveryMode: fromBackendDeliveryMode(item.deliveryMode),
    date: item.date ?? "",
    weight: item.weight ?? 0,
    maxScore: item.maxScore ?? 0,
    expectedTimeMinutes: item.expectedTimeMinutes ?? undefined,
    isLocked: item.isLocked ?? false,
    approvalStatus: fromBackendApprovalStatus(item.approvalStatus),
  };
}

// ── Gradebook row → GradebookStudentRow ──────────────────────────────

export function mapBackendRowToStudentRow(
  row: BackendGradebookRow,
  columns: BackendGradebookColumn[],
): GradebookStudentRow {
  const studentName =
    row.student?.nameEn ||
    [row.student?.firstName, row.student?.lastName].filter(Boolean).join(" ") ||
    "";
  const studentNameAr = row.student?.nameAr || studentName;
  const studentNameEn = row.student?.nameEn || studentName;

  const scoresByAssessmentId: Record<string, number | null> = {};
  const statusByAssessmentId: Record<string, GradeItemStatus> = {};
  const cellDetailsByAssessmentId: GradebookStudentRow["cellDetailsByAssessmentId"] = {};

  const cellsByAssessmentId = new Map<string, BackendGradebookCell>();
  if (row.cells) {
    for (const cell of row.cells) {
      cellsByAssessmentId.set(cell.assessmentId, cell);
    }
  }

  let completedItems = 0;
  const totalItems = columns.length;

  for (const column of columns) {
    const assessmentId = column.assessmentId;
    const cell = cellsByAssessmentId.get(assessmentId);

    if (cell) {
      scoresByAssessmentId[assessmentId] = cell.score ?? null;
      statusByAssessmentId[assessmentId] = fromBackendGradeItemStatus(cell.status);
      cellDetailsByAssessmentId[assessmentId] = {
        itemId: cell.itemId ?? null,
        percent: cell.percent ?? null,
        weightedContribution: cell.weightedContribution ?? null,
        comment: cell.comment ?? null,
        isVirtualMissing: cell.isVirtualMissing ?? false,
      };
      if (cell.status === "entered") completedItems++;
    } else {
      scoresByAssessmentId[assessmentId] = null;
      statusByAssessmentId[assessmentId] = "missing";
      cellDetailsByAssessmentId[assessmentId] = {
        itemId: null,
        percent: null,
        weightedContribution: null,
        comment: null,
        isVirtualMissing: false,
      };
    }
  }

  return {
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    studentNameEn,
    studentNameAr,
    studentCode: row.student?.code ?? null,
    admissionNo: row.student?.admissionNo ?? null,
    classroomName: undefined,
    status: row.status,
    scoresByAssessmentId,
    statusByAssessmentId,
    cellDetailsByAssessmentId,
    average: row.finalPercent ?? 0,
    completedWeight: row.completedWeight ?? null,
    completedItems: row.totalEnteredCount ?? completedItems,
    totalItems,
    missingCount: row.missingCount ?? 0,
    absentCount: row.absentCount ?? 0,
  };
}

// ── Full gradebook response → UI ─────────────────────────────────────

export function mapGradebookResponseToUi(response: BackendGradebookResponse): GradebookResponse {
  const columns = response.columns ?? [];
  const backendRows = response.rows ?? [];
  const backendSummary = response.summary;

  const assessments = columns.map(mapBackendColumnToAssessment);
  const rows = backendRows.map((row) => mapBackendRowToStudentRow(row, columns));

  const summary: GradesPageSummary = {
    totalStudents: backendSummary?.studentCount ?? rows.length,
    totalAssessments: backendSummary?.assessmentCount ?? columns.length,
    classAverage: backendSummary?.averagePercent ?? 0,
    highestAverage: 0,
    lowestAverage: 0,
    completionRate: backendSummary?.studentCount
      ? Math.round(
          ((backendSummary.studentCount - (backendSummary.incompleteCount ?? 0)) /
            backendSummary.studentCount) *
            1000,
        ) / 10
      : 0,
    passingCount: backendSummary?.passingCount ?? 0,
    failingCount: backendSummary?.failingCount ?? 0,
    incompleteCount: backendSummary?.incompleteCount ?? 0,
  };

  // Derive trend from columns + rows: for each assessment, compute the class average
  const trend: AssessmentTrendPoint[] = columns.map((column) => {
    const assessmentId = column.assessmentId;
    const colNames = resolveEntityName({
      id: column.assessmentId,
      title: column.title,
      titleAr: column.titleAr,
      titleEn: column.titleEn,
    });

    let totalScore = 0;
    let enteredCount = 0;

    for (const row of backendRows) {
      const cell = row.cells?.find((c) => c.assessmentId === assessmentId);
      if (cell?.status === "entered" && cell.score != null) {
        totalScore += cell.score;
        enteredCount++;
      }
    }

    const maxScore = column.maxScore ?? 0;
    const average = enteredCount > 0 && maxScore > 0
      ? Math.round(((totalScore / enteredCount) / maxScore) * 1000) / 10
      : 0;

    return {
      assessmentId,
      label: colNames.nameEn || colNames.name,
      date: column.date ?? "",
      average,
      weight: column.weight ?? 0,
      enteredCount,
      maxScore,
    };
  });

  return {
    assessments,
    rows,
    summary,
    trend,
    context: {
      academicYearId: response.academicYearId,
      yearId: response.yearId,
      termId: response.termId,
      subjectId: response.subjectId,
      scope: response.scope,
    },
    rule: response.rule
      ? {
        id: response.rule.ruleId ?? null,
        source: response.rule.source,
        passMark: response.rule.passMark ?? null,
        gradingScale: response.rule.gradingScale,
        rounding: response.rule.rounding,
      }
      : null,
  };
}

// ── Grade rule mapping ───────────────────────────────────────────────

export function mapBackendGradeRuleToUi(
  response: BackendGradeRuleResponse | null | undefined,
): GradeRule | null {
  if (!response) return null;
  return {
    id: response.ruleId ?? response.id ?? "",
    scopeType: (response.scopeType as GradeRule["scopeType"]) ?? "school",
    scopeId: response.scopeId ?? "",
    gradingScale: "percentage",
    passMark: response.passMark ?? 50,
    rounding:
      response.rounding?.toLowerCase() === "none"
        ? "none"
        : response.rounding?.toLowerCase() === "decimal_0"
          ? "decimal_0"
          : response.rounding?.toLowerCase() === "decimal_2"
            ? "decimal_2"
            : "decimal_1",
  };
}

// ── Roster item mapping ──────────────────────────────────────────────

export function mapBackendRosterItemToUi(item: BackendAssessmentRosterItem): AssessmentRosterItem {
  return {
    studentId: item.studentId,
    studentNameEn: item.student?.nameEn ?? item.student?.fullName ?? "",
    studentNameAr: item.student?.nameAr ?? item.student?.nameEn ?? item.student?.fullName ?? "",
    classroomName: undefined,
    score: item.score ?? null,
    status: fromBackendGradeItemStatus(item.status),
    comment: item.comment ?? undefined,
  };
}
