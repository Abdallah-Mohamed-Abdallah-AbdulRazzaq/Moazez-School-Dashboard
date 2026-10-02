import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import WorkflowPolicyCard from "../WorkflowPolicyCard";

const mocks = vi.hoisted(() => ({
  canManage: true,
  getAcademicContentWorkflowPolicy: vi.fn(),
  updateAcademicContentWorkflowPolicy: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.settings.manage" &&
      mocks.canManage,
  }),
}));

vi.mock("../../../services/academicContentApi", () => ({
  getAcademicContentWorkflowPolicy: mocks.getAcademicContentWorkflowPolicy,
  updateAcademicContentWorkflowPolicy: mocks.updateAcademicContentWorkflowPolicy,
}));

describe("WorkflowPolicyCard", () => {
  beforeEach(() => {
    mocks.canManage = true;
    mocks.getAcademicContentWorkflowPolicy.mockReset().mockResolvedValue({
      preparationApprovalRequired: false,
    });
    mocks.updateAcademicContentWorkflowPolicy.mockReset().mockResolvedValue({
      preparationApprovalRequired: true,
    });
  });

  it("enables preparation approval and saves the changed policy", async () => {
    render(<WorkflowPolicyCard />);
    const approvalToggle = await screen.findByRole("checkbox", {
      name: "Require approval for teacher preparation",
    });

    expect(approvalToggle).not.toBeChecked();
    fireEvent.click(approvalToggle);
    fireEvent.click(screen.getByRole("button", { name: "Save workflow policy" }));

    await waitFor(() =>
      expect(mocks.updateAcademicContentWorkflowPolicy).toHaveBeenCalledWith({
        preparationApprovalRequired: true,
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Workflow policy saved.",
    );
  });

  it("keeps the policy visible but read-only without settings permission", async () => {
    mocks.canManage = false;
    render(<WorkflowPolicyCard />);

    expect(
      await screen.findByRole("checkbox", {
        name: "Require approval for teacher preparation",
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save workflow policy" }),
    ).not.toBeInTheDocument();
  });

  it("restores the persisted value when saving fails", async () => {
    mocks.updateAcademicContentWorkflowPolicy.mockRejectedValue(
      new ApiError("Workflow policy could not be saved", 409, "POLICY_CONFLICT"),
    );
    render(<WorkflowPolicyCard />);
    const approvalToggle = await screen.findByRole("checkbox", {
      name: "Require approval for teacher preparation",
    });

    fireEvent.click(approvalToggle);
    fireEvent.click(screen.getByRole("button", { name: "Save workflow policy" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Workflow policy could not be saved",
    );
    expect(approvalToggle).not.toBeChecked();
  });

  it("recovers from a load failure through retry", async () => {
    mocks.getAcademicContentWorkflowPolicy
      .mockRejectedValueOnce(new ApiError("Policy unavailable", 503, "UNAVAILABLE"))
      .mockResolvedValueOnce({ preparationApprovalRequired: false });
    render(<WorkflowPolicyCard />);

    expect(await screen.findByText("Policy unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("checkbox", {
        name: "Require approval for teacher preparation",
      }),
    ).not.toBeChecked();
  });
});
