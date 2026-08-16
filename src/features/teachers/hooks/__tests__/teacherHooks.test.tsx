import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import { generateUserCredential } from "@/features/settings/credentials/services/credentialsService";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import { detailToEditForm, editFormToRehireRequest } from "@/features/teachers/utils/teacherFormMappers";
import { useTeacherActions } from "../useTeacherActions";
import { useTeacherDetail } from "../useTeacherDetail";
import { useTeacherList } from "../useTeacherList";

vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    changeEmploymentStatus: vi.fn(),
    archive: vi.fn(),
    rehire: vi.fn(),
  },
}));

vi.mock("@/features/settings/credentials/services/credentialsService", () => ({
  generateUserCredential: vi.fn(),
}));

const listResponse = (search: string) => ({
  items: [{ ...teacherFixture, displayName: { ...teacherFixture.displayName, fullName: search } }],
  pagination: { page: 1, limit: 20, total: 1 },
});

describe("teacher data hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the newest list response when an older request resolves late", async () => {
    let resolveFirst: (response: ReturnType<typeof listResponse>) => void = () => undefined;
    vi.mocked(teacherApi.list)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce(listResponse("newest"));
    const { result, rerender } = renderHook(
      ({ search }) => useTeacherList({ search }),
      { initialProps: { search: "first" } },
    );
    rerender({ search: "second" });
    await waitFor(() => expect(result.current.response?.items[0].displayName.fullName).toBe("newest"));
    await act(async () => resolveFirst(listResponse("stale")));
    expect(result.current.response?.items[0].displayName.fullName).toBe("newest");
  });

  it("does not load detail without an id and supports local replacement", async () => {
    const { result } = renderHook(() => useTeacherDetail(undefined));
    expect(teacherApi.get).not.toHaveBeenCalled();
    act(() => result.current.replaceTeacher(teacherFixture));
    expect(result.current.teacher?.id).toBe("teacher-1");
  });

  it("keeps loaded detail mounted while a credential refresh is pending", async () => {
    vi.mocked(teacherApi.get).mockResolvedValueOnce(teacherFixture);
    const { result } = renderHook(() => useTeacherDetail("teacher-1"));
    await waitFor(() => expect(result.current.teacher).toEqual(teacherFixture));

    let resolveRefresh: (teacher: typeof teacherFixture) => void = () => undefined;
    vi.mocked(teacherApi.get).mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    let refreshPromise: Promise<void> = Promise.resolve();
    act(() => { refreshPromise = result.current.refresh(); });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.teacher).toEqual(teacherFixture);
    await act(async () => resolveRefresh(teacherFixture));
    await refreshPromise;
  });

  it("clears action state after a rejected mutation", async () => {
    vi.mocked(teacherApi.archive).mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() => useTeacherActions());
    await expect(act(() => result.current.archiveTeacher("teacher-1"))).rejects.toThrow("failed");
    expect(result.current.activeAction).toBeNull();
  });

  it("returns the rehired teacher and clears rehire state", async () => {
    vi.mocked(teacherApi.rehire).mockResolvedValue(teacherFixture);
    const input = editFormToRehireRequest(detailToEditForm(teacherFixture, "EN"));
    const { result } = renderHook(() => useTeacherActions());

    await expect(act(() => result.current.rehireTeacher("teacher-1", input))).resolves.toEqual(teacherFixture);
    expect(teacherApi.rehire).toHaveBeenCalledWith("teacher-1", input);
    expect(result.current.activeAction).toBeNull();
  });

  it("sets a newly created teacher inactive and then active through lifecycle endpoints", async () => {
    vi.mocked(teacherApi.create).mockResolvedValue(teacherFixture);
    vi.mocked(teacherApi.changeEmploymentStatus).mockResolvedValue({} as never);
    vi.mocked(generateUserCredential).mockResolvedValue({
      userId: teacherFixture.userId,
      temporaryPassword: "one-time-password",
      mustChangePassword: true,
    });
    const { result } = renderHook(() => useTeacherActions());
    const input = {
      teacherCode: "TCH-001",
      firstNameAr: "نور",
      lastNameAr: "علي",
      firstNameEn: "Nour",
      lastNameEn: "Ali",
      preferredDisplayLanguage: "EN" as const,
      gender: "FEMALE" as const,
      employmentStatus: "ACTIVE" as const,
    };

    let creationResult: Awaited<ReturnType<typeof result.current.createTeacher>>;
    await act(async () => {
      creationResult = await result.current.createTeacher(input);
    });
    expect(creationResult.teacher).toEqual(teacherFixture);
    expect(teacherApi.create).toHaveBeenCalledWith({ ...input, employmentStatus: "ACTIVE" });
    expect(generateUserCredential).toHaveBeenCalledWith(teacherFixture.userId);
    expect(teacherApi.changeEmploymentStatus).toHaveBeenNthCalledWith(1, teacherFixture.id, {
      employmentStatus: "INACTIVE",
    });
    expect(teacherApi.changeEmploymentStatus).toHaveBeenNthCalledWith(2, teacherFixture.id, {
      employmentStatus: "ACTIVE",
    });
  });
});
