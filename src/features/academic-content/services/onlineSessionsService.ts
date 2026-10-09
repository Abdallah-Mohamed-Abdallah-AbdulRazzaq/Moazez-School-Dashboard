import { listAcademicContent } from "./academicContentApi";
import type {
  AcademicContentListResponse,
  ListAcademicContentQuery,
} from "../types/contracts";

export function listOnlineSessions(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse> {
  return listAcademicContent({ ...query, type: "ONLINE_SESSION" });
}
