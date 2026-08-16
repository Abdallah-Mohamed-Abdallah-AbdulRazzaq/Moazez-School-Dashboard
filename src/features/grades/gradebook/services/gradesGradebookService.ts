import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  BackendAssessmentItemsListResponse,
  BackendGradesBootstrapResponse,
  BackendSubmissionDetailResponse,
  BackendSubmissionResolveResponse,
} from "../types/api.types";
import type {
  AssessmentSubmissionReview,
  BulkGradeItemPayload,
  GradesFiltersData,
  UpdateGradeItemPayload,
} from "../../shared/types";
import {
  mapBackendAssessmentToAssessment,
  mapBootstrapToFiltersData,
  mapSubmissionDetailToReview,
  toBackendGradeItemStatus,
} from "../utils/gradebookMappers";
import {
  finalizeSubmissionReview,
  reviewSubmissionAnswers,
  syncSubmissionGradeItem,
} from "../../submissions/services/gradesSubmissionsService";

// ── Filters / bootstrap ──────────────────────────────────────────────

export async function fetchGradesFiltersData(
  academicYearId: string,
  termId: string,
): Promise<GradesFiltersData> {
  const response = await apiGet<BackendGradesBootstrapResponse>(
    "/grades/bootstrap",
    { params: { academicYearId, termId } },
  );
  return mapBootstrapToFiltersData(response);
}

// ── Grade-item detail (comment lookup) ───────────────────────────────

export async function fetchGradeItemDetail(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<{ comment?: string } | null> {
  void academicYearId;
  void termId;
  const response = await apiGet<BackendAssessmentItemsListResponse>(
    `/grades/assessments/${assessmentId}/items`,
    { params: { includeMissingStudents: true } },
  );

  const items = response.items;
  const item = items.find((i) => i.studentId === studentId);
  if (!item) return null;

  return { comment: item.comment ?? undefined };
}

// ── Submission review (question-based assessment) ────────────────────

export async function fetchAssessmentSubmissionReview(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<AssessmentSubmissionReview> {
  void academicYearId;
  void termId;
  // Step 1: Resolve (or create) the submission for this student
  const resolved = await apiPost<BackendSubmissionResolveResponse>(
    `/grades/assessments/${assessmentId}/submissions/resolve`,
    { studentId },
  );

  // Step 2: Fetch the full submission detail (includes questions + answers)
  const detail = await apiGet<BackendSubmissionDetailResponse>(
    `/grades/submissions/${resolved.id}`,
  );

  // Step 3: Map the embedded assessment and build the review object
  const assessment = detail.assessment
    ? mapBackendAssessmentToAssessment({
        ...detail.assessment,
        titleEn: detail.assessment.titleEn ?? undefined,
        titleAr: detail.assessment.titleAr ?? undefined,
        maxScore: detail.assessment.maxScore ?? undefined,
      })
    : mapBackendAssessmentToAssessment({
        id: assessmentId,
        titleEn: "",
        titleAr: "",
      });

  return mapSubmissionDetailToReview(detail, assessment);
}

// ── Save submission correction ───────────────────────────────────────

export async function saveAssessmentSubmissionCorrection(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
  answers: Array<{
    answerId: string;
    awardedPoints: number | null;
    teacherComment?: string;
  }>,
): Promise<void> {
  void academicYearId;
  void termId;
  // Step 1: Resolve the submission
  const resolved = await apiPost<BackendSubmissionResolveResponse>(
    `/grades/assessments/${assessmentId}/submissions/resolve`,
    { studentId },
  );

  const submissionId = resolved.id;

  // Step 2: Save the reviewed answers
  await reviewSubmissionAnswers(
    submissionId,
    answers.map((answer) => ({
      answerId: answer.answerId,
      awardedPoints: answer.awardedPoints ?? 0,
      reviewerComment: answer.teacherComment ?? null,
    })),
  );

  // Step 3: Finalize the review
  await finalizeSubmissionReview(submissionId);

  // Step 4: Sync back to the grade item
  await syncSubmissionGradeItem(submissionId);
}

// ── Single grade-item update ─────────────────────────────────────────

export async function updateGradeItem(
  academicYearId: string,
  termId: string,
  payload: UpdateGradeItemPayload,
): Promise<void> {
  void academicYearId;
  void termId;
  const backendPayload = {
    status: toBackendGradeItemStatus(payload.status),
    score: payload.score,
    comment: payload.comment ?? null,
  };

  await apiPut(
    `/grades/assessments/${payload.assessmentId}/items/${payload.studentId}`,
    backendPayload,
  );
}

// ── Bulk grade-item update ───────────────────────────────────────────

export async function bulkUpdateGradeItems(
  assessmentId: string,
  items: BulkGradeItemPayload[],
  params?: { academicYearId?: string; termId?: string },
): Promise<void> {
  void params;
  const backendItems = items.map((item) => ({
    studentId: item.studentId,
    status: toBackendGradeItemStatus(item.status),
    score: item.score,
    comment: item.comment ?? null,
  }));

  await apiPut(`/grades/assessments/${assessmentId}/items`, { items: backendItems });
}
