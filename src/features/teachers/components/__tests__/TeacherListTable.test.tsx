import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import TeacherListTable from "../TeacherListTable";

describe("TeacherListTable", () => {
  it("renders the contract columns and navigates from a row", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(<TeacherListTable teachers={[teacherFixture]} page={1} pageSize={20} total={1} isLoading={false} searchQuery="" canManage={false} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} onView={onView} onEdit={vi.fn()} onDisableAccount={vi.fn()} />);

    expect(screen.getAllByRole("columnheader")).toHaveLength(9);
    await user.click(screen.getByText("Nour Ali"));
    expect(onView).toHaveBeenCalledWith(teacherFixture);
    expect(screen.queryByText("actions.edit")).not.toBeInTheDocument();
  });

  it("keeps row actions separate from row navigation", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDisableAccount = vi.fn();
    render(<TeacherListTable teachers={[teacherFixture]} page={1} pageSize={20} total={1} isLoading={false} searchQuery="" canManage onPageChange={vi.fn()} onPageSizeChange={vi.fn()} onView={onView} onEdit={onEdit} onDisableAccount={onDisableAccount} />);

    await user.click(screen.getByRole("button", { name: "actions.open_menu" }));
    await user.click(await screen.findByText("actions.edit"));
    expect(onEdit).toHaveBeenCalledWith(teacherFixture);
    expect(onView).not.toHaveBeenCalled();
  });

  it("offers safe disable action when permitted", async () => {
    const user = userEvent.setup();
    const onDisableAccount = vi.fn();
    const activeTeacher = { ...teacherFixture, employmentStatus: "ACTIVE" as const };
    render(<TeacherListTable teachers={[activeTeacher]} page={1} pageSize={20} total={1} isLoading={false} searchQuery="" canManage onPageChange={vi.fn()} onPageSizeChange={vi.fn()} onView={vi.fn()} onEdit={vi.fn()} onDisableAccount={onDisableAccount} />);

    await user.click(screen.getByRole("button", { name: "actions.open_menu" }));
    await user.click(await screen.findByText("actions.disable_account"));
    expect(onDisableAccount).toHaveBeenCalledWith(activeTeacher);
  });
});
