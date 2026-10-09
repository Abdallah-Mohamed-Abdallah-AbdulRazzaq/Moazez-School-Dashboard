import { listAcademicContent } from "./academicContentApi";
import type {
  AcademicContentAudience,
  AcademicContentListResponse,
  AcademicContentStatus,
  ListAcademicContentQuery,
} from "../types/contracts";

export async function listWeeklyPlans(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse> {
  return listAcademicContent({ ...query, type: "WEEKLY_PLAN" });
}

export async function getWeeklyPlanCount(
  context: { academicYearId: string; termId: string },
  status?: AcademicContentStatus,
  audience?: AcademicContentAudience,
): Promise<number> {
  const response = await listAcademicContent({
    ...context,
    type: "WEEKLY_PLAN",
    status,
    audience,
    page: 1,
    limit: 1,
  });
  return response.total;
}
