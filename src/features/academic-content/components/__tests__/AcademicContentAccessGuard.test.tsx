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
});
