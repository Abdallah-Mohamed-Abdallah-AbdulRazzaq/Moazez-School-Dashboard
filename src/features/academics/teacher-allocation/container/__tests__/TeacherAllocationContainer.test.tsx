import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherAllocationContainer from "@/features/academics/teacher-allocation/container/TeacherAllocationContainer";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherDirectory,
  fetchTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";

const { mockedTeacherAllocationView } = vi.hoisted(() => ({
  mockedTeacherAllocationView: vi.fn(),
}));

vi.mock("@/features/academics/teacher-allocation/views/TeacherAllocationView", () => ({
  default: (props: {
    canView: boolean;
    isReadOnly: boolean;
    isLoading: boolean;
  }) => {
    mockedTeacherAllocationView(props);
    return (
      <div>
        <span>{props.canView ? "can-view" : "Access denied"}</span>
        <span>{props.isReadOnly ? "readOnlyBanner" : "editable"}</span>
        <span>{props.isLoading ? "loading" : "loaded"}</span>
        <button disabled={props.isReadOnly}>actions.save</button>
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

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherDirectory: vi.fn(),
  fetchTeacherAllocations: vi.fn(),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: vi.fn(),
}));

vi.mock("@/features/academics/hooks/useAcademicContextBarActions", () => ({
  useAcademicContextBarActions: vi.fn(),
}));

vi.mock("@/hooks/useDirtyKey", () => ({
  useDirtyKey: () => ({
    clearDirty: vi.fn(),
    markDirty: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showToast: vi.fn(),
  }),
}));

const mockedFetchStructureTree = vi.mocked(fetchStructureTree);
const mockedFetchSubjectAllocations = vi.mocked(fetchSubjectAllocations);
const mockedFetchSubjects = vi.mocked(fetchSubjects);
const mockedFetchTeacherDirectory = vi.mocked(fetchTeacherDirectory);
const mockedFetchTeacherAllocations = vi.mocked(fetchTeacherAllocations);
const mockedUseAcademicYearTermLayoutContext = vi.mocked(useAcademicYearTermLayoutContext);
const mockedUsePermissions = vi.mocked(usePermissions);

function mockAcademicContext(termStatus: string) {
  mockedUseAcademicYearTermLayoutContext.mockReturnValue({
    academicYearId: "year-1",
    termId: "term-1",
    termStatus,
    academicYears: [{ id: "year-1", name: "2026", nameAr: "2026", nameEn: "2026" }],
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

function mockTeacherAllocationBackend() {
  mockedFetchStructureTree.mockResolvedValue({
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
    sections: [
      {
        id: "section-1",
        gradeId: "grade-1",
        name: "Section A",
        nameAr: "Section A AR",
        nameEn: "Section A",
        order: 1,
      },
    ],
    classrooms: [
      {
        id: "classroom-1",
        sectionId: "section-1",
        name: "Classroom A",
        nameAr: "Classroom A AR",
        nameEn: "Classroom A",
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
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      weeklyHours: 5,
    },
  ]);
  mockedFetchTeacherDirectory.mockResolvedValue({
    roleId: "teacher-role-1",
    teachers: [
      {
        id: "teacher-user-1",
        nameAr: "Teacher One AR",
        nameEn: "Teacher One",
        isActive: true,
      },
    ],
  });
  mockedFetchTeacherAllocations.mockResolvedValue([]);
}

describe("TeacherAllocationContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcademicContext("open");
    mockPermissions(["academics.structure.view", "academics.structure.manage"]);
    mockTeacherAllocationBackend();
  });

  it("does not load allocations when the user lacks view permission", async () => {
    mockPermissions([]);

    render(<TeacherAllocationContainer />);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(mockedTeacherAllocationView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        canView: false,
      }),
    );
    expect(mockedFetchTeacherAllocations).not.toHaveBeenCalled();
  });

  it("disables write actions when the user lacks manage permission", async () => {
    mockPermissions(["academics.structure.view"]);

    render(<TeacherAllocationContainer />);

    await waitFor(() => {
      expect(mockedTeacherAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isReadOnly: true,
        }),
      );
    });
    expect(screen.getByText("readOnlyBanner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /actions\.save/i })).toBeDisabled();
    expect(mockedFetchTeacherAllocations).toHaveBeenCalledWith("term-1");
  });

  it("keeps an open term distinct from missing manage permission", async () => {
    mockPermissions(["academics.structure.view"]);

    render(<TeacherAllocationContainer />);

    await waitFor(() => {
      expect(mockedTeacherAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isReadOnly: true,
          isTermClosed: false,
        }),
      );
    });
  });

  it("disables write actions for closed terms", async () => {
    mockAcademicContext("closed");

    render(<TeacherAllocationContainer />);

    await waitFor(() => {
      expect(mockedTeacherAllocationView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          isReadOnly: true,
        }),
      );
    });
    expect(screen.getByRole("button", { name: /actions\.save/i })).toBeDisabled();
  });
});
