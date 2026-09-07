import { apiGet, apiPut } from "@/lib/api";
import type {
  BackendAssessmentItemsListResponse,
  BackendGradesBootstrapResponse,
} from "../types/api.types";
import type {
  BulkGradeItemPayload,
  GradesFiltersData,
  UpdateGradeItemPayload,
} from "../../shared/types";
import {
  mapBootstrapToFiltersData,
  toBackendGradeItemStatus,
} from "../utils/gradebookMappers";

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
