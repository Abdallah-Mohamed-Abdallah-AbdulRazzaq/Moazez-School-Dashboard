import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewDecisionActions from "../ReviewDecisionActions";

const decisionState = vi.hoisted(() => ({
  canApprove: true,
  approve: vi.fn(),
  requestChanges: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.approve" &&
      decisionState.canApprove,
  }),
}));

vi.mock("../../../services/academicContentApi", () => ({
  approveAcademicContent: decisionState.approve,
  requestAcademicContentChanges: decisionState.requestChanges,
}));

function transition(revisionId = "revision-1") {
  return {
    contentId: "content-1",
    contentStatus: "APPROVED",
    approvalId: "approval-1",
    approvalStatus: "APPROVED",
    revisionId,
    roundNumber: 1,
    submittedAt: "2026-10-01T08:00:00.000Z",
    decidedAt: "2026-10-02T08:00:00.000Z",
  } as const;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("ReviewDecisionActions", () => {
  beforeEach(() => {
    decisionState.canApprove = true;
    decisionState.approve.mockReset().mockResolvedValue(transition());
    decisionState.requestChanges.mockReset().mockResolvedValue({
      ...transition(),
      contentStatus: "CHANGES_REQUESTED",
      approvalStatus: "CHANGES_REQUESTED",
    });
  });

  it("approves once and returns the server transition", async () => {
    const pending = deferred<ReturnType<typeof transition>>();
    decisionState.approve.mockReturnValue(pending.promise);
    const onDecisionComplete = vi.fn();
    render(
      <ReviewDecisionActions
        contentId="content-1"
        revisionNumber={1}
        onDecisionComplete={onDecisionComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(decisionState.approve).toHaveBeenCalledTimes(1);

    pending.resolve(transition());
    await waitFor(() =>
      expect(onDecisionComplete).toHaveBeenCalledWith(transition()),
    );
  });

  it("trims the request-change note before sending it", async () => {
    const onDecisionComplete = vi.fn();
    render(
      <ReviewDecisionActions
        contentId="content-1"
        revisionNumber={1}
        onDecisionComplete={onDecisionComplete}
      />,
    );

    fireEvent.change(screen.getByLabelText("Change request note"), {
      target: { value: "  Clarify assessment criteria  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));

    await waitFor(() =>
      expect(decisionState.requestChanges).toHaveBeenCalledWith(
        "content-1",
        "Clarify assessment criteria",
      ),
    );
    expect(onDecisionComplete).toHaveBeenCalledOnce();
  });

  it.each([
    ["", "Enter a note before requesting changes."],
    ["x".repeat(4001), "The note cannot exceed 4000 characters."],
  ])("rejects an invalid request-change note", (note, message) => {
    render(
      <ReviewDecisionActions
        contentId="content-1"
        revisionNumber={1}
        onDecisionComplete={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Change request note"), {
      target: { value: note },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(decisionState.requestChanges).not.toHaveBeenCalled();
  });

  it("surfaces decision errors without completing", async () => {
    decisionState.approve.mockRejectedValue(new Error("Decision failed"));
    const onDecisionComplete = vi.fn();
    render(
      <ReviewDecisionActions
        contentId="content-1"
        revisionNumber={1}
        onDecisionComplete={onDecisionComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This action could not be completed. Try again; contact support if the problem continues.",
    );
    expect(onDecisionComplete).not.toHaveBeenCalled();
  });

  it("denies decision controls without approve permission", () => {
    decisionState.canApprove = false;
    render(
      <ReviewDecisionActions
        contentId="content-1"
        revisionNumber={1}
        onDecisionComplete={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "academics.academic_content.approve",
    );
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });
});
