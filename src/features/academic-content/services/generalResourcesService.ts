import type {
  AcademicContentListResponse,
  ListAcademicContentQuery,
} from "../types/contracts";
import { listAcademicContent } from "./academicContentApi";

export function listGeneralResources(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse> {
  return listAcademicContent({ ...query, type: "GENERAL_RESOURCE" });
}
