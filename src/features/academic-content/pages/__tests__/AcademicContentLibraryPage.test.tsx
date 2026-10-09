import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicContentLibraryView } from "../AcademicContentLibraryPage";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";

const libraryState = vi.hoisted(() => ({
  error: null as { message: string } | null,
  reload: vi.fn(),
}));

const browseOptions: AcademicContentBrowseOptionsState = {
  targetOptions: null,
  teachers: [],
  isLoadingTargets: false,
  isLoadingTeachers: false,
  targetOptionsUnavailable: false,
  teachersUnavailable: false,
};

function emptyLibraryState() {
  return {
    filters: {
      page: 1,
      limit: 50,
      type: "" as const,
      status: "" as const,
      audience: "" as const,
      stageId: "",
      gradeId: "",
      sectionId: "",
      classroomId: "",
      subjectId: "",
      teacherUserId: "",
      resourceCategory: "" as const,
      weeklyDateFrom: "",
      weeklyDateTo: "",
      sessionStartAtFrom: "",
      sessionStartAtTo: "",
      sessionPlatform: "" as const,
      guardianPriority: "" as const,
      tag: "",
      search: "",
    },
    search: "",
    items: [],
    total: 0,
    isLoading: false,
    error: libraryState.error,
    setSearch: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setLimit: vi.fn(),
    clearFilters: vi.fn(),
    reload: libraryState.reload,
  };
}

describe("AcademicContentLibraryPage", () => {
  beforeEach(() => {
    libraryState.error = null;
    libraryState.reload.mockReset();
  });

  it("shows the library empty state", () => {
    render(
      <AcademicContentLibraryView
        library={emptyLibraryState()}
        browseOptions={browseOptions}
      />,
    );

    expect(screen.getByText("No academic content yet")).toBeInTheDocument();
  });

  it("shows a recoverable error state", () => {
    libraryState.error = { message: "Library unavailable" };
    render(
      <AcademicContentLibraryView
        library={emptyLibraryState()}
        browseOptions={browseOptions}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Library unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(libraryState.reload).toHaveBeenCalledOnce();
  });
});
