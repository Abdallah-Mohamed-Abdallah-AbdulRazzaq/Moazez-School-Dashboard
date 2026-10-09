import { listAcademicContent } from "./academicContentApi";
import type {
  AcademicContentListResponse,
  ListAcademicContentQuery,
} from "../types/contracts";

export function listSubjectResources(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse> {
  return listAcademicContent({ ...query, type: "SUBJECT_RESOURCE" });
}
