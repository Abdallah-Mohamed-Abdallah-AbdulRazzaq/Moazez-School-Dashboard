import { apiGet } from "@/lib/api";
import type {
  AcademicContentListResponse,
  AcademicContentStatus,
  ListAcademicContentQuery,
} from "../types/contracts";

const BASE_PATH = "/academics/academic-content";

export function listTeacherPreparations(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse> {
  return apiGet<AcademicContentListResponse>(BASE_PATH, {
    params: { ...query, type: "TEACHER_PREPARATION" },
  });
}

export async function getTeacherPreparationCount(
  context: { academicYearId: string; termId: string },
  status?: AcademicContentStatus,
): Promise<number> {
  const response = await listTeacherPreparations({
    ...context,
    page: 1,
    limit: 1,
    status,
  });
  return response.total;
}
