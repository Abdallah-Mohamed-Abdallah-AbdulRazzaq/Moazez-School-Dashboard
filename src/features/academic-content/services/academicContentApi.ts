import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type {
  AcademicContentApprovalHistoryResponse,
  AcademicContentAssetUnlinkResponse,
  AcademicContentBase,
  AcademicContentDeleteResponse,
  AcademicContentDetail,
  AcademicContentFilePolicy,
  AcademicContentGuardianNoteDetail,
  AcademicContentLinkInput,
  AcademicContentLinksResponse,
  AcademicContentListResponse,
  AcademicContentOnlineSessionDetail,
  AcademicContentPaginationQuery,
  AcademicContentPreparationDetail,
  AcademicContentPreparationTemplateDeleteResponse,
  AcademicContentPreparationTemplateDetail,
  AcademicContentPreparationTemplateListResponse,
  AcademicContentReadinessResponse,
  AcademicContentReviewQueueQuery,
  AcademicContentReviewQueueResponse,
  AcademicContentRevisionDetail,
  AcademicContentRevisionListResponse,
  AcademicContentSubjectResourceDetail,
  AcademicContentTagInput,
  AcademicContentTagsResponse,
  AcademicContentTargetDraft,
  AcademicContentTargetsResponse,
  AcademicContentTransitionResponse,
  AcademicContentUploadCancelResponse,
  AcademicContentUploadCompleteResponse,
  AcademicContentUploadIntentResponse,
  AcademicContentWeeklyPlanDetail,
  AcademicContentWorkflowPolicy,
  CreateAcademicContentRequest,
  CreateAcademicContentPreparationTemplateRequest,
  CreateAcademicContentUploadRequest,
  ListAcademicContentQuery,
  ListAcademicContentPreparationTemplatesQuery,
  ReplaceAcademicContentGuardianNoteDetailRequest,
  ReplaceAcademicContentOnlineSessionDetailRequest,
  ReplaceAcademicContentPreparationDetailRequest,
  ReplaceAcademicContentSubjectResourceDetailRequest,
  ReplaceAcademicContentWeeklyPlanDetailRequest,
  UpdateAcademicContentFilePolicyRequest,
  UpdateAcademicContentPreparationTemplateRequest,
  UpdateAcademicContentRequest,
  UpdateAcademicContentWorkflowPolicyRequest,
} from "../types/contracts";

const BASE_PATH = "/academics/academic-content";
const FILE_POLICY_PATH = `${BASE_PATH}/settings/file-policy`;
const WORKFLOW_POLICY_PATH = `${BASE_PATH}/settings/workflow-policy`;
const REVIEW_QUEUE_PATH = `${BASE_PATH}/review-queue`;
const PREPARATION_TEMPLATES_PATH = `${BASE_PATH}/templates/preparation`;

function contentPath(contentId: string): string {
  return `${BASE_PATH}/${encodeURIComponent(contentId)}`;
}

function preparationTemplatePath(templateId: string): string {
  return `${PREPARATION_TEMPLATES_PATH}/${encodeURIComponent(templateId)}`;
}

function nonEmptyQuery<TQuery extends object>(query: TQuery): Partial<TQuery> {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, queryValue]) => queryValue !== undefined && queryValue !== "",
    ),
  ) as Partial<TQuery>;
}

export function listAcademicContent(
  query: ListAcademicContentQuery,
): Promise<AcademicContentListResponse> {
  return apiGet<AcademicContentListResponse>(BASE_PATH, {
    params: nonEmptyQuery(query),
  });
}

export function getAcademicContent(contentId: string): Promise<AcademicContentDetail> {
  return apiGet<AcademicContentDetail>(contentPath(contentId));
}

export function getAcademicContentReadiness(
  contentId: string,
): Promise<AcademicContentReadinessResponse> {
  return apiGet<AcademicContentReadinessResponse>(`${contentPath(contentId)}/readiness`);
}

export function createAcademicContent(
  request: CreateAcademicContentRequest,
): Promise<AcademicContentBase> {
  return apiPost<AcademicContentBase>(BASE_PATH, request);
}

export function updateAcademicContent(
  contentId: string,
  request: UpdateAcademicContentRequest,
): Promise<AcademicContentBase> {
  return apiPatch<AcademicContentBase>(contentPath(contentId), request);
}

export function replaceAcademicContentTargets(
  contentId: string,
  targets: AcademicContentTargetDraft[],
): Promise<AcademicContentTargetsResponse> {
  return apiPut<AcademicContentTargetsResponse>(`${contentPath(contentId)}/targets`, {
    targets,
  });
}

export function replacePreparationDetail(
  contentId: string,
  request: ReplaceAcademicContentPreparationDetailRequest,
): Promise<AcademicContentPreparationDetail> {
  return apiPut<AcademicContentPreparationDetail>(
    `${contentPath(contentId)}/details/preparation`,
    request,
  );
}

export function replaceWeeklyPlanDetail(
  contentId: string,
  request: ReplaceAcademicContentWeeklyPlanDetailRequest,
): Promise<AcademicContentWeeklyPlanDetail> {
  return apiPut<AcademicContentWeeklyPlanDetail>(
    `${contentPath(contentId)}/details/weekly-plan`,
    request,
  );
}

export function replaceGuardianNoteDetail(
  contentId: string,
  request: ReplaceAcademicContentGuardianNoteDetailRequest,
): Promise<AcademicContentGuardianNoteDetail> {
  return apiPut<AcademicContentGuardianNoteDetail>(
    `${contentPath(contentId)}/details/guardian-note`,
    request,
  );
}

export function replaceSubjectResourceDetail(
  contentId: string,
  request: ReplaceAcademicContentSubjectResourceDetailRequest,
): Promise<AcademicContentSubjectResourceDetail> {
  return apiPut<AcademicContentSubjectResourceDetail>(
    `${contentPath(contentId)}/details/subject-resource`,
    request,
  );
}

export function replaceOnlineSessionDetail(
  contentId: string,
  request: ReplaceAcademicContentOnlineSessionDetailRequest,
): Promise<AcademicContentOnlineSessionDetail> {
  return apiPut<AcademicContentOnlineSessionDetail>(
    `${contentPath(contentId)}/details/online-session`,
    request,
  );
}

export function replaceAcademicContentLinks(
  contentId: string,
  links: AcademicContentLinkInput[],
): Promise<AcademicContentLinksResponse> {
  return apiPut<AcademicContentLinksResponse>(`${contentPath(contentId)}/links`, {
    links,
  });
}

export function replaceAcademicContentTags(
  contentId: string,
  tags: AcademicContentTagInput[],
): Promise<AcademicContentTagsResponse> {
  return apiPut<AcademicContentTagsResponse>(`${contentPath(contentId)}/tags`, {
    tags,
  });
}

export function createAcademicContentUpload(
  contentId: string,
  request: CreateAcademicContentUploadRequest,
): Promise<AcademicContentUploadIntentResponse> {
  return apiPost<AcademicContentUploadIntentResponse>(
    `${contentPath(contentId)}/uploads`,
    request,
  );
}

function uploadPath(contentId: string, uploadId: string): string {
  return `${contentPath(contentId)}/uploads/${encodeURIComponent(uploadId)}`;
}

export function completeAcademicContentUpload(
  contentId: string,
  uploadId: string,
): Promise<AcademicContentUploadCompleteResponse> {
  return apiPost<AcademicContentUploadCompleteResponse>(
    `${uploadPath(contentId, uploadId)}/complete`,
  );
}

export function cancelAcademicContentUpload(
  contentId: string,
  uploadId: string,
): Promise<AcademicContentUploadCancelResponse> {
  return apiPost<AcademicContentUploadCancelResponse>(
    `${uploadPath(contentId, uploadId)}/cancel`,
  );
}

export function unlinkAcademicContentAsset(
  contentId: string,
  assetId: string,
): Promise<AcademicContentAssetUnlinkResponse> {
  return apiDelete<AcademicContentAssetUnlinkResponse>(
    `${contentPath(contentId)}/assets/${encodeURIComponent(assetId)}`,
  );
}

export function listAcademicContentRevisions(
  contentId: string,
  query: AcademicContentPaginationQuery,
): Promise<AcademicContentRevisionListResponse> {
  return apiGet<AcademicContentRevisionListResponse>(
    `${contentPath(contentId)}/revisions`,
    { params: nonEmptyQuery(query) },
  );
}

export function getAcademicContentRevision(
  contentId: string,
  revisionId: string,
): Promise<AcademicContentRevisionDetail> {
  return apiGet<AcademicContentRevisionDetail>(
    `${contentPath(contentId)}/revisions/${encodeURIComponent(revisionId)}`,
  );
}

export function archiveAcademicContent(contentId: string): Promise<AcademicContentBase> {
  return apiPost<AcademicContentBase>(`${contentPath(contentId)}/archive`);
}

export function restoreAcademicContent(contentId: string): Promise<AcademicContentBase> {
  return apiPost<AcademicContentBase>(`${contentPath(contentId)}/restore`);
}

export function deleteAcademicContent(
  contentId: string,
): Promise<AcademicContentDeleteResponse> {
  return apiDelete<AcademicContentDeleteResponse>(contentPath(contentId));
}

export function getAcademicContentFilePolicy(): Promise<AcademicContentFilePolicy> {
  return apiGet<AcademicContentFilePolicy>(FILE_POLICY_PATH);
}

export function updateAcademicContentFilePolicy(
  request: UpdateAcademicContentFilePolicyRequest,
): Promise<AcademicContentFilePolicy> {
  return apiPatch<AcademicContentFilePolicy>(FILE_POLICY_PATH, request);
}

export function getAcademicContentWorkflowPolicy(): Promise<AcademicContentWorkflowPolicy> {
  return apiGet<AcademicContentWorkflowPolicy>(WORKFLOW_POLICY_PATH);
}

export function updateAcademicContentWorkflowPolicy(
  request: UpdateAcademicContentWorkflowPolicyRequest,
): Promise<AcademicContentWorkflowPolicy> {
  return apiPatch<AcademicContentWorkflowPolicy>(WORKFLOW_POLICY_PATH, request);
}

export function submitAcademicContent(
  contentId: string,
): Promise<AcademicContentTransitionResponse> {
  return apiPost<AcademicContentTransitionResponse>(
    `${contentPath(contentId)}/submit`,
    {},
  );
}

export function approveAcademicContent(
  contentId: string,
): Promise<AcademicContentTransitionResponse> {
  return apiPost<AcademicContentTransitionResponse>(
    `${contentPath(contentId)}/approve`,
    {},
  );
}

export function requestAcademicContentChanges(
  contentId: string,
  note: string,
): Promise<AcademicContentTransitionResponse> {
  return apiPost<AcademicContentTransitionResponse>(
    `${contentPath(contentId)}/request-changes`,
    { note: note.trim() },
  );
}

export function listAcademicContentReviewQueue(
  query: AcademicContentReviewQueueQuery,
): Promise<AcademicContentReviewQueueResponse> {
  return apiGet<AcademicContentReviewQueueResponse>(REVIEW_QUEUE_PATH, {
    params: nonEmptyQuery(query),
  });
}

export function listAcademicContentApprovalHistory(
  contentId: string,
  query: AcademicContentPaginationQuery,
): Promise<AcademicContentApprovalHistoryResponse> {
  return apiGet<AcademicContentApprovalHistoryResponse>(
    `${contentPath(contentId)}/approvals`,
    { params: nonEmptyQuery(query) },
  );
}

export function listAcademicContentPreparationTemplates(
  query: ListAcademicContentPreparationTemplatesQuery,
): Promise<AcademicContentPreparationTemplateListResponse> {
  return apiGet<AcademicContentPreparationTemplateListResponse>(
    PREPARATION_TEMPLATES_PATH,
    { params: nonEmptyQuery(query) },
  );
}

export function getAcademicContentPreparationTemplate(
  templateId: string,
): Promise<AcademicContentPreparationTemplateDetail> {
  return apiGet<AcademicContentPreparationTemplateDetail>(
    preparationTemplatePath(templateId),
  );
}

export function createAcademicContentPreparationTemplate(
  request: CreateAcademicContentPreparationTemplateRequest,
): Promise<AcademicContentPreparationTemplateDetail> {
  return apiPost<AcademicContentPreparationTemplateDetail>(
    PREPARATION_TEMPLATES_PATH,
    request,
  );
}

export function updateAcademicContentPreparationTemplate(
  templateId: string,
  request: UpdateAcademicContentPreparationTemplateRequest,
): Promise<AcademicContentPreparationTemplateDetail> {
  return apiPatch<AcademicContentPreparationTemplateDetail>(
    preparationTemplatePath(templateId),
    request,
  );
}

export function deleteAcademicContentPreparationTemplate(
  templateId: string,
): Promise<AcademicContentPreparationTemplateDeleteResponse> {
  return apiDelete<AcademicContentPreparationTemplateDeleteResponse>(
    preparationTemplatePath(templateId),
  );
}
