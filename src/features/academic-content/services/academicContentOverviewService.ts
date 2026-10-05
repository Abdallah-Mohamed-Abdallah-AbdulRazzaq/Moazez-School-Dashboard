import {
  mergeWorkInProgress,
  selectUpcomingSessions,
  type UpcomingAcademicContentSession,
} from "../model/academicContentOverview";
import type {
  AcademicContentLibraryItem,
  AcademicContentType,
} from "../types/contracts";
import { listAcademicContent } from "./academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "./academicContentErrors";

export interface AcademicContentOverviewContext {
  academicYearId: string;
  termId: string;
}

export interface OverviewSectionResult<TData> {
  data: TData;
  error: AcademicContentUiError | null;
  partial: boolean;
}

export async function loadContentTypeTotal(
  context: AcademicContentOverviewContext,
  type: AcademicContentType,
): Promise<number> {
  const response = await listAcademicContent({
    ...context,
    type,
    page: 1,
    limit: 1,
  });
  return response.total;
}

export async function loadWorkInProgress(
  context: AcademicContentOverviewContext,
): Promise<OverviewSectionResult<AcademicContentLibraryItem[]>> {
  const [draftsResult, changesRequestedResult] = await Promise.allSettled([
    listAcademicContent({ ...context, status: "DRAFT", page: 1, limit: 4 }),
    listAcademicContent({
      ...context,
      status: "CHANGES_REQUESTED",
      page: 1,
      limit: 4,
    }),
  ]);
  const failedResult = [draftsResult, changesRequestedResult].find(
    (result) => result.status === "rejected",
  );
  const drafts = draftsResult.status === "fulfilled" ? draftsResult.value.items : [];
  const changesRequested =
    changesRequestedResult.status === "fulfilled"
      ? changesRequestedResult.value.items
      : [];

  return {
    data: mergeWorkInProgress(drafts, changesRequested),
    error:
      failedResult?.status === "rejected"
        ? academicContentUiError(failedResult.reason)
        : null,
    partial: Boolean(failedResult),
  };
}

export async function loadUpcomingSessions(
  context: AcademicContentOverviewContext,
  now: Date,
): Promise<UpcomingAcademicContentSession[]> {
  const response = await listAcademicContent({
    ...context,
    type: "ONLINE_SESSION",
    sessionStartAtFrom: now.toISOString(),
    page: 1,
    limit: 100,
  });
  return selectUpcomingSessions(response.items, now);
}

export async function loadRecentlyUpdated(
  context: AcademicContentOverviewContext,
): Promise<AcademicContentLibraryItem[]> {
  const response = await listAcademicContent({
    ...context,
    page: 1,
    limit: 5,
  });
  return response.items;
}
