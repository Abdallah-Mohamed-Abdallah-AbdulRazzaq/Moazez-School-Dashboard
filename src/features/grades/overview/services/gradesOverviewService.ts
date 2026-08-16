import { apiGet } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type {
  BackendAssessmentsListResponse,
  BackendGradebookResponse,
  BackendGradeRuleResponse,
  BackendGradesOverviewResponse,
} from "../../gradebook/types/api.types";
import type {
  GradesScopeFilters,
  GradebookResponse,
  Assessment,
  ExamScopeType,
  GradeRule,
  StudentGradesSnapshot,
  BackendStudentGradeSnapshot,
} from "../../shared/types";
import {
  mapGradebookResponseToUi,
  mapBackendAssessmentToAssessment,
  mapBackendGradeRuleToUi,
} from "../../gradebook/utils/gradebookMappers";
import { mapBackendStudentGradeSnapshot } from "../utils/studentGradesSnapshotMapper";

function scopeIdParam(filters: GradesScopeFilters): string | undefined {
  return filters.scopeId || undefined;
}

export interface GradesOverviewReport {
  summary: {
    totalStudents: number;
    totalAssessments: number;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
    completionRate: number;
  };
  trend: Array<{ label: string; average: number }>;
  rule: { passMark: number } | null;
  emptyState: BackendGradesOverviewResponse["emptyState"];
}

export async function fetchGradesOverview(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
): Promise<GradesOverviewReport> {
  const response = await apiGet<BackendGradesOverviewResponse>("/grades/overview", {
    params: {
      academicYearId,
      termId,
      scopeType: filters.scopeType,
      scopeId: scopeIdParam(filters),
      subjectId: filters.subjectId,
    },
  });
  const totalGradeItems =
    response.completion.enteredCount +
    response.completion.missingCount +
    response.completion.absentCount;
  const completionRate = totalGradeItems > 0
    ? (response.completion.enteredCount / totalGradeItems) * 100
    : 0;

  return {
    summary: {
      totalStudents: response.totals.studentCount,
      totalAssessments: response.totals.assessmentCount,
      classAverage: response.performance.averagePercent ?? 0,
      highestAverage: response.performance.highestPercent ?? 0,
      lowestAverage: response.performance.lowestPercent ?? 0,
      completionRate,
    },
    trend: response.assessments.map((assessment) => ({
      label: assessment.title ?? assessment.date,
      average: assessment.averagePercent ?? 0,
    })),
    rule: response.rule ? { passMark: response.rule.passMark } : null,
    emptyState: response.emptyState,
  };
}

export async function fetchOverviewGradebook(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters
): Promise<GradebookResponse> {
  const data = await apiGet<BackendGradebookResponse>("/grades/gradebook", {
    params: {
      academicYearId,
      termId,
      scopeType: filters.scopeType,
      scopeId: scopeIdParam(filters),
      subjectId: filters.subjectId,
    },
  });
  return mapGradebookResponseToUi(data);
}

export async function fetchAssessments(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters
): Promise<Assessment[]> {
  const response = await apiGet<BackendAssessmentsListResponse>(
    "/grades/assessments",
    {
      params: {
        academicYearId,
        termId,
        scopeType: filters.scopeType,
        scopeId: scopeIdParam(filters),
        subjectId: filters.subjectId,
        approvalStatus: filters.includeDrafts ? undefined : "PUBLISHED",
        deliveryMode: filters.deliveryMode,
      },
    }
  );
  return response.items.map(mapBackendAssessmentToAssessment);
}

export async function fetchScopeGradeRule(
  academicYearId: string,
  termId: string,
  scopeType: ExamScopeType,
  scopeId: string
): Promise<GradeRule | null> {
  try {
    const data = await apiGet<BackendGradeRuleResponse>(
      "/grades/rules/effective",
      {
        params: {
          academicYearId,
          termId,
          scopeType,
          scopeId: scopeId || undefined,
        },
      }
    );
    return mapBackendGradeRuleToUi(data);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

export async function fetchStudentGradesSnapshot(
  studentId: string,
  options: { academicYearId: string; termId: string },
): Promise<StudentGradesSnapshot> {
  const response = await apiGet<BackendStudentGradeSnapshot>(
    `/grades/students/${studentId}/snapshot`,
    {
      params: options,
    },
  );

  return mapBackendStudentGradeSnapshot(response);
}
