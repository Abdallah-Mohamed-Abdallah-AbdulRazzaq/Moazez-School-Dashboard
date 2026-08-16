import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import AttendancePermissionGuard from "../AttendancePermissionGuard";

const permissionMocks = vi.hoisted(() => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => permissionMocks);

function ProtectedProbe({ onMount }: { onMount: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return <div>protected attendance content</div>;
}

describe("AttendancePermissionGuard", () => {
  it("shows access denied without mounting protected content when view access is absent", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasPermission: () => false,
      isPermissionsReady: true,
    });

    render(
      <AttendancePermissionGuard permission="attendance.reports.view">
        <ProtectedProbe onMount={onMount} />
      </AttendancePermissionGuard>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("attendance.reports.view")).toBeInTheDocument();
    expect(screen.getByText("guidance")).toBeInTheDocument();
    expect(screen.queryByText("protected attendance content")).not.toBeInTheDocument();
    expect(onMount).not.toHaveBeenCalled();
  });

  it("mounts protected content after permissions are ready and granted", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasPermission: () => true,
      isPermissionsReady: true,
    });

    render(
      <AttendancePermissionGuard permission="attendance.reports.view">
        <ProtectedProbe onMount={onMount} />
      </AttendancePermissionGuard>,
    );

    expect(screen.getByText("protected attendance content")).toBeInTheDocument();
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
