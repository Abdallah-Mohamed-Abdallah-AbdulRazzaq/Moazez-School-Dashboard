import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePreparationTemplates } from "../usePreparationTemplates";

const navigationState = vi.hoisted(() => ({
  query: "year=year-1&term=term-1",
  replace: vi.fn(),
}));
const api = vi.hoisted(() => ({
  list: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub/templates",
  useRouter: () => ({ replace: navigationState.replace }),
  useSearchParams: () => new URLSearchParams(navigationState.query),
}));

vi.mock("../../services/academicContentApi", () => ({
  listAcademicContentPreparationTemplates: api.list,
  deleteAcademicContentPreparationTemplate: api.remove,
}));

function templateResponse(name = "Core lesson", total = 1) {
  return {
    items: [
      {
        id: "template-1",
        name,
        description: null,
        stageId: null,
        subjectId: null,
        objectivesCount: 1,
        learningOutcomesCount: 1,
        teachingStrategiesCount: 1,
        activitiesCount: 1,
        updatedAt: "2026-10-02T08:00:00.000Z",
      },
    ],
    page: 1,
    limit: 50,
    total,
  };
}

describe("usePreparationTemplates", () => {
  beforeEach(() => {
    navigationState.query = "year=year-1&term=term-1";
    navigationState.replace.mockReset();
    api.list.mockReset().mockResolvedValue(templateResponse());
    api.remove.mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => vi.useRealTimers());

  it("loads page one with the backend default page size", async () => {
    const { result, rerender } = renderHook(() => usePreparationTemplates());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();

    expect(api.list).toHaveBeenCalledTimes(1);
    expect(api.list).toHaveBeenCalledWith({ page: 1, limit: 50 });
  });

  it("caps the limit and serializes search, stage, and subject filters", async () => {
    vi.useFakeTimers();
    navigationState.query =
      "year=year-1&term=term-1&limit=500&stageId=stage-1&subjectId=subject-1";
    const { result } = renderHook(() => usePreparationTemplates());

    await act(async () => Promise.resolve());
    expect(api.list).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      stageId: "stage-1",
      subjectId: "subject-1",
    });

    act(() => result.current.setSearch("fractions"));
    await act(async () => vi.advanceTimersByTime(300));
    expect(navigationState.replace).toHaveBeenLastCalledWith(
      "/en/academic-content-hub/templates?year=year-1&term=term-1&limit=500&stageId=stage-1&subjectId=subject-1&search=fractions",
      { scroll: false },
    );
  });

  it("soft-deletes then reloads the server collection", async () => {
    const { result } = renderHook(() => usePreparationTemplates());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTemplate("template-1");
    });

    expect(api.remove).toHaveBeenCalledWith("template-1");
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
  });
});
