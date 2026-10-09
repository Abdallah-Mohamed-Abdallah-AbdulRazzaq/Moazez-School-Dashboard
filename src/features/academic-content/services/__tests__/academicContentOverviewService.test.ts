import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AcademicContentLibraryItem,
  AcademicContentListResponse,
} from "../../types/contracts";
import {
  loadContentTypeTotal,
  loadRecentlyUpdated,
  loadUpcomingSessions,
  loadWorkInProgress,
} from "../academicContentOverviewService";

const listAcademicContent = vi.hoisted(() => vi.fn());

vi.mock("../academicContentApi", () => ({ listAcademicContent }));

const context = { academicYearId: "year-1", termId: "term-1" };

function content(
  id: string,
  updatedAt: string,
  overrides: Partial<AcademicContentLibraryItem> = {},
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: context.academicYearId,
    termId: context.termId,
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: id,
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: updatedAt,
    updatedAt,
    summary: null,
    ...overrides,
  };
}

function response(
  contentItems: AcademicContentLibraryItem[],
  total = contentItems.length,
): AcademicContentListResponse {
  return { items: contentItems, page: 1, limit: 100, total };
}

describe("academic content overview service", () => {
  beforeEach(() => listAcademicContent.mockReset());

  it("loads a content type total with the smallest page", async () => {
    listAcademicContent.mockResolvedValue(response([], 27));

    await expect(loadContentTypeTotal(context, "WEEKLY_PLAN")).resolves.toBe(27);
    expect(listAcademicContent).toHaveBeenCalledWith({
      ...context,
      type: "WEEKLY_PLAN",
      page: 1,
      limit: 1,
    });
  });

  it("preserves successful work-in-progress rows when one query fails", async () => {
    const changesRequested = content("changes", "2026-10-05T09:00:00.000Z", {
      status: "CHANGES_REQUESTED",
    });
    listAcademicContent
      .mockRejectedValueOnce(new Error("Drafts unavailable"))
      .mockResolvedValueOnce(response([changesRequested]));

    await expect(loadWorkInProgress(context)).resolves.toEqual({
      data: [changesRequested],
      error: {
        code: "UNKNOWN_ERROR",
        message: "This action could not be completed. Try again; contact support if the problem continues.",
      },
      partial: true,
    });
    expect(listAcademicContent).toHaveBeenNthCalledWith(1, {
      ...context,
      status: "DRAFT",
      page: 1,
      limit: 4,
    });
    expect(listAcademicContent).toHaveBeenNthCalledWith(2, {
      ...context,
      status: "CHANGES_REQUESTED",
      page: 1,
      limit: 4,
    });
  });

  it("loads and sorts future online sessions", async () => {
    const now = new Date("2026-10-05T10:00:00.000Z");
    const sessionContent = content("session", "2026-10-05T09:00:00.000Z", {
      type: "ONLINE_SESSION",
      summary: {
        type: "ONLINE_SESSION",
        platform: "ZOOM",
        startAt: "2026-10-05T10:15:00.000Z",
        endAt: "2026-10-05T11:00:00.000Z",
      },
    });
    listAcademicContent.mockResolvedValue(response([sessionContent]));

    await expect(loadUpcomingSessions(context, now)).resolves.toEqual([
      expect.objectContaining({ content: sessionContent, state: "STARTING_SOON" }),
    ]);
    expect(listAcademicContent).toHaveBeenCalledWith({
      ...context,
      type: "ONLINE_SESSION",
      sessionStartAtFrom: now.toISOString(),
      page: 1,
      limit: 100,
    });
  });

  it("loads the five most recently updated items", async () => {
    const recentContent = content("recent", "2026-10-05T09:00:00.000Z");
    listAcademicContent.mockResolvedValue(response([recentContent]));

    await expect(loadRecentlyUpdated(context)).resolves.toEqual([recentContent]);
    expect(listAcademicContent).toHaveBeenCalledWith({
      ...context,
      page: 1,
      limit: 5,
    });
  });
});
