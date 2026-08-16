import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), showToast: vi.fn(), hasPermission: vi.fn() }));
vi.mock("../../api/workflowPolicyApi", () => ({ getAdmissionWorkflowPolicy: mocks.get, updateAdmissionWorkflowPolicy: mocks.update }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ hasPermission: mocks.hasPermission, isPermissionsReady: true }) }));
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

import AdmissionsWorkflowPolicyPage from "../AdmissionsWorkflowPolicyPage";

const policy = { requiresPlacementTest: true, requiresInterview: true, allowDirectAcceptance: false, source: "default" as const, updatedAt: null };

describe("AdmissionsWorkflowPolicyPage", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.hasPermission.mockImplementation((key: string) => key.endsWith("view") || key.endsWith("manage")); mocks.get.mockResolvedValue(policy); mocks.update.mockResolvedValue({ ...policy, requiresInterview: false, source: "school_override" }); });

  it("loads and saves the workflow policy", async () => {
    const user = userEvent.setup(); render(<AdmissionsWorkflowPolicyPage />);
    expect(screen.getByText("states.loading")).toBeInTheDocument();
    await user.click(await screen.findByRole("switch", { name: "requiresInterview.label" }));
    await user.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ requiresInterview: false }));
    expect(mocks.showToast).toHaveBeenCalledWith("messages.saved", "success");
  });

  it("offers retry after a load failure", async () => {
    mocks.get.mockRejectedValueOnce(new Error("offline")); const user = userEvent.setup(); render(<AdmissionsWorkflowPolicyPage />);
    await user.click(await screen.findByRole("button", { name: "actions.retry" }));
    expect(await screen.findByRole("switch", { name: "requiresInterview.label" })).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("renders access denied without view permission", () => {
    mocks.hasPermission.mockReturnValue(false); render(<AdmissionsWorkflowPolicyPage />);
    expect(screen.getByText("accessDenied.title")).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
