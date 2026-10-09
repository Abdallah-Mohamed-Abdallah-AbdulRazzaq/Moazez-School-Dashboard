import type {
  AcademicContentLibraryItem,
  AcademicContentOnlineSessionSummary,
} from "../types/contracts";

export type AcademicContentSessionState = "STARTING_SOON" | "UPCOMING";

export interface UpcomingAcademicContentSession {
  content: AcademicContentLibraryItem;
  summary: AcademicContentOnlineSessionSummary;
  state: AcademicContentSessionState;
}

export function mergeWorkInProgress(
  drafts: readonly AcademicContentLibraryItem[],
  changesRequested: readonly AcademicContentLibraryItem[],
): AcademicContentLibraryItem[] {
  const uniqueContent = new Map(
    [...drafts, ...changesRequested].map((content) => [content.id, content]),
  );
  return [...uniqueContent.values()]
    .sort((leftContent, rightContent) =>
      rightContent.updatedAt.localeCompare(leftContent.updatedAt),
    )
    .slice(0, 4);
}

export function sessionState(
  startAt: string,
  now: Date,
): AcademicContentSessionState {
  const millisecondsUntilStart = new Date(startAt).getTime() - now.getTime();
  return millisecondsUntilStart <= 30 * 60_000
    ? "STARTING_SOON"
    : "UPCOMING";
}

export function selectUpcomingSessions(
  contentItems: readonly AcademicContentLibraryItem[],
  now: Date,
): UpcomingAcademicContentSession[] {
  return contentItems
    .flatMap((content) => {
      if (content.summary?.type !== "ONLINE_SESSION") return [];
      return [{
        content,
        summary: content.summary,
        state: sessionState(content.summary.startAt, now),
      }];
    })
    .sort((leftSession, rightSession) =>
      leftSession.summary.startAt.localeCompare(rightSession.summary.startAt),
    )
    .slice(0, 4);
}
