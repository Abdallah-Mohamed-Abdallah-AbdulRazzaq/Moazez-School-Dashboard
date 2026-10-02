import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type { AcademicContentDetail } from "../../../types/contracts";
import AcademicContentWorkflowPanel from "../AcademicContentWorkflowPanel";

const api = vi.hoisted(() => ({
  getAcademicContentWorkflowPolicy: vi.fn(),
  listAcademicContentApprovalHistory: vi.fn(),
  submitAcademicContent: vi.fn(),
}));

vi.mock("../../../services/academicContentApi", () => api);

function preparation(
  status: AcademicContentDetail["status"] = "DRAFT",
): Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }> {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    title: "Fractions preparation",
    description: null,
    status,
    archivedAt: null,
    createdAt: "2026-10-02T07:00:00.000Z",
    updatedAt: "2026-10-02T07:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

const emptyHistory = { items: [], page: 1, limit: 50, total: 0 };

describe("AcademicContentWorkflowPanel", () => {
  beforeEach(() => {
    api.getAcademicContentWorkflowPolicy.mockReset().mockResolvedValue({
      preparationApprovalRequired: true,
    });
    api.listAcademicContentApprovalHistory.mockReset().mockResolvedValue(emptyHistory);
    api.submitAcademicContent.mockReset().mockResolvedValue({
      contentId: "content-1",
      contentStatus: "SUBMITTED",
      approvalId: "approval-1",
      approvalStatus: "PENDING",
      revisionId: "revision-1",
      roundNumber: 1,
      submittedAt: "2026-10-02T08:00:00.000Z",
      decidedAt: null,
    });
  });

  it("submits a ready saved draft and returns the server transition", async () => {
    const onSubmitted = vi.fn(async () => undefined);
    render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={onSubmitted}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Submit for review" }));

    await waitFor(() => expect(api.submitAcademicContent).toHaveBeenCalledOnce());
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        contentStatus: "SUBMITTED",
        revisionId: "revision-1",
      }),
    );
  });

  it("shows the latest decision note and resubmit action", async () => {
    api.listAcademicContentApprovalHistory.mockResolvedValue({
      items: [
        {
          approvalId: "approval-1",
          revisionId: "revision-1",
          roundNumber: 1,
          status: "CHANGES_REQUESTED",
          submittedByUserId: "teacher-1",
          submittedAt: "2026-10-02T08:00:00.000Z",
          decidedByUserId: "reviewer-1",
          decidedAt: "2026-10-02T09:00:00.000Z",
          decisionNote: "Add measurable outcomes",
        },
      ],
      page: 1,
      limit: 50,
      total: 1,
    });
    render(
      <AcademicContentWorkflowPanel
        content={preparation("CHANGES_REQUESTED")}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("note", { name: "Latest decision note" }),
    ).toHaveTextContent("Add measurable outcomes");
    expect(screen.getByRole("button", { name: "Resubmit for review" })).toBeEnabled();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });

  it("hides submission without manage permission", async () => {
    render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage={false}
        hasUnsavedChanges={false}
        onSubmitted={vi.fn()}
      />,
    );

    await screen.findByText("Approval workflow");
    expect(
      screen.queryByRole("button", { name: "Submit for review" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    { scenario: "failed readiness", ready: false, dirty: false },
    { scenario: "unsaved changes", ready: true, dirty: true },
  ])("disables submission for $scenario", async ({ ready, dirty }) => {
    render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: ready, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={dirty}
        onSubmitted={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Submit for review" }),
    ).toBeDisabled();
  });

  it("hides submission when preparation approval is disabled", async () => {
    api.getAcademicContentWorkflowPolicy.mockResolvedValue({
      preparationApprovalRequired: false,
    });
    render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={vi.fn()}
      />,
    );

    expect(await screen.findByText("Approval is not required.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit for review" }),
    ).not.toBeInTheDocument();
  });

  it("does not describe approval as disabled when policy loading fails", async () => {
    api.getAcademicContentWorkflowPolicy.mockRejectedValue(
      new ApiError("Policy unavailable", 503, "UNAVAILABLE"),
    );
    render(
      <AcademicContentWorkflowPanel
        content={preparation()}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        canManage
        hasUnsavedChanges={false}
        onSubmitted={vi.fn()}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Policy unavailable");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("Approval is not required.")).not.toBeInTheDocument();
  });
});
