import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentReviewPage from "../AcademicContentReviewPage";

const reviewState = vi.hoisted(() => ({
  canApprove: true,
  getRevision: vi.fn(),
  approve: vi.fn(),
  requestChanges: vi.fn(),
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

vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentRevision: reviewState.getRevision,
  approveAcademicContent: reviewState.approve,
  requestAcademicContentChanges: reviewState.requestChanges,
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
    targets: [],
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

    expect(await screen.findByText("Immutable submitted title")).toBeInTheDocument();
    expect(screen.getByText(/Submitted fractions topic/)).toBeInTheDocument();
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
      "This review is stale because the server decided a different revision.",
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
