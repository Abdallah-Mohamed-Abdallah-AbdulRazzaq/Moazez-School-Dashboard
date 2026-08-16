import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";

const permissionMocks = vi.hoisted(() => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => permissionMocks);

function ProtectedDashboardProbe({ onMount }: { onMount: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return <div>protected dashboard content</div>;
}

describe("DashboardPermissionGuard", () => {
  it("shows the required permission without mounting content when access is absent", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasPermission: () => false,
      isPermissionsReady: true,
    });

    render(
      <DashboardPermissionGuard permission="dashboard.alerts.view">
        <ProtectedDashboardProbe onMount={onMount} />
      </DashboardPermissionGuard>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("dashboard.alerts.view")).toBeInTheDocument();
    expect(screen.queryByText("protected dashboard content")).not.toBeInTheDocument();
    expect(onMount).not.toHaveBeenCalled();
  });

  it("renders nothing without mounting content when a silent fallback is requested", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasPermission: () => false,
      isPermissionsReady: true,
    });

    render(
      <DashboardPermissionGuard
        fallback={null}
        permission="dashboard.alerts.view"
      >
        <ProtectedDashboardProbe onMount={onMount} />
      </DashboardPermissionGuard>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("protected dashboard content")).not.toBeInTheDocument();
    expect(onMount).not.toHaveBeenCalled();
  });

  it("mounts content when the required access is granted", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasPermission: () => true,
      isPermissionsReady: true,
    });

    render(
      <DashboardPermissionGuard permission="dashboard.alerts.view">
        <ProtectedDashboardProbe onMount={onMount} />
      </DashboardPermissionGuard>,
    );

    expect(screen.getByText("protected dashboard content")).toBeInTheDocument();
    expect(onMount).toHaveBeenCalledOnce();
  });
});
