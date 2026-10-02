import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentAccessGuard from "../AcademicContentAccessGuard";

const permissions = new Set<string>();
let isPermissionsReady = true;

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permissions.has(permission),
    isPermissionsReady,
  }),
}));

describe("AcademicContentAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
    isPermissionsReady = true;
  });

  it("waits for membership permissions before rendering", () => {
    isPermissionsReady = false;

    const { container } = render(
      <AcademicContentAccessGuard>
        <div>content library</div>
      </AcademicContentAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows access denied without Academic Content view access", () => {
    render(
      <AcademicContentAccessGuard>
        <div>content library</div>
      </AcademicContentAccessGuard>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("academics.academic_content.view"),
    ).toBeInTheDocument();
    expect(screen.queryByText("content library")).not.toBeInTheDocument();
  });

  it("renders the workspace with Academic Content view access", () => {
    permissions.add("academics.academic_content.view");

    render(
      <AcademicContentAccessGuard>
        <div>content library</div>
      </AcademicContentAccessGuard>,
    );

    expect(screen.getByText("content library")).toBeInTheDocument();
  });

  it.each([
    "academics.academic_content.approve",
    "academics.academic_content.settings.manage",
  ] as const)("blocks direct access without %s", (requiredPermission) => {
    permissions.add("academics.academic_content.view");

    render(
      <AcademicContentAccessGuard requiredPermission={requiredPermission}>
        <div>protected route</div>
      </AcademicContentAccessGuard>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(requiredPermission);
    expect(screen.queryByText("protected route")).not.toBeInTheDocument();
  });

  it.each([
    "academics.academic_content.approve",
    "academics.academic_content.settings.manage",
  ] as const)("renders a direct route with %s", (requiredPermission) => {
    permissions.add(requiredPermission);

    render(
      <AcademicContentAccessGuard requiredPermission={requiredPermission}>
        <div>protected route</div>
      </AcademicContentAccessGuard>,
    );

    expect(screen.getByText("protected route")).toBeInTheDocument();
  });
});
