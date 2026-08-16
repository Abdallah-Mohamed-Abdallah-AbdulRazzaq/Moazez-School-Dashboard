import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsUserActions from "../SettingsUserActions";
import type { SettingsUserRecord } from "@/features/settings/types";

const account: SettingsUserRecord = {
  id: "user-1",
  fullName: "Amina User",
  email: "amina@school.test",
  roleId: "role-1",
  status: "active",
};

const labels = {
  edit: "Edit",
  activate: "Activate",
  deactivate: "Deactivate",
  openMenu: "Open actions",
  manageCredentials: "Manage credentials",
  viewCredentials: "View credentials",
  deliverCredentials: "Deliver credentials",
  manageTeacher: "Manage in Teachers",
};

const actions = {
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onManageCredentials: vi.fn(),
  onDeliverCredentials: vi.fn(),
  onManageTeacher: vi.fn(),
};

describe("SettingsUserActions", () => {
  it("keeps Teacher lifecycle actions in the Teachers module", async () => {
    const user = userEvent.setup();
    render(
      <SettingsUserActions
        user={account}
        isTeacher
        canManageUsers
        canDeliverCredentials
        canViewTeachers
        labels={labels}
        {...actions}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Manage credentials" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Manage in Teachers" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Deactivate" }),
    ).not.toBeInTheDocument();
  });

  it("offers supported lifecycle actions for a non-Teacher user", async () => {
    const user = userEvent.setup();
    render(
      <SettingsUserActions
        user={{ ...account, status: "invited" }}
        isTeacher={false}
        canManageUsers
        canDeliverCredentials
        canViewTeachers
        labels={labels}
        {...actions}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Deliver credentials" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Deactivate" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Manage in Teachers" }),
    ).not.toBeInTheDocument();
  });

  it("uses a read-only credential label without management permission", async () => {
    const user = userEvent.setup();
    render(
      <SettingsUserActions
        user={account}
        isTeacher={false}
        canManageUsers={false}
        canDeliverCredentials={false}
        canViewTeachers={false}
        labels={labels}
        {...actions}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions" }));
    expect(
      screen.getByRole("menuitem", { name: "View credentials" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Manage credentials" }),
    ).not.toBeInTheDocument();
  });

  it("runs the selected action from the overflow menu", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <SettingsUserActions
        user={account}
        isTeacher={false}
        canManageUsers
        canDeliverCredentials={false}
        canViewTeachers={false}
        labels={labels}
        {...actions}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
