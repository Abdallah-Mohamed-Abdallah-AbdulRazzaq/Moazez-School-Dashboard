import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WorkflowPolicyForm from "../WorkflowPolicyForm";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const policy = { requiresPlacementTest: true, requiresInterview: true, allowDirectAcceptance: false, source: "default" as const, updatedAt: null };

describe("WorkflowPolicyForm", () => {
  it("submits changed fields only and can reset the draft", async () => {
    const user = userEvent.setup(); const onSave = vi.fn();
    render(<WorkflowPolicyForm policy={policy} canManage onSave={onSave} isSaving={false} />);
    await user.click(screen.getByRole("switch", { name: "requiresInterview.label" }));
    await user.click(screen.getByRole("button", { name: "actions.save" }));
    expect(onSave).toHaveBeenCalledWith({ requiresInterview: false });
    await user.click(screen.getByRole("button", { name: "actions.reset" }));
    expect(screen.getByRole("switch", { name: "requiresInterview.label" })).toBeChecked();
  });

  it("is read-only without manage permission", () => {
    render(<WorkflowPolicyForm policy={policy} canManage={false} onSave={vi.fn()} isSaving={false} />);
    expect(screen.getAllByRole("switch")).toEqual(expect.arrayContaining([expect.objectContaining({ disabled: true })]));
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it("explains when direct acceptance remains blocked", async () => {
    const user = userEvent.setup();
    render(<WorkflowPolicyForm policy={policy} canManage onSave={vi.fn()} isSaving={false} />);
    await user.click(screen.getByRole("switch", { name: "requiresPlacementTest.label" }));
    await user.click(screen.getByRole("switch", { name: "requiresInterview.label" }));
    expect(screen.getByText("directAcceptanceWarning")).toBeInTheDocument();
  });
});
