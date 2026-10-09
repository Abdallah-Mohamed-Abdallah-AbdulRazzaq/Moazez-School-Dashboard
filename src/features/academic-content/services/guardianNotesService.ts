import { listAcademicContent } from "./academicContentApi";
import type {
  AcademicContentListResponse,
  ListAcademicContentQuery,
} from "../types/contracts";

export function listGuardianNotes(
  query: Omit<ListAcademicContentQuery, "type" | "audience">,
): Promise<AcademicContentListResponse> {
  return listAcademicContent({
    ...query,
    type: "GUARDIAN_WEEKLY_NOTE",
    audience: "GUARDIANS",
  });
}
