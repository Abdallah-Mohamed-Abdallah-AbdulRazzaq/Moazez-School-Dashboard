import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import AcademicContentTable from "../../components/library/AcademicContentTable";
import type {
  AcademicContentDetail,
  AcademicContentLibraryItem,
} from "../../types/contracts";
import { AcademicContentEditorView } from "../AcademicContentEditorPage";
import CreateAcademicContentPage from "../CreateAcademicContentPage";

const workflowState = vi.hoisted(() => ({
  create: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: workflowState.push }),
  usePathname: () => "/en/academic-content-hub",
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isPermissionsReady: true,
  }),
}));

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: "open",
      isInitializing: false,
      selectedTerm: null,
    }),
  }),
);

vi.mock("../../services/academicContentApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/academicContentApi")>()),
  createAcademicContent: workflowState.create,
}));

vi.mock("../../services/academicContentSelectors", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../../services/academicContentSelectors")
  >();
  return {
    ...original,
    loadAcademicTargetOptions: vi.fn(async () => ({
      structure: { stages: [], grades: [], sections: [], classrooms: [] },
      subjects: [],
      subjectAllocations: [],
      teacherAllocations: [],
    })),
  };
});

function workflowContent(status: AcademicContentDetail["status"] = "DRAFT") {
  return {
    id: "content-workflow",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GUARDIAN_WEEKLY_NOTE",
    audience: "GUARDIANS",
    title: "Week one note",
    description: null,
    status,
    archivedAt: status === "ARCHIVED" ? "2026-09-30T08:00:00.000Z" : null,
    createdAt: "2026-09-30T08:00:00.000Z",
    updatedAt: "2026-09-30T08:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: { body: "Initial note", priority: "NORMAL", requiresAcknowledgement: false },
  } satisfies AcademicContentDetail;
}

function workflowEditor(status: AcademicContentDetail["status"] = "DRAFT") {
  const dirtySection = { dirty: true, saving: false, error: null };
  return {
    content: workflowContent(status),
    readiness: { canAdvance: true, blockingReasons: [] },
    isLoading: false,
    isReadOnly: status === "ARCHIVED",
    error: null,
    sections: {
      metadata: dirtySection,
      targets: dirtySection,
      details: dirtySection,
      links: dirtySection,
      tags: dirtySection,
      files: dirtySection,
    },
    hasUnsavedChanges: false,
    markSectionDirty: vi.fn(),
    applyContentBase: vi.fn(),
    saveMetadata: vi.fn(async () => true),
    saveTargets: vi.fn(async () => true),
    saveLinks: vi.fn(async () => true),
    saveTags: vi.fn(async () => true),
    savePreparationDetails: vi.fn(async () => true),
    saveWeeklyPlanDetails: vi.fn(async () => true),
    saveGuardianNoteDetails: vi.fn(async () => true),
    saveSubjectResourceDetails: vi.fn(async () => true),
    saveOnlineSessionDetails: vi.fn(async () => true),
    refreshAggregate: vi.fn(async () => undefined),
    refreshReadiness: vi.fn(async () => undefined),
    reload: vi.fn(),
  } as unknown as ReturnType<typeof useAcademicContentEditor>;
}

function openSection(name: string) {
  fireEvent.click(screen.getAllByRole("button", { name })[0]);
}

describe("Academic Content authoring workflow", () => {
  beforeEach(() => {
    workflowState.create.mockReset();
    workflowState.push.mockReset();
  });

  it("loads the library, creates a draft, and completes every Wave 1+2 authoring step", async () => {
    workflowState.create.mockResolvedValue({ id: "created-content" });
    const onOpen = vi.fn();
    const libraryItem: AcademicContentLibraryItem = {
      id: "library-content",
      academicYearId: "year-1",
      termId: "term-1",
      type: "GENERAL_RESOURCE",
      audience: "INTERNAL_STAFF",
      title: "Library resource",
      description: null,
      status: "DRAFT",
      archivedAt: null,
      createdAt: "2026-09-30T08:00:00.000Z",
      updatedAt: "2026-09-30T08:00:00.000Z",
      summary: null,
    };
    const library = render(
      <AcademicContentTable
        items={[libraryItem]}
        page={1}
        limit={50}
        total={1}
        isLoading={false}
        searchQuery=""
        onOpen={onOpen}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Library resource"));
    expect(onOpen).toHaveBeenCalledWith(libraryItem);
    library.unmount();

    const create = render(<CreateAcademicContentPage />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Created draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() => expect(workflowState.create).toHaveBeenCalledOnce());
    expect(workflowState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/created-content?year=year-1&term=term-1",
    );
    create.unmount();

    const editor = workflowEditor();
    render(<AcademicContentEditorView editor={editor} canManage />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated guardian note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save basic information" }));

    openSection("Targets");
    await screen.findByRole("button", { name: "Add target" });
    fireEvent.click(screen.getByRole("button", { name: "Add target" }));
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));

    openSection("Type details");
    fireEvent.change(screen.getByLabelText("Note body"), {
      target: { value: "Please review the weekly plan." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));

    openSection("Links");
    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    fireEvent.change(screen.getByLabelText("Link 1 label"), {
      target: { value: "School portal" },
    });
    fireEvent.change(screen.getByLabelText("Link 1 URL"), {
      target: { value: "https://school.example/weekly" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save links" }));

    openSection("Tags");
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(screen.getByLabelText("Tag 1"), { target: { value: "weekly" } });
    fireEvent.click(screen.getByRole("button", { name: "Save tags" }));

    openSection("Readiness");
    fireEvent.click(screen.getByRole("button", { name: "Refresh readiness" }));

    await waitFor(() => {
      expect(editor.saveMetadata).toHaveBeenCalledOnce();
      expect(editor.saveTargets).toHaveBeenCalledWith([
        {
          scopeType: "SCHOOL",
          stageId: null,
          gradeId: null,
          sectionId: null,
          classroomId: null,
          subjectId: null,
          teacherSubjectAllocationId: null,
        },
      ]);
      expect(editor.saveGuardianNoteDetails).toHaveBeenCalledOnce();
      expect(editor.saveLinks).toHaveBeenCalledWith([
        { label: "School portal", url: "https://school.example/weekly" },
      ]);
      expect(editor.saveTags).toHaveBeenCalledWith([{ value: "weekly" }]);
      expect(editor.refreshReadiness).toHaveBeenCalledOnce();
    });

    expect(screen.queryByText(/submit|approve|publish/i)).not.toBeInTheDocument();
  });

  it("keeps archived content read-only without deferred workflow actions", () => {
    render(<AcademicContentEditorView editor={workflowEditor("ARCHIVED")} canManage />);

    expect(screen.getByRole("status")).toHaveTextContent("Archived content is read-only");
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.queryByText(/submit|approve|publish/i)).not.toBeInTheDocument();
  });
});
