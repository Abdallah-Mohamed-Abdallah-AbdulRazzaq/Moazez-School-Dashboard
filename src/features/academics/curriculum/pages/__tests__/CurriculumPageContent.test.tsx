import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";
import {
  createCurriculum,
  getCurriculum,
  listCurricula,
  listLessonContent,
} from "@/features/academics/curriculum/services/curriculumService";
import CurriculumPageContent from "../CurriculumPageContent";

const routerMocks = {
  push: vi.fn(),
  replace: vi.fn(),
};
const translate = (key: string) => key;
const guardMocks = vi.hoisted(() => ({
  params: null as { confirmDiscard: () => Promise<boolean> } | null,
}));
const navigationMock = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));
const academicContextMock = vi.hoisted(() => ({
  value: {
    academicYearId: "",
    termId: "",
    termStatus: "active",
    selectedTerm: null,
    isInitializing: false,
  },
}));
const localeMock = vi.hoisted(() => ({
  value: "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  useSearchParams: () => navigationMock.searchParams,
}));

vi.mock("next-intl", () => ({
  useLocale: () => localeMock.value,
  useTranslations: () => translate,
}));

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();
  return {
    ...actual,
    useMediaQuery: () => false,
    useTheme: () => ({ breakpoints: { down: () => "" } }),
  };
});

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => academicContextMock.value,
}));

vi.mock("@/features/academics/hooks/useGuardedAcademicContextChange", () => ({
  useGuardedAcademicContextChange: vi.fn(
    (params: { confirmDiscard: () => Promise<boolean> }) => {
      guardMocks.params = params;
    },
  ),
}));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: ({
    cancelLabel,
    confirmLabel,
    isOpen,
    onClose,
    onConfirm,
    title,
  }: {
    cancelLabel: string;
    confirmLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div>
        <p>{title}</p>
        <button type="button" onClick={onClose}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({
    fetchStructureTree: vi.fn(),
  }),
);

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: vi.fn(),
}));

vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({
  archiveCurriculum: vi.fn(),
  activateCurriculum: vi.fn(),
  deleteCurriculum: vi.fn(),
  createCurriculum: vi.fn(),
  fetchCurriculumForScope: vi.fn(),
  getCurriculum: vi.fn(),
  listCurricula: vi.fn(),
  listLessonContent: vi.fn().mockResolvedValue([]),
  calculateTermWeeks: vi.fn(() => 0),
}));

vi.mock("@/features/academics/curriculum/services/curriculumErrors", () => ({
  curriculumUiError: () => ({ message: "error" }),
}));

vi.mock("../components/CurriculumOutline", () => ({
  default: ({
    onSelectNode,
  }: {
    onSelectNode: (
      node: { type: "unit" | "lesson"; id: string } | null,
    ) => void;
  }) => (
    <div data-testid="curriculum-outline">
      <button
        type="button"
        onClick={() => onSelectNode({ type: "unit", id: "unit-2" })}
      >
        Select unit two
      </button>
      <button
        type="button"
        onClick={() => onSelectNode({ type: "lesson", id: "lesson-2" })}
      >
        Select lesson two
      </button>
    </div>
  ),
}));

vi.mock("../components/CurriculumEditor", () => ({
  default: ({
    selectedNode,
  }: {
    selectedNode: { type: "unit" | "lesson"; id: string } | null;
  }) => (
    <div data-testid="curriculum-editor">
      {selectedNode ? `${selectedNode.type}:${selectedNode.id}` : "empty"}
    </div>
  ),
}));

vi.mock("../components/CurriculumActionsMenu", () => ({
  default: () => <button type="button">actions</button>,
}));

vi.mock(
  "@/features/academics/shared/components/export/AcademicsGlobalExportModal",
  () => ({
    default: () => <div data-testid="export-modal" />,
  }),
);

vi.mock("@/features/academics/utils/exportAdapter", () => ({
  exportAcademicsData: vi.fn(),
  formatExportDate: () => "2026-07-02",
  generateExportFilename: () => "curriculum.csv",
}));

vi.mock("@/components/ui/loaders/PartialLoader", () => ({
  default: () => <div data-testid="partial-loader" />,
}));

describe("CurriculumPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listLessonContent).mockResolvedValue([]);
    routerMocks.push.mockClear();
    routerMocks.replace.mockClear();
    guardMocks.params = null;
    localeMock.value = "en";
    navigationMock.searchParams = new URLSearchParams();
    academicContextMock.value = {
      academicYearId: "",
      termId: "",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("settles without a render loop while the academic context has no year or term", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<CurriculumPageContent />);

    await waitFor(() => {
      expect(screen.queryByTestId("partial-loader")).not.toBeInTheDocument();
    });

    expect(
      consoleError.mock.calls.some(([message]) =>
        String(message).includes("Maximum update depth exceeded"),
      ),
    ).toBe(false);
    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("resolves an unsaved-change decision as cancelled when the dialog closes", async () => {
    const user = userEvent.setup();
    render(<CurriculumPageContent />);
    await waitFor(() => expect(guardMocks.params).not.toBeNull());

    let decision!: Promise<boolean>;
    act(() => {
      decision = guardMocks.params!.confirmDiscard();
    });
    expect(
      await screen.findByText("unsaved_changes.title"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "unsaved_changes.cancel" }),
    );

    await expect(decision).resolves.toBe(false);
  });

  it("resolves an unsaved-change decision as confirmed", async () => {
    const user = userEvent.setup();
    render(<CurriculumPageContent />);
    await waitFor(() => expect(guardMocks.params).not.toBeNull());

    let decision!: Promise<boolean>;
    act(() => {
      decision = guardMocks.params!.confirmDiscard();
    });
    await user.click(
      await screen.findByRole("button", { name: "unsaved_changes.discard" }),
    );

    await expect(decision).resolves.toBe(true);
  });

  it("shows term curricula overview from subject allocations", async () => {
    const user = userEvent.setup();
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف 1",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
        {
          id: "grade-2",
          name: "Grade 2",
          nameAr: "الصف 2",
          nameEn: "Grade 2",
          stageId: "stage-1",
          capacity: 30,
          order: 2,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        weeklyHours: 5,
        subject: {
          id: "subject-math",
          nameAr: "رياضيات",
          nameEn: "Math",
          code: "MATH",
          color: "#2563eb",
        },
      },
      {
        id: "allocation-2",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-2",
        subjectId: "subject-science",
        weeklyHours: 4,
        subject: {
          id: "subject-science",
          nameAr: "علوم",
          nameEn: "Science",
          code: "SCI",
          color: "#16a34a",
        },
      },
    ]);
    vi.mocked(listCurricula).mockResolvedValue([
      {
        id: "curriculum-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        title: "Math curriculum",
        description: "Term math plan",
        status: "draft",
        rawStatus: "DRAFT",
        publishedAt: null,
        archivedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        academicYear: { id: "year-1", name: "2026" },
        term: { id: "term-1", name: "Term 1" },
        grade: { id: "grade-1", name: "Grade 1" },
        subject: {
          id: "subject-math",
          name: "Math",
          code: "MATH",
          color: "#2563eb",
        },
        unitCount: 2,
        lessonCount: 6,
        units: [],
      },
    ]);
    vi.mocked(createCurriculum).mockResolvedValue({
      id: "curriculum-2",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-2",
      subjectId: "subject-science",
      title: "Science curriculum",
      description: null,
      status: "draft",
      rawStatus: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      academicYear: { id: "year-1", name: "2026" },
      term: { id: "term-1", name: "Term 1" },
      grade: { id: "grade-2", name: "Grade 2" },
      subject: {
        id: "subject-science",
        name: "Science",
        code: "SCI",
        color: "#16a34a",
      },
      unitCount: 0,
      lessonCount: 0,
      units: [],
    });

    render(<CurriculumPageContent />);

    await waitFor(() => {
      expect(fetchSubjectAllocations).toHaveBeenCalledWith("term-1");
    });
    await waitFor(() => {
      expect(listCurricula).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
      });
    });
    expect(screen.getByText("Term curricula")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Math curriculum")).toBeInTheDocument();
    expect(screen.getByText("Term math plan")).toBeInTheDocument();
    expect(getCurriculum).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "actions.create_curriculum" }),
    );

    await user.click(await screen.findByRole("button", { name: "create" }));

    expect(createCurriculum).toHaveBeenCalledWith(
      expect.objectContaining({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-2",
        subjectId: "subject-science",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(routerMocks.push).toHaveBeenCalledWith(
      "/en/academics/curriculum/curriculum-1?year=year-1&term=term-1",
      { scroll: false },
    );
  });

  it("passes overview filters to listCurricula", async () => {
    navigationMock.searchParams = new URLSearchParams(
      "filterGrade=grade-1&filterSubject=subject-math&status=ACTIVE&search=math",
    );
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف 1",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        weeklyHours: 5,
        subject: {
          id: "subject-math",
          nameAr: "رياضيات",
          nameEn: "Math",
          code: "MATH",
          color: "#2563eb",
        },
      },
      {
        id: "allocation-2",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-science",
        weeklyHours: 4,
        subject: {
          id: "subject-science",
          nameAr: "علوم",
          nameEn: "Science",
          code: "SCI",
          color: "#16a34a",
        },
      },
    ]);
    vi.mocked(listCurricula).mockImplementation(async (filters) =>
      filters.subjectId === "subject-science"
        ? [
            {
              id: "curriculum-science",
              academicYearId: "year-1",
              termId: "term-1",
              gradeId: "grade-1",
              subjectId: "subject-science",
              title: "Science curriculum",
              description: null,
              status: "draft",
              rawStatus: "DRAFT",
              publishedAt: null,
              archivedAt: null,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
              academicYear: { id: "year-1", name: "2026" },
              term: { id: "term-1", name: "Term 1" },
              grade: { id: "grade-1", name: "Grade 1" },
              subject: {
                id: "subject-science",
                name: "Science",
                code: "SCI",
                color: "#16a34a",
              },
              unitCount: 0,
              lessonCount: 0,
              units: [],
            },
          ]
        : [],
    );

    render(<CurriculumPageContent />);

    await waitFor(() => {
      expect(listCurricula).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        status: "ACTIVE",
        search: "math",
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(routerMocks.replace).not.toHaveBeenCalledWith(
      "?year=year-1&term=term-1&search=math",
      { scroll: false },
    );
  });

  it("uses localized curriculum grade and subject names in Arabic overview", async () => {
    localeMock.value = "ar";
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "First Grade",
          nameAr: "الصف الاول الابتدائي",
          nameEn: "First Grade",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([
      {
        id: "allocation-2",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-science",
        weeklyHours: 4,
        subject: {
          id: "subject-science",
          nameAr: "العلوم",
          nameEn: "Science",
          code: "SCI",
          color: "#16a34a",
        },
      },
    ]);
    vi.mocked(listCurricula).mockResolvedValue([
      {
        id: "curriculum-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        title: "منهج رياضيات",
        description: null,
        status: "draft",
        rawStatus: "DRAFT",
        publishedAt: null,
        archivedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        academicYear: { id: "year-1", name: "2026" },
        term: { id: "term-1", name: "Term 1" },
        grade: {
          id: "grade-1",
          name: "First Grade",
          nameAr: "الصف الاول الابتدائي",
          nameEn: "First Grade",
        },
        subject: {
          id: "subject-math",
          name: "Mathematics",
          nameAr: "الرياضيات",
          nameEn: "Mathematics",
          code: "MATH",
          color: "#2563eb",
        },
        unitCount: 1,
        lessonCount: 1,
        units: [],
      },
    ]);

    render(<CurriculumPageContent />);

    expect(await screen.findAllByText("الصف الاول الابتدائي")).not.toHaveLength(
      0,
    );
    expect(screen.getByText("الرياضيات")).toBeInTheDocument();
    expect(screen.queryByText("First Grade")).not.toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("loads detail route by curriculum id and returns to all curricula route", async () => {
    const user = userEvent.setup();
    navigationMock.searchParams = new URLSearchParams(
      "year=year-1&term=term-1&grade=grade-1&subject=subject-math",
    );
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف 1",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        weeklyHours: 5,
        subject: {
          id: "subject-math",
          nameAr: "رياضيات",
          nameEn: "Math",
          code: "MATH",
          color: "#2563eb",
        },
      },
      {
        id: "allocation-2",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-science",
        weeklyHours: 4,
        subject: {
          id: "subject-science",
          nameAr: "علوم",
          nameEn: "Science",
          code: "SCI",
          color: "#16a34a",
        },
      },
    ]);
    vi.mocked(listCurricula).mockImplementation(async (filters) =>
      filters.subjectId === "subject-science"
        ? [
            {
              id: "curriculum-science",
              academicYearId: "year-1",
              termId: "term-1",
              gradeId: "grade-1",
              subjectId: "subject-science",
              title: "Science curriculum",
              description: null,
              status: "draft",
              rawStatus: "DRAFT",
              publishedAt: null,
              archivedAt: null,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
              academicYear: { id: "year-1", name: "2026" },
              term: { id: "term-1", name: "Term 1" },
              grade: { id: "grade-1", name: "Grade 1" },
              subject: {
                id: "subject-science",
                name: "Science",
                code: "SCI",
                color: "#16a34a",
              },
              unitCount: 0,
              lessonCount: 0,
              units: [],
            },
          ]
        : [],
    );
    vi.mocked(getCurriculum).mockResolvedValue({
      id: "curriculum-1",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-math",
      title: "Math curriculum",
      description: "Term math plan",
      status: "draft",
      rawStatus: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      academicYear: { id: "year-1", name: "2026" },
      term: { id: "term-1", name: "Term 1" },
      grade: { id: "grade-1", name: "Grade 1" },
      subject: {
        id: "subject-math",
        name: "Math",
        code: "MATH",
        color: "#2563eb",
      },
      unitCount: 2,
      lessonCount: 6,
      units: [
        {
          id: "unit-1",
          curriculumId: "curriculum-1",
          title: "Numbers",
          description: null,
          sortOrder: 0,
          estimatedLessons: 1,
          lessonCount: 1,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          lessons: [
            {
              id: "lesson-2",
              curriculumId: "curriculum-1",
              unitId: "unit-1",
              title: "Integers",
              description: null,
              objectives: [],
              sortOrder: 0,
              estimatedMinutes: 45,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
            },
          ],
        },
      ],
    });

    const { rerender } = render(
      <CurriculumPageContent view="detail" curriculumId="curriculum-1" />,
    );

    await waitFor(() => {
      expect(getCurriculum).toHaveBeenCalledWith("curriculum-1");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(getCurriculum).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Term curricula")).not.toBeInTheDocument();
    expect(screen.getByText("Math curriculum")).toBeInTheDocument();
    expect(screen.getByText("Term math plan")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions.activate_curriculum" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions.archive_curriculum" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions.delete_curriculum" }),
    ).toBeInTheDocument();

    routerMocks.replace.mockClear();
    await user.click(screen.getByText("Integers"));

    expect(screen.getByRole("button", { name: "learning_content" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "learning_content" }));

    expect(screen.getByRole("region", { name: "title" })).toBeInTheDocument();
    navigationMock.searchParams = new URLSearchParams(window.location.search);
    rerender(
      <CurriculumPageContent view="detail" curriculumId="curriculum-1" />,
    );

    await waitFor(() => {
      expect(routerMocks.replace).not.toHaveBeenCalledWith(
        "?year=year-1&term=term-1",
        { scroll: false },
      );
    });

    await user.click(screen.getByRole("button", { name: "back_to_form" }));

    expect(screen.queryByRole("region", { name: "title" })).not.toBeInTheDocument();

    routerMocks.replace.mockClear();
    await user.click(await screen.findByText("Numbers"));
    navigationMock.searchParams = new URLSearchParams(window.location.search);
    rerender(
      <CurriculumPageContent view="detail" curriculumId="curriculum-1" />,
    );

    expect(window.location.search).toContain("unit=unit-1");
    expect(routerMocks.replace).not.toHaveBeenCalledWith(
      "?year=year-1&term=term-1",
      { scroll: false },
    );

    await user.click(screen.getByRole("button", { name: "All curricula" }));

    expect(routerMocks.push).toHaveBeenCalledWith(
      "/en/academics/curriculum?year=year-1&term=term-1",
      { scroll: false },
    );

    routerMocks.push.mockClear();
    await user.click(screen.getByRole("button", { name: "filters.subject *" }));
    await user.click(await screen.findByRole("button", { name: "Science" }));

    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith(
        "/en/academics/curriculum/curriculum-science?year=year-1&term=term-1",
        { scroll: false },
      );
    });
  });

  it("does not show setup empty states while a detail curriculum is loading", async () => {
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف 1",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([]);
    vi.mocked(listCurricula).mockResolvedValue([]);
    vi.mocked(getCurriculum).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(<CurriculumPageContent view="detail" curriculumId="curriculum-1" />);

    await waitFor(() => {
      expect(fetchSubjectAllocations).toHaveBeenCalledWith("term-1");
    });
    expect(screen.getByTestId("partial-loader")).toBeInTheDocument();
    expect(screen.queryByText("no_subjects.title")).not.toBeInTheDocument();
  });

  it("keeps an in-flight detail curriculum load when academic context changes", async () => {
    academicContextMock.value = {
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    vi.mocked(fetchStructureTree).mockResolvedValue({
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "Grade 1",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 30,
          order: 1,
        },
      ],
      stages: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        weeklyHours: 5,
        subject: {
          id: "subject-math",
          nameAr: "Math",
          nameEn: "Math",
          code: "MATH",
          color: "#2563eb",
        },
      },
    ]);
    vi.mocked(listCurricula).mockResolvedValue([]);
    let resolveCurriculum!: (
      curriculum: Awaited<ReturnType<typeof getCurriculum>>,
    ) => void;
    vi.mocked(getCurriculum).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurriculum = resolve;
        }),
    );

    const { rerender } = render(
      <CurriculumPageContent view="detail" curriculumId="curriculum-1" />,
    );

    await waitFor(() => {
      expect(getCurriculum).toHaveBeenCalledWith("curriculum-1");
    });

    academicContextMock.value = {
      academicYearId: "year-2",
      termId: "term-2",
      termStatus: "active",
      selectedTerm: null,
      isInitializing: false,
    };
    rerender(
      <CurriculumPageContent view="detail" curriculumId="curriculum-1" />,
    );

    await act(async () => {
      resolveCurriculum({
        id: "curriculum-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-math",
        title: "Math curriculum",
        description: "Term math plan",
        status: "draft",
        rawStatus: "DRAFT",
        publishedAt: null,
        archivedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        academicYear: { id: "year-1", name: "2026" },
        term: { id: "term-1", name: "Term 1" },
        grade: { id: "grade-1", name: "Grade 1" },
        subject: {
          id: "subject-math",
          name: "Math",
          code: "MATH",
          color: "#2563eb",
        },
        unitCount: 2,
        lessonCount: 6,
        units: [],
      });
    });

    expect(screen.getByText("Math curriculum")).toBeInTheDocument();
    expect(screen.queryByTestId("partial-loader")).not.toBeInTheDocument();
  });

});
