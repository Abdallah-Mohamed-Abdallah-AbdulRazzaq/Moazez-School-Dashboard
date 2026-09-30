import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
} from "../../types/contracts";
import { useAcademicContentEditor } from "../useAcademicContentEditor";

const api = vi.hoisted(() => ({
  getAcademicContent: vi.fn(),
  getAcademicContentReadiness: vi.fn(),
  replaceAcademicContentLinks: vi.fn(),
  replaceAcademicContentTags: vi.fn(),
  replaceAcademicContentTargets: vi.fn(),
  replaceGuardianNoteDetail: vi.fn(),
  replaceOnlineSessionDetail: vi.fn(),
  replacePreparationDetail: vi.fn(),
  replaceSubjectResourceDetail: vi.fn(),
  replaceWeeklyPlanDetail: vi.fn(),
  updateAcademicContent: vi.fn(),
}));

vi.mock("../../services/academicContentApi", () => api);

function detail(
  id: string,
  status: AcademicContentDetail["status"] = "DRAFT",
): AcademicContentDetail {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: `Content ${id}`,
    description: null,
    status,
    archivedAt: status === "ARCHIVED" ? "2026-09-29T08:00:00.000Z" : null,
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T08:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

const ready: AcademicContentReadinessResponse = {
  canAdvance: true,
  blockingReasons: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useAcademicContentEditor", () => {
  beforeEach(() => {
    api.getAcademicContent.mockReset().mockResolvedValue(detail("content-1"));
    api.getAcademicContentReadiness.mockReset().mockResolvedValue(ready);
    api.updateAcademicContent.mockReset().mockResolvedValue(detail("content-1"));
    api.replaceAcademicContentLinks.mockReset().mockResolvedValue({ links: [] });
    api.replaceAcademicContentTags.mockReset().mockResolvedValue({ tags: [] });
    api.replaceAcademicContentTargets.mockReset().mockResolvedValue({
      targets: [
        {
          id: "target-1",
          scopeType: "SCHOOL",
          stageId: null,
          gradeId: null,
          sectionId: null,
          classroomId: null,
          subjectId: null,
          teacherSubjectAllocationId: null,
        },
      ],
    });
    api.replaceGuardianNoteDetail.mockReset().mockResolvedValue({});
    api.replaceOnlineSessionDetail.mockReset().mockResolvedValue({});
    api.replacePreparationDetail.mockReset().mockResolvedValue({});
    api.replaceSubjectResourceDetail.mockReset().mockResolvedValue({});
    api.replaceWeeklyPlanDetail.mockReset().mockResolvedValue({});
  });

  it("loads aggregate detail and readiness", async () => {
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.getAcademicContent).toHaveBeenCalledWith("content-1");
    expect(api.getAcademicContentReadiness).toHaveBeenCalledWith("content-1");
    expect(result.current.content?.title).toBe("Content content-1");
    expect(result.current.readiness).toEqual(ready);
  });

  it.each([
    [404, "CONTENT_NOT_FOUND"],
    [403, "FORBIDDEN"],
    [409, "CONTENT_ARCHIVED"],
  ])("preserves a %s API error for the page", async (status, code) => {
    api.getAcademicContent.mockRejectedValue(
      new ApiError("Cannot load content", status, code, undefined, {
        contentId: "content-1",
      }, "trace-1"),
    );

    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toEqual(
      expect.objectContaining({ code, message: "Cannot load content", traceId: "trace-1" }),
    );
  });

  it("makes archived content read-only", async () => {
    api.getAcademicContent.mockResolvedValue(detail("content-1", "ARCHIVED"));

    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isReadOnly).toBe(true);
  });

  it("applies a lifecycle response before the aggregate refresh completes", async () => {
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.applyContentBase(detail("content-1", "ARCHIVED")));

    expect(result.current.content?.status).toBe("ARCHIVED");
    expect(result.current.isReadOnly).toBe(true);
  });

  it("narrows metadata payload and refreshes aggregate and readiness after saving", async () => {
    const updated = { ...detail("content-1"), title: "Updated" };
    api.getAcademicContent
      .mockResolvedValueOnce(detail("content-1"))
      .mockResolvedValueOnce(updated);
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() =>
      result.current.saveMetadata({
        title: "Updated",
        description: "Description",
        audience: "STUDENTS",
        ignored: "must not reach the API",
      } as Parameters<typeof result.current.saveMetadata>[0] & { ignored: string }),
    );

    expect(api.updateAcademicContent).toHaveBeenCalledWith("content-1", {
      title: "Updated",
      description: "Description",
      audience: "STUDENTS",
    });
    expect(api.getAcademicContent).toHaveBeenCalledTimes(2);
    expect(api.getAcademicContentReadiness).toHaveBeenCalledTimes(2);
    expect(result.current.content?.title).toBe("Updated");
    expect(result.current.sections.metadata.dirty).toBe(false);
  });

  it("ignores a stale response after the content id changes", async () => {
    const first = deferred<AcademicContentDetail>();
    api.getAcademicContent
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(detail("content-2"));

    const { result, rerender } = renderHook(
      ({ contentId }) => useAcademicContentEditor(contentId),
      { initialProps: { contentId: "content-1" } },
    );
    rerender({ contentId: "content-2" });
    await waitFor(() => expect(result.current.content?.id).toBe("content-2"));

    await act(async () => first.resolve(detail("content-1")));
    expect(result.current.content?.id).toBe("content-2");
  });

  it("replaces all targets and refreshes the aggregate and readiness", async () => {
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() =>
      result.current.saveTargets([
        {
          scopeType: "SCHOOL",
          stageId: null,
          gradeId: null,
          sectionId: null,
          classroomId: null,
          subjectId: null,
          teacherSubjectAllocationId: null,
        },
      ]),
    );

    expect(api.replaceAcademicContentTargets).toHaveBeenCalledOnce();
    expect(api.getAcademicContent).toHaveBeenCalledTimes(2);
    expect(api.getAcademicContentReadiness).toHaveBeenCalledTimes(2);
    expect(result.current.sections.targets.dirty).toBe(false);
  });

  it("saves a type detail through its exact endpoint and refreshes readiness", async () => {
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() =>
      result.current.saveGuardianNoteDetails({
        body: "Bring the workbook",
        priority: "IMPORTANT",
        requiresAcknowledgement: true,
      }),
    );

    expect(api.replaceGuardianNoteDetail).toHaveBeenCalledWith("content-1", {
      body: "Bring the workbook",
      priority: "IMPORTANT",
      requiresAcknowledgement: true,
    });
    expect(api.getAcademicContentReadiness).toHaveBeenCalledTimes(2);
  });

  it("uses the server-normalized tag list after replacing tags", async () => {
    const canonicalTags = [
      { id: "tag-1", value: "algebra", sortOrder: 0 },
      { id: "tag-2", value: "revision", sortOrder: 1 },
    ];
    api.replaceAcademicContentTags.mockResolvedValue({ tags: canonicalTags });
    api.getAcademicContent
      .mockResolvedValueOnce(detail("content-1"))
      .mockResolvedValueOnce({ ...detail("content-1"), tags: canonicalTags });
    const { result } = renderHook(() => useAcademicContentEditor("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() =>
      result.current.saveTags([
        { value: " Algebra " },
        { value: "Revision" },
        { value: "algebra" },
      ]),
    );

    expect(api.replaceAcademicContentTags).toHaveBeenCalledWith("content-1", [
      { value: " Algebra " },
      { value: "Revision" },
      { value: "algebra" },
    ]);
    expect(result.current.content?.tags).toEqual(canonicalTags);
    expect(result.current.sections.tags.dirty).toBe(false);
  });
});
