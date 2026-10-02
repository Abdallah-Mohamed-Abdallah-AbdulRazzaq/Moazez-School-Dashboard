import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useAcademicContentEditor } from "../../hooks/useAcademicContentEditor";
import AcademicContentTable from "../../components/library/AcademicContentTable";
import RevisionSnapshotView from "../../components/editor/RevisionSnapshotView";
import ReviewDecisionActions from "../../components/review/ReviewDecisionActions";
import AcademicContentWorkflowPanel from "../../components/workflow/AcademicContentWorkflowPanel";
import type {
  AcademicContentApprovalHistoryItem,
  AcademicContentDetail,
  AcademicContentLibraryItem,
  AcademicContentRevisionDetail,
} from "../../types/contracts";
import { AcademicContentEditorView } from "../AcademicContentEditorPage";
import CreateAcademicContentPage from "../CreateAcademicContentPage";

const workflowState = vi.hoisted(() => ({
  create: vi.fn(),
  getPolicy: vi.fn(),
  listHistory: vi.fn(),
  submit: vi.fn(),
  requestChanges: vi.fn(),
  approve: vi.fn(),
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
  getAcademicContentWorkflowPolicy: workflowState.getPolicy,
  listAcademicContentApprovalHistory: workflowState.listHistory,
  submitAcademicContent: workflowState.submit,
  requestAcademicContentChanges: workflowState.requestChanges,
  approveAcademicContent: workflowState.approve,
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
    applyContentTransition: vi.fn(),
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

function preparation(
  status: AcademicContentDetail["status"] = "DRAFT",
): Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }> {
  return {
    ...workflowContent(status),
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    title: "Fractions preparation",
    details: {
      topic: "Compare fractions",
      objectives: [],
      learningOutcomes: [],
      teachingStrategies: [],
      activities: [],
      resourceNotes: null,
      assessmentNotes: null,
      teacherNotes: null,
      curriculumId: null,
      curriculumUnitId: null,
      curriculumLessonId: null,
      lessonPlanId: null,
      lessonPlanItemId: null,
      timetableEntryId: null,
    },
  };
}

function revision(
  id: string,
  revisionNumber: number,
  topic: string,
): AcademicContentRevisionDetail {
  return {
    id,
    revisionNumber,
    snapshotContractVersion: 2,
    sourceStatus: "CHANGES_REQUESTED",
    title: `Fractions submission ${revisionNumber}`,
    capturedAt: "2026-10-02T08:00:00.000Z",
    academicContentId: "content-workflow",
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    description: null,
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: { topic },
  };
}

function openSection(name: string) {
  fireEvent.click(screen.getAllByRole("button", { name })[0]);
}

describe("Academic Content authoring workflow", () => {
  beforeEach(() => {
    workflowState.create.mockReset();
    workflowState.getPolicy.mockReset();
    workflowState.listHistory.mockReset();
    workflowState.submit.mockReset();
    workflowState.requestChanges.mockReset();
    workflowState.approve.mockReset();
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

    expect(screen.getByRole("status")).toHaveTextContent(
      "This content is read-only in its current status.",
    );
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.queryByText(/submit|approve|publish/i)).not.toBeInTheDocument();
  });

  it("completes two immutable review rounds and leaves approved content read-only", async () => {
    const history: AcademicContentApprovalHistoryItem[] = [];
    workflowState.getPolicy.mockResolvedValue({
      preparationApprovalRequired: true,
    });
    workflowState.listHistory.mockImplementation(async () => ({
      items: [...history],
      page: 1,
      limit: 50,
      total: history.length,
    }));
    workflowState.submit
      .mockResolvedValueOnce({
        contentId: "content-workflow",
        contentStatus: "SUBMITTED",
        approvalId: "approval-1",
        approvalStatus: "PENDING",
        revisionId: "revision-1",
        roundNumber: 1,
        submittedAt: "2026-10-02T08:00:00.000Z",
        decidedAt: null,
      })
      .mockResolvedValueOnce({
        contentId: "content-workflow",
        contentStatus: "SUBMITTED",
        approvalId: "approval-2",
        approvalStatus: "PENDING",
        revisionId: "revision-2",
        roundNumber: 2,
        submittedAt: "2026-10-02T10:00:00.000Z",
        decidedAt: null,
      });

    const onFirstSubmission = vi.fn();
    const firstRound = render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={onFirstSubmission}
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Submit for review" }),
    );
    await waitFor(() => expect(onFirstSubmission).toHaveBeenCalledOnce());
    const firstRevisionId = onFirstSubmission.mock.calls[0][0].revisionId;
    firstRound.unmount();

    workflowState.requestChanges.mockResolvedValue({
      contentId: "content-workflow",
      contentStatus: "CHANGES_REQUESTED",
      approvalId: "approval-1",
      approvalStatus: "CHANGES_REQUESTED",
      revisionId: firstRevisionId,
      roundNumber: 1,
      submittedAt: "2026-10-02T08:00:00.000Z",
      decidedAt: "2026-10-02T09:00:00.000Z",
    });
    const onChangesRequested = vi.fn();
    const firstReview = render(
      <>
        <RevisionSnapshotView
          revision={revision(firstRevisionId, 1, "Compare fractions")}
        />
        <ReviewDecisionActions
          contentId="content-workflow"
          reviewedRevisionId={firstRevisionId}
          onDecisionComplete={onChangesRequested}
        />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Change request note"), {
      target: { value: "Add measurable outcomes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    await waitFor(() => expect(onChangesRequested).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request changes" }),
      ).toBeEnabled(),
    );
    expect(workflowState.requestChanges).toHaveBeenCalledWith(
      "content-workflow",
      "Add measurable outcomes",
    );
    firstReview.unmount();

    history.unshift({
      approvalId: "approval-1",
      revisionId: firstRevisionId,
      roundNumber: 1,
      status: "CHANGES_REQUESTED",
      submittedByUserId: "teacher-1",
      submittedAt: "2026-10-02T08:00:00.000Z",
      decidedByUserId: "reviewer-1",
      decidedAt: "2026-10-02T09:00:00.000Z",
      decisionNote: "Add measurable outcomes",
    });
    const onSecondSubmission = vi.fn();
    const secondRound = render(
      <AcademicContentWorkflowPanel
        content={preparation("CHANGES_REQUESTED")}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges
        onSubmitted={onSecondSubmission}
      />,
    );
    expect(
      await screen.findByRole("note", { name: "Latest decision note" }),
    ).toHaveTextContent("Add measurable outcomes");
    expect(
      screen.getByRole("button", { name: "Resubmit for review" }),
    ).toBeDisabled();
    secondRound.rerender(
      <AcademicContentWorkflowPanel
        content={preparation("CHANGES_REQUESTED")}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={onSecondSubmission}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Resubmit for review" }),
    );
    await waitFor(() => expect(onSecondSubmission).toHaveBeenCalledOnce());
    const secondRevisionId = onSecondSubmission.mock.calls[0][0].revisionId;
    expect(secondRevisionId).not.toBe(firstRevisionId);
    secondRound.unmount();

    workflowState.approve.mockResolvedValue({
      contentId: "content-workflow",
      contentStatus: "APPROVED",
      approvalId: "approval-2",
      approvalStatus: "APPROVED",
      revisionId: secondRevisionId,
      roundNumber: 2,
      submittedAt: "2026-10-02T10:00:00.000Z",
      decidedAt: "2026-10-02T11:00:00.000Z",
    });
    const onApproved = vi.fn();
    const secondReview = render(
      <>
        <RevisionSnapshotView
          revision={revision(secondRevisionId, 2, "Compare equivalent fractions")}
        />
        <ReviewDecisionActions
          contentId="content-workflow"
          reviewedRevisionId={secondRevisionId}
          onDecisionComplete={onApproved}
        />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(onApproved).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled(),
    );
    expect(workflowState.approve).toHaveBeenCalledWith("content-workflow");
    secondReview.unmount();

    history.unshift({
      approvalId: "approval-2",
      revisionId: secondRevisionId,
      roundNumber: 2,
      status: "APPROVED",
      submittedByUserId: "teacher-1",
      submittedAt: "2026-10-02T10:00:00.000Z",
      decidedByUserId: "reviewer-1",
      decidedAt: "2026-10-02T11:00:00.000Z",
      decisionNote: null,
    });
    const approvedWorkflow = render(
      <AcademicContentWorkflowPanel
        content={preparation("APPROVED")}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={vi.fn()}
      />,
    );

    expect(await screen.findByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit for review/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /publish|notification/i }),
    ).not.toBeInTheDocument();
    approvedWorkflow.unmount();

    const approvedEditor = workflowEditor("APPROVED");
    approvedEditor.content = preparation("APPROVED");
    approvedEditor.isReadOnly = true;
    render(<AcademicContentEditorView editor={approvedEditor} canManage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "This content is read-only in its current status.",
    );
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(await screen.findByText("Round 2")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /publish|notification/i }),
    ).not.toBeInTheDocument();
  });
});
