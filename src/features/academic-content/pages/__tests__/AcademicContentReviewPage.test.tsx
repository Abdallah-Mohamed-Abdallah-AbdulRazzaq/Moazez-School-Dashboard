import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentReviewPage from "../AcademicContentReviewPage";

const reviewState = vi.hoisted(() => ({
  canApprove: true,
  getRevision: vi.fn(),
  approve: vi.fn(),
  requestChanges: vi.fn(),
  loadTargetOptions: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: reviewState.push,
    refresh: reviewState.refresh,
  }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.approve" &&
      reviewState.canApprove,
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYears: [
      {
        id: "year-1",
        name: "Academic year 2026/2027",
        nameAr: "العام الدراسي 2026/2027",
        nameEn: "Academic year 2026/2027",
      },
    ],
    terms: [
      {
        id: "term-1",
        name: "First term",
        nameAr: "الفصل الدراسي الأول",
        nameEn: "First term",
      },
    ],
  }),
}));

vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentRevision: reviewState.getRevision,
  approveAcademicContent: reviewState.approve,
  requestAcademicContentChanges: reviewState.requestChanges,
}));

vi.mock("../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: reviewState.loadTargetOptions,
}));

function revision() {
  return {
    id: "revision-1",
    revisionNumber: 3,
    snapshotContractVersion: 2,
    sourceStatus: "DRAFT",
    title: "Immutable submitted title",
    capturedAt: "2026-10-01T08:00:00.000Z",
    academicContentId: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    description: "Submitted description",
    targets: [
      {
        id: "target-1",
        scopeType: "GRADE",
        stageId: null,
        gradeId: "grade-1",
        sectionId: null,
        classroomId: null,
        subjectId: "subject-1",
        teacherSubjectAllocationId: null,
      },
    ],
    assets: [],
    links: [],
    tags: [],
    details: { topic: "Submitted fractions topic" },
  };
}

function transition(revisionId: string) {
  return {
    contentId: "content-1",
    contentStatus: "APPROVED",
    approvalId: "approval-1",
    approvalStatus: "APPROVED",
    revisionId,
    roundNumber: 1,
    submittedAt: "2026-10-01T08:00:00.000Z",
    decidedAt: "2026-10-02T08:00:00.000Z",
  };
}

describe("AcademicContentReviewPage", () => {
  beforeEach(() => {
    reviewState.canApprove = true;
    reviewState.getRevision.mockReset().mockResolvedValue(revision());
    reviewState.approve.mockReset().mockResolvedValue(transition("revision-1"));
    reviewState.requestChanges.mockReset();
    reviewState.loadTargetOptions.mockReset().mockResolvedValue({
      structure: {
        stages: [],
        grades: [
          {
            id: "grade-1",
            name: "Grade 5",
            nameAr: "الصف الخامس",
            nameEn: "Grade 5",
          },
        ],
        sections: [],
        classrooms: [],
      },
      subjects: [
        {
          id: "subject-1",
          name: "Mathematics",
          nameAr: "الرياضيات",
          nameEn: "Mathematics",
        },
      ],
      subjectAllocations: [],
      teacherAllocations: [],
    });
    reviewState.push.mockReset();
    reviewState.refresh.mockReset();
  });

  it("loads and renders only the immutable URL revision", async () => {
    render(
      <AcademicContentReviewPage
        contentId="content-1"
        revisionId="revision-1"
      />,
    );

    expect(
      await screen.findByText("Immutable submitted title"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Submitted fractions topic/)).toBeInTheDocument();
    expect(screen.getByText("Academic year 2026/2027")).toBeInTheDocument();
    expect(screen.getByText("First term")).toBeInTheDocument();
    expect(await screen.findByText("Grade 5")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.queryByText("year-1")).not.toBeInTheDocument();
    expect(screen.queryByText("term-1")).not.toBeInTheDocument();
    expect(screen.queryByText("grade-1")).not.toBeInTheDocument();
    expect(screen.queryByText("subject-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Live edited title")).not.toBeInTheDocument();
    expect(reviewState.getRevision).toHaveBeenCalledWith(
      "content-1",
      "revision-1",
    );
  });

  it("rejects a decision that targets a different revision", async () => {
    reviewState.approve.mockResolvedValue(transition("revision-newer"));
    render(
      <AcademicContentReviewPage
        contentId="content-1"
        revisionId="revision-1"
      />,
    );
    await screen.findByText("Immutable submitted title");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The displayed information is out of date. Refresh the page to see the latest decision.",
    );
    expect(reviewState.push).not.toHaveBeenCalled();
  });

  it("returns to the refreshed queue after a matching decision", async () => {
    render(
      <AcademicContentReviewPage
        contentId="content-1"
        revisionId="revision-1"
      />,
    );
    await screen.findByText("Immutable submitted title");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(reviewState.push).toHaveBeenCalledWith(
        "/en/academic-content-hub/review?year=year-1&term=term-1",
        { scroll: false },
      ),
    );
    expect(reviewState.refresh).toHaveBeenCalledOnce();
  });
});
