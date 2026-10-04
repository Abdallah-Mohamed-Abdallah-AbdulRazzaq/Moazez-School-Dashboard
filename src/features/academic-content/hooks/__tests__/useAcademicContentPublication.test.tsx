import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type {
  AcademicContentPublication,
  AcademicContentPublicationHistoryResponse,
} from "../../types/contracts";
import { useAcademicContentPublication } from "../useAcademicContentPublication";

const api = vi.hoisted(() => ({
  cancelAcademicContentPublication: vi.fn(),
  createAcademicContentPublication: vi.fn(),
  getAcademicContentAudiencePreview: vi.fn(),
  getAcademicContentPublication: vi.fn(),
  getAcademicContentPublicationReadiness: vi.fn(),
  listAcademicContentPublications: vi.fn(),
  unscheduleAcademicContentPublication: vi.fn(),
}));

vi.mock("../../services/academicContentApi", () => api);

const CONTENT_ID = "content-1";
const NOW = "2026-10-05T08:00:00.000Z";
const EMPTY_HISTORY: AcademicContentPublicationHistoryResponse = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
};

function publication(
  status: AcademicContentPublication["status"] = "SCHEDULED",
  publishAt = NOW,
): AcademicContentPublication {
  return {
    publicationId: "publication-1",
    revisionId: "revision-1",
    status,
    sourceContentStatus: "DRAFT",
    publishAt,
    visibleFrom: publishAt,
    visibleUntil: null,
    publishedAt: status === "PUBLISHED" ? NOW : null,
    expiredAt: status === "EXPIRED" ? NOW : null,
    cancelledAt: status === "CANCELLED" ? NOW : null,
    studentRecipientCount: status === "PUBLISHED" ? 12 : 0,
    guardianRecipientContextCount: status === "PUBLISHED" ? 8 : 0,
    createdByUserId: "user-1",
    createdAt: NOW,
  };
}

async function finishInitialReads() {
  await waitFor(() => {
    expect(api.getAcademicContentPublicationReadiness).toHaveBeenCalled();
    expect(api.getAcademicContentAudiencePreview).toHaveBeenCalled();
    expect(api.listAcademicContentPublications).toHaveBeenCalled();
  });
}

describe("useAcademicContentPublication", () => {
  beforeEach(() => {
    api.getAcademicContentPublicationReadiness.mockReset().mockResolvedValue({
      canPublish: true,
      canSchedule: true,
      blockingReasons: [],
    });
    api.getAcademicContentAudiencePreview.mockReset().mockResolvedValue({
      asOf: NOW,
      students: 12,
      guardianContexts: 8,
      guardianUsersWithAccounts: 5,
      guardianNotificationOptOutContexts: 1,
    });
    api.listAcademicContentPublications
      .mockReset()
      .mockResolvedValue(EMPTY_HISTORY);
    api.createAcademicContentPublication.mockReset();
    api.getAcademicContentPublication.mockReset();
    api.unscheduleAcademicContentPublication.mockReset();
    api.cancelAcademicContentPublication.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps successful publication reads when audience preview fails", async () => {
    api.getAcademicContentAudiencePreview.mockRejectedValue(
      new ApiError("Preview unavailable", 503, "UNAVAILABLE"),
    );
    const { result } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, vi.fn()),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.readiness).toMatchObject({ canPublish: true });
    expect(result.current.history).toEqual(EMPTY_HISTORY);
    expect(result.current.audiencePreview).toBeNull();
    expect(result.current.errors.audiencePreview?.message).toBe(
      "Preview unavailable",
    );
  });

  it("reuses a request id for an unchanged failed attempt and replaces it after edits", async () => {
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .mockReturnValueOnce("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    api.createAcademicContentPublication.mockRejectedValue(
      new ApiError("Temporary failure", 503, "UNAVAILABLE"),
    );
    const { result } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, vi.fn()),
    );
    await finishInitialReads();

    const draft = {
      mode: "now" as const,
      publishAt: null,
      visibleFrom: null,
      visibleUntil: null,
    };
    await act(async () => {
      await result.current.create(draft);
      await result.current.create(draft);
      await result.current.create({
        ...draft,
        visibleUntil: new Date("2026-10-07T09:00:00.000Z"),
      });
    });

    const requests = api.createAcademicContentPublication.mock.calls.map(
      ([, request]) => request.clientRequestId,
    );
    expect(requests).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ]);
  });

  it("polls publish-now sequentially until the backend reports published", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    const scheduled = publication();
    const published = publication("PUBLISHED");
    api.createAcademicContentPublication.mockResolvedValue(scheduled);
    api.getAcademicContentPublication
      .mockResolvedValueOnce(scheduled)
      .mockResolvedValueOnce(published);
    const onContentChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, onContentChanged),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await result.current.create({
        mode: "now",
        publishAt: null,
        visibleFrom: null,
        visibleUntil: null,
      });
    });
    expect(result.current.trackedPublication?.status).toBe("SCHEDULED");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.getAcademicContentPublication).toHaveBeenCalledTimes(1);
    expect(result.current.trackedPublication?.status).toBe("SCHEDULED");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.trackedPublication).toEqual(published);
    expect(onContentChanged).toHaveBeenCalledOnce();
  });

  it("waits until a future schedule is due before polling", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    const publishAt = "2026-10-05T08:02:00.000Z";
    api.createAcademicContentPublication.mockResolvedValue(
      publication("SCHEDULED", publishAt),
    );
    api.getAcademicContentPublication.mockResolvedValue(
      publication("PUBLISHED", publishAt),
    );
    const { result } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, vi.fn()),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await result.current.create({
        mode: "schedule",
        publishAt: new Date(publishAt),
        visibleFrom: null,
        visibleUntil: null,
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(119_999);
    });
    expect(api.getAcademicContentPublication).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(api.getAcademicContentPublication).toHaveBeenCalledOnce();
  });

  it("stops after fifteen scheduled reads and exposes a timeout", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    api.createAcademicContentPublication.mockResolvedValue(publication());
    api.getAcademicContentPublication.mockResolvedValue(publication());
    const { result } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, vi.fn()),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await result.current.create({
        mode: "now",
        publishAt: null,
        visibleFrom: null,
        visibleUntil: null,
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(28_000);
    });

    expect(api.getAcademicContentPublication).toHaveBeenCalledTimes(15);
    expect(result.current.pollTimedOut).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears publication timers on unmount", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    api.createAcademicContentPublication.mockResolvedValue(publication());
    api.getAcademicContentPublication.mockResolvedValue(publication());
    const { result, unmount } = renderHook(() =>
      useAcademicContentPublication(CONTENT_ID, vi.fn()),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await result.current.create({
        mode: "now",
        publishAt: null,
        visibleFrom: null,
        visibleUntil: null,
      });
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.getAcademicContentPublication).toHaveBeenCalledOnce();

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(api.getAcademicContentPublication).toHaveBeenCalledOnce();
  });
});
