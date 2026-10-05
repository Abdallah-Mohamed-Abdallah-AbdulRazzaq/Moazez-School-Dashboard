import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { AcademicContentEditorView } from "../AcademicContentEditorPage";

const academicContentBoundaries = vi.hoisted(() => ({
  loadTargets: vi.fn().mockResolvedValue({
    structure: { stages: [], grades: [], sections: [], classrooms: [] },
    subjects: [],
    subjectAllocations: [],
    teacherAllocations: [],
  }),
  loadDetails: vi.fn().mockResolvedValue({
    curricula: [],
    lessonPlans: [],
    homeworkAssignments: [],
    assessments: [],
    timetableEntries: [],
  }),
}));

vi.mock("../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: academicContentBoundaries.loadTargets,
}));

vi.mock(
  "../../services/academicContentDetailOptions",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("../../services/academicContentDetailOptions")
      >();
    return {
      ...original,
      loadAcademicContentDetailOptions: academicContentBoundaries.loadDetails,
    };
  },
);

vi.mock(
  "../../components/preparation-detail/TeacherPreparationEditorView",
  () => ({
    default: () => <section aria-label="Teacher preparation workspace" />,
  }),
);

vi.mock("../../components/guardian-note-detail/GuardianNoteEditorView", () => ({
  default: () => <section aria-label="Guardian note workspace" />,
}));

vi.mock("../../components/publication/AcademicContentPublicationPanel", () => ({
  default: ({
    canMutate,
    onContentChanged,
  }: {
    canMutate: boolean;
    onContentChanged: () => Promise<unknown>;
  }) => (
    <section aria-label="Publication workspace">
      <span>
        {canMutate ? "Publication mutations enabled" : "Publication read only"}
      </span>
      <button type="button" onClick={() => void onContentChanged()}>
        Refresh publication content
      </button>
    </section>
  ),
}));

function detail(
  status: AcademicContentDetail["status"] = "DRAFT",
  overrides: Partial<AcademicContentDetail> = {},
): AcademicContentDetail {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: "Reference pack",
    description: "Useful references",
    status,
    archivedAt: status === "ARCHIVED" ? "2026-09-29T08:00:00.000Z" : null,
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T08:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
    ...overrides,
  } as AcademicContentDetail;
}

function editorState(
  status: AcademicContentDetail["status"] = "DRAFT",
  metadataDirty = false,
  contentOverrides: Partial<AcademicContentDetail> = {},
) {
  return {
    content: detail(status, contentOverrides),
    readiness: { canAdvance: true, blockingReasons: [] },
    isLoading: false,
    isReadOnly: status !== "DRAFT" && status !== "CHANGES_REQUESTED",
    error: null,
    sections: {
      metadata: { dirty: metadataDirty, saving: false, error: null },
      targets: { dirty: false, saving: false, error: null },
      details: { dirty: false, saving: false, error: null },
      links: { dirty: false, saving: false, error: null },
      tags: { dirty: false, saving: false, error: null },
      files: { dirty: false, saving: false, error: null },
    },
    hasUnsavedChanges: false,
    markSectionDirty: vi.fn(),
    applyContentBase: vi.fn(),
    applyContentTransition: vi.fn(),
    refreshAggregate: vi.fn(async () => undefined),
    refreshReadiness: vi.fn(async () => undefined),
    saveMetadata: vi.fn(async () => true),
    saveTargets: vi.fn(async () => true),
    saveLinks: vi.fn(async () => true),
    saveTags: vi.fn(async () => true),
    savePreparationDetails: vi.fn(async () => true),
    saveWeeklyPlanDetails: vi.fn(async () => true),
    saveGuardianNoteDetails: vi.fn(async () => true),
    saveSubjectResourceDetails: vi.fn(async () => true),
    saveOnlineSessionDetails: vi.fn(async () => true),
    reload: vi.fn(),
  } as const;
}

describe("AcademicContentEditorPage", () => {
  it("routes weekly plans to their dedicated workspace", () => {
    render(
      <AcademicContentEditorView
        editor={editorState("DRAFT", false, {
          type: "WEEKLY_PLAN",
          audience: "STUDENTS",
        })}
        canManage
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );

    expect(
      screen.getByRole("main", { name: "Weekly plan workspace" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Teacher preparation workspace" }),
    ).toBeNull();
  });

  it("routes guardian notes to their dedicated workspace", () => {
    render(
      <AcademicContentEditorView
        editor={editorState("DRAFT", false, {
          type: "GUARDIAN_WEEKLY_NOTE",
          audience: "GUARDIANS",
        })}
        canManage
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );

    expect(
      screen.getByRole("region", { name: "Guardian note workspace" }),
    ).toBeVisible();
  });

  it("routes subject resources to their dedicated workspace", async () => {
    render(
      <AcademicContentEditorView
        editor={editorState("DRAFT", false, {
          type: "SUBJECT_RESOURCE",
          audience: "STUDENTS",
        })}
        canManage
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );

    expect(
      screen.getByRole("main", { name: "Subject resource workspace" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(academicContentBoundaries.loadTargets).toHaveBeenCalled();
      expect(academicContentBoundaries.loadDetails).toHaveBeenCalled();
    });
  });

  it("shows immutable context and saves metadata explicitly", async () => {
    const editor = editorState("DRAFT", true);
    render(
      <AcademicContentEditorView
        editor={editor}
        canManage
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );

    expect(screen.getByText("General resource")).toBeInTheDocument();
    expect(screen.getByText("Academic year 2026/2027")).toBeInTheDocument();
    expect(screen.getByText("First term")).toBeInTheDocument();
    expect(screen.queryByText("year-1")).not.toBeInTheDocument();
    expect(screen.queryByText("term-1")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("status", { name: "Unsaved changes" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("status", { name: "Ready" })).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save basic information" }),
    );

    expect(editor.markSectionDirty).toHaveBeenCalledWith("metadata", true);
    expect(editor.saveMetadata).toHaveBeenCalledWith({
      title: "Updated title",
      description: "Useful references",
      audience: "INTERNAL_STAFF",
    });
  });

  it.each(["SUBMITTED", "APPROVED", "ARCHIVED"] as const)(
    "renders %s content as read-only",
    (status) => {
      render(
        <AcademicContentEditorView
          editor={editorState(status)}
          canManage
          academicYearName="Academic year 2026/2027"
          termName="First term"
        />,
      );

      expect(
        screen.getByText("This content is read-only in its current status."),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Save basic information" }),
      ).not.toBeInTheDocument();
    },
  );

  it("uses text and aria-current to identify the active responsive section", () => {
    render(
      <AcademicContentEditorView
        editor={editorState()}
        canManage
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );

    const basicInformationTabs = screen.getAllByRole("button", {
      name: "Basic information",
    });
    expect(
      basicInformationTabs.some(
        (tab) => tab.getAttribute("aria-current") === "true",
      ),
    ).toBe(true);
  });

  it.each([
    ["GENERAL_RESOURCE", "STUDENTS", true],
    ["TEACHER_PREPARATION", "INTERNAL_STAFF", false],
    ["GENERAL_RESOURCE", "INTERNAL_STAFF", false],
  ] as const)(
    "maps %s/%s to publication availability=%s",
    (type, audience, expected) => {
      render(
        <AcademicContentEditorView
          editor={editorState("DRAFT", false, { type, audience })}
          canManage
          canPublish
          academicYearName="Academic year 2026/2027"
          termName="First term"
        />,
      );

      const publicationTabs = screen.queryAllByRole("button", {
        name: "Publication",
      });
      expect(publicationTabs.length > 0).toBe(expected);
    },
  );

  it("gates publication mutations independently from content management", () => {
    const editor = editorState("DRAFT", false, {
      audience: "STUDENTS",
    });
    const { rerender } = render(
      <AcademicContentEditorView
        editor={editor}
        canManage={false}
        canPublish={false}
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Publication" })[0]);
    expect(screen.getByText("Publication read only")).toBeInTheDocument();

    rerender(
      <AcademicContentEditorView
        editor={editor}
        canManage={false}
        canPublish
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );
    expect(
      screen.getByText("Publication mutations enabled"),
    ).toBeInTheDocument();
  });

  it.each(["SCHEDULED", "PUBLISHED", "EXPIRED", "CANCELLED"] as const)(
    "keeps authoring read-only for publication status %s",
    (status) => {
      render(
        <AcademicContentEditorView
          editor={editorState(status, false, { audience: "STUDENTS" })}
          canManage
          canPublish
          academicYearName="Academic year 2026/2027"
          termName="First term"
        />,
      );
      expect(screen.getByLabelText("Title")).toBeDisabled();
    },
  );

  it("refreshes aggregate content and readiness after publication changes", async () => {
    const editor = editorState("DRAFT", false, { audience: "STUDENTS" });
    render(
      <AcademicContentEditorView
        editor={editor}
        canManage
        canPublish
        academicYearName="Academic year 2026/2027"
        termName="First term"
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Publication" })[0]);
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh publication content" }),
    );

    expect(editor.refreshAggregate).toHaveBeenCalledOnce();
    expect(editor.refreshReadiness).toHaveBeenCalledOnce();
  });
});
