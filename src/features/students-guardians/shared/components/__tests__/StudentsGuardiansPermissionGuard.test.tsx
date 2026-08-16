import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import StudentsGuardiansPermissionGuard from "../StudentsGuardiansPermissionGuard";

const permissionMocks = vi.hoisted(() => ({ usePermissions: vi.fn() }));

vi.mock("@/hooks/usePermissions", () => permissionMocks);

function ProtectedProbe({ onMount }: { onMount: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return <div>protected students content</div>;
}

describe("StudentsGuardiansPermissionGuard", () => {
  it("shows access denied without mounting content when a required permission is absent", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasAllPermissions: () => false,
      isPermissionsReady: true,
    });

    render(
      <StudentsGuardiansPermissionGuard permissions={["students.records.view"]}>
        <ProtectedProbe onMount={onMount} />
      </StudentsGuardiansPermissionGuard>,
    );

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.queryByText("protected students content")).not.toBeInTheDocument();
    expect(onMount).not.toHaveBeenCalled();
  });

  it("mounts content only when every required permission is granted", () => {
    const onMount = vi.fn();
    permissionMocks.usePermissions.mockReturnValue({
      hasAllPermissions: () => true,
      isPermissionsReady: true,
    });

    render(
      <StudentsGuardiansPermissionGuard
        permissions={["students.records.manage", "students.guardians.manage"]}
      >
        <ProtectedProbe onMount={onMount} />
      </StudentsGuardiansPermissionGuard>,
    );

    expect(screen.getByText("protected students content")).toBeInTheDocument();
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
