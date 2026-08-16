import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import SubjectsAllocationContainer from "@/features/academics/subjects/container/SubjectsAllocationContainer";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";
import { usePermissions } from "@/hooks/usePermissions";

const {
  mockedSubjectsAllocationView,
  mockedClearDirty,
  mockedMarkDirty,
  mockedSearchParams,
} = vi.hoisted(() => ({
  mockedSubjectsAllocationView: vi.fn(),
  mockedClearDirty: vi.fn(),
  mockedMarkDirty: vi.fn(),
  mockedSearchParams: { current: "" },
}));

vi.mock("@/features/academics/subjects/views/SubjectsAllocationView", () => ({
  default: (props: {
    canView: boolean;
    isReadOnly: boolean;
    isLoading: boolean;
    isMatrixLoading: boolean;
    apiError: string | null;
  }) => {
    mockedSubjectsAllocationView(props);
    return (
      <div>
        <span>{props.canView ? "can-view" : "Access denied"}</span>
        <span>{props.isReadOnly ? "read-only" : "editable"}</span>
        <span>{props.isLoading ? "loading" : "loaded"}</span>
        <span>{props.isMatrixLoading ? "matrix-loading" : "matrix-idle"}</span>
        {props.apiError && <span>{props.apiError}</span>}
      </div>
    );
  },
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: vi.fn(),
  fetchSubjects: vi.fn(),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: vi.fn(),
}));

vi.mock("@/features/academics/hooks/useAcademicContextBarActions", () => ({
  useAcademicContextBarActions: vi.fn(),
}));

vi.mock("@/hooks/useDirtyKey", () => ({
  useDirtyKey: () => ({
    clearDirty: mockedClearDirty,
    markDirty: mockedMarkDirty,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(mockedSearchParams.current),
}));

const mockedFetchStructureTree = vi.mocked(fetchStructureTree);
const mockedFetchSubjectAllocations = vi.mocked(fetchSubjectAllocations);
const mockedFetchSubjects = vi.mocked(fetchSubjects);
const mockedUseAcademicYearTermLayoutContext = vi.mocked(
  useAcademicYearTermLayoutContext,
);
const mockedUsePermissions = vi.mocked(usePermissions);
const mockedUseAcademicContextBarActions = vi.mocked(
  useAcademicContextBarActions,
);

function mockAcademicContext(termStatus: string) {
  mockedUseAcademicYearTermLayoutContext.mockReturnValue({
    academicYearId: "year-1",
    termId: "term-1",
    termStatus,
    academicYears: [
      { id: "year-1", name: "2026", nameAr: "2026", nameEn: "2026" },
    ],
    terms: [
      {
        id: "term-1",
        academicYearId: "year-1",
        name: "Term 1",
        nameAr: "Term 1 AR",
        nameEn: "Term 1",
        status: termStatus,
      },
    ],
  } as ReturnType<typeof useAcademicYearTermLayoutContext>);
}

function mockPermissions(permissions: string[]) {
  mockedUsePermissions.mockReturnValue({
    hasPermission: (permission: string) => permissions.includes(permission),
  } as ReturnType<typeof usePermissions>);
}

function mockSubjectAllocationBackend() {
  mockedFetchStructureTree.mockResolvedValue({
    stages: [
      {
        id: "stage-1",
        name: "Stage 1",
        nameAr: "Stage 1 AR",
        nameEn: "Stage 1",
        order: 1,
      },
    ],
    grades: [
      {
        id: "grade-1",
        stageId: "stage-1",
        name: "Grade 1",
        nameAr: "Grade 1 AR",
        nameEn: "Grade 1",
        order: 1,
      },
    ],
  });
  mockedFetchSubjects.mockResolvedValue([
    {
      id: "subject-1",
      name: "Math",
      nameAr: "Math AR",
      nameEn: "Math",
      code: "MATH",
      color: "#2563eb",
      isActive: true,
    },
  ]);
  mockedFetchSubjectAllocations.mockResolvedValue([
    {
      id: "subject-allocation-1",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      weeklyHours: 5,
    },
  ]);
}

describe("SubjectsAllocationContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSearchParams.current = "";
    mockAcademicContext("open");
    mockPermissions(["academics.subjects.view", "academics.subjects.manage"]);
    mockSubjectAllocationBackend();
  });

  it("loads backend subject allocation rows into the view", async () => {
    render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          grades: [expect.objectContaining({ id: "grade-1" })],
          subjects: [expect.objectContaining({ id: "subject-1" })],
          allocations: [
            expect.objectContaining({
              id: "subject-allocation-1",
              weeklyHours: 5,
            }),
          ],
        }),
      );
    });
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });

  it("applies grade and subject query filters to the server allocation read", async () => {
    mockedSearchParams.current = "gradeId=grade-1&subjectId=subject-1";

    render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedFetchSubjectAllocations).toHaveBeenCalledWith("term-1", {
        gradeId: "grade-1",
        subjectId: "subject-1",
      });
    });
  });

  it("keeps the page visible and shows matrix loading while filter results reload", async () => {
    const { rerender } = render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isMatrixLoading: false,
        }),
      );
    });

    mockedSearchParams.current = "gradeId=grade-1";
    mockedFetchSubjectAllocations.mockReturnValueOnce(new Promise(() => undefined));

    rerender(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isMatrixLoading: true,
        }),
      );
    });
    expect(screen.getByText("loaded")).toBeInTheDocument();
    expect(screen.getByText("matrix-loading")).toBeInTheDocument();
  });

  it("shows a mapped API error when loading fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedFetchSubjectAllocations.mockRejectedValueOnce(
      new ApiError(
        "Backend message",
        422,
        "academics.subject_allocation.invalid_scope",
      ),
    );

    try {
      render(<SubjectsAllocationContainer />);

      expect(
        await screen.findByText(
          "The subject allocation is outside the selected academic scope.",
        ),
      ).toBeInTheDocument();
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          apiError:
            "The subject allocation is outside the selected academic scope.",
        }),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("does not load data when the user lacks view permission", () => {
    mockPermissions([]);

    render(<SubjectsAllocationContainer />);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(mockedFetchStructureTree).not.toHaveBeenCalled();
    expect(mockedFetchSubjectAllocations).not.toHaveBeenCalled();
  });

  it("disables write actions for closed terms", async () => {
    mockAcademicContext("closed");

    render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isReadOnly: true,
        }),
      );
    });
    expect(screen.getByText("read-only")).toBeInTheDocument();
  });

  it("keeps an open term distinct from missing manage permission", async () => {
    mockPermissions(["academics.subjects.view"]);

    render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedSubjectsAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isReadOnly: true,
          isTermClosed: false,
        }),
      );
    });
  });

  it("does not expose carry-over without backend support", async () => {
    render(<SubjectsAllocationContainer />);

    await waitFor(() => {
      expect(mockedUseAcademicContextBarActions).toHaveBeenLastCalledWith({
        showPromoteCarryOver: false,
      });
    });
  });
});
