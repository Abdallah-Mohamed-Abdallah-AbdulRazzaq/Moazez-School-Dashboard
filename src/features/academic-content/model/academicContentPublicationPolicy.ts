import type {
  AcademicContentAudience,
  AcademicContentPublication,
  AcademicContentPublicationStatus,
  AcademicContentType,
  CreateAcademicContentPublicationRequest,
} from "../types/contracts";

const EXTERNAL_PUBLICATION_TYPES = new Set<AcademicContentType>([
  "WEEKLY_PLAN",
  "GUARDIAN_WEEKLY_NOTE",
  "SUBJECT_RESOURCE",
  "ONLINE_SESSION",
  "GENERAL_RESOURCE",
]);

export interface PublicationDraft {
  mode: "now" | "schedule";
  publishAt: Date | null;
  visibleFrom: Date | null;
  visibleUntil: Date | null;
  notifyMinorUpdate: boolean;
}

export type PublicationDraftError =
  | "publish_at_required"
  | "publish_at_not_future"
  | "visible_from_before_publish"
  | "visible_until_before_visible_from";

export const PUBLICATION_BLOCKING_REASON_KEYS = {
  "publication.type_or_audience_unavailable": "type_or_audience_unavailable",
  "publication.source_status_unavailable": "source_status_unavailable",
  "publication.revision_strategy_unavailable": "revision_strategy_unavailable",
  "publication.authoring_incomplete": "authoring_incomplete",
  "publication.term_invalid": "term_invalid",
  "publication.term_ended": "term_ended",
  "publication.targets_missing": "targets_missing",
  "publication.type_detail_incomplete": "type_detail_incomplete",
  "publication.assets_invalid": "assets_invalid",
  "publication.active_publication_exists": "active_publication_exists",
  "publication.online_session_finished_or_missing":
    "online_session_finished_or_missing",
} as const;

export type PublicationBlockingReasonKey =
  | (typeof PUBLICATION_BLOCKING_REASON_KEYS)[keyof typeof PUBLICATION_BLOCKING_REASON_KEYS]
  | "unknown";

export function isPublicationSurfaceAvailable(
  type: AcademicContentType,
  audience: AcademicContentAudience,
): boolean {
  return (
    EXTERNAL_PUBLICATION_TYPES.has(type) && audience !== "INTERNAL_STAFF"
  );
}

export function publicationDraftFingerprint(draft: PublicationDraft): string {
  return JSON.stringify({
    mode: draft.mode,
    publishAt: draft.publishAt?.toISOString() ?? null,
    visibleFrom: draft.visibleFrom?.toISOString() ?? null,
    visibleUntil: draft.visibleUntil?.toISOString() ?? null,
    notifyMinorUpdate: draft.notifyMinorUpdate,
  });
}

export function publicationRequestFromDraft(
  draft: PublicationDraft,
  clientRequestId: string,
): CreateAcademicContentPublicationRequest {
  return {
    clientRequestId,
    notifyMinorUpdate: draft.notifyMinorUpdate,
    ...(draft.mode === "schedule" && draft.publishAt
      ? { publishAt: draft.publishAt.toISOString() }
      : {}),
    ...(draft.visibleFrom
      ? { visibleFrom: draft.visibleFrom.toISOString() }
      : {}),
    ...(draft.visibleUntil
      ? { visibleUntil: draft.visibleUntil.toISOString() }
      : {}),
  };
}

export function publicationBlockingReasonKey(
  reason: string,
): PublicationBlockingReasonKey {
  return (
    PUBLICATION_BLOCKING_REASON_KEYS[
      reason as keyof typeof PUBLICATION_BLOCKING_REASON_KEYS
    ] ?? "unknown"
  );
}

export function canUnschedulePublication(
  status: AcademicContentPublicationStatus,
): boolean {
  return status === "SCHEDULED";
}

export function canCancelPublication(
  status: AcademicContentPublicationStatus,
): boolean {
  return status === "PUBLISHED";
}

type PublicationLineageEntry = Pick<
  AcademicContentPublication,
  | "publicationId"
  | "status"
  | "publishedAt"
  | "cancellationReason"
  | "supersedesPublicationId"
>;

export function hasEligibleMinorUpdatePredecessor(
  publications: readonly PublicationLineageEntry[],
): boolean {
  const supersededPublicationIds = new Set(
    publications.flatMap(({ supersedesPublicationId }) =>
      supersedesPublicationId ? [supersedesPublicationId] : [],
    ),
  );
  return publications.some(
    (publication) =>
      publication.status === "CANCELLED" &&
      publication.cancellationReason === "REVISION_STARTED" &&
      publication.publishedAt !== null &&
      !supersededPublicationIds.has(publication.publicationId),
  );
}

function publicationScheduleErrors(
  draft: PublicationDraft,
  now: Date,
): PublicationDraftError[] {
  if (draft.mode !== "schedule") return [];
  if (!draft.publishAt) return ["publish_at_required"];
  return draft.publishAt <= now ? ["publish_at_not_future"] : [];
}

function publicationVisibilityErrors(
  draft: PublicationDraft,
  effectivePublishAt: Date | null,
): PublicationDraftError[] {
  if (
    effectivePublishAt &&
    draft.visibleFrom &&
    draft.visibleFrom < effectivePublishAt
  ) {
    return ["visible_from_before_publish"];
  }

  const visibilityStart = draft.visibleFrom ?? effectivePublishAt;
  return visibilityStart &&
    draft.visibleUntil &&
    draft.visibleUntil <= visibilityStart
      ? ["visible_until_before_visible_from"]
      : [];
}

export function validatePublicationDraft(
  draft: PublicationDraft,
  now: Date,
): PublicationDraftError[] {
  const effectivePublishAt = draft.mode === "schedule" ? draft.publishAt : now;
  return [
    ...publicationScheduleErrors(draft, now),
    ...publicationVisibilityErrors(draft, effectivePublishAt),
  ];
}
