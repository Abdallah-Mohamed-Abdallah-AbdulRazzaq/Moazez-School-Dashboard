import type { ApplicationStatusDto } from "../api/applicationDtos";
import type { ApplicationDocumentStatusDto } from "../api/applicationDocumentDtos";

const REVIEWABLE_APPLICATION_STATUSES = new Set<ApplicationStatusDto>([
  "submitted",
  "documents_pending",
  "under_review",
]);

export const canSubmitApplication = (status: ApplicationStatusDto, submittedAt: string | null) =>
  status === "documents_pending" && submittedAt === null;

export const canReviewApplicationDocument = (
  applicationStatus: ApplicationStatusDto,
  documentStatus: ApplicationDocumentStatusDto,
) => REVIEWABLE_APPLICATION_STATUSES.has(applicationStatus) && documentStatus === "pending_review";

export const canPrepareApplicationRegistration = (status: ApplicationStatusDto) =>
  status === "accepted";

