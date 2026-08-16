import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import ArchiveConfirmDialog from "../ArchiveConfirmDialog";
import EmploymentTransitionDialog from "../EmploymentTransitionDialog";

describe("teacher lifecycle dialogs", () => {
  it("blocks activation until profile and credentials are ready", () => {
    render(<EmploymentTransitionDialog isOpen teacher={{ ...teacherFixture, profileCompleteness: { isComplete: false, missingFields: ["gender"] } }} targetStatus="ACTIVE" isSubmitting={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("lifecycle.blockers.profile_incomplete")).toBeVisible();
    expect(screen.getByRole("button", { name: "actions.confirm" })).toBeDisabled();
  });

  it("submits a legal transition and omits optional effectiveAt by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmploymentTransitionDialog isOpen teacher={teacherFixture} targetStatus="TERMINATED" isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "actions.confirm" }));
    expect(onSubmit).toHaveBeenCalledWith({ employmentStatus: "TERMINATED" });
  });

  it("requires explicit confirmation before archive", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ArchiveConfirmDialog isOpen teacher={teacherFixture} isSubmitting={false} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText("archive.description")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "archive.confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
