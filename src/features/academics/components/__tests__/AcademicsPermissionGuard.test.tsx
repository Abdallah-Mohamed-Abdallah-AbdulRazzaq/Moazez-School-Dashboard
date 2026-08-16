import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicsPermissionGuard from "../AcademicsPermissionGuard";

const permissions = new Set<string>();
let isPermissionsReady = true;

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permissions.has(permission),
    isPermissionsReady,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe("AcademicsPermissionGuard", () => {
  beforeEach(() => {
    permissions.clear();
    isPermissionsReady = true;
  });

  it("waits for permissions before rendering an access state", () => {
    isPermissionsReady = false;

    const { container } = render(
      <AcademicsPermissionGuard permission="academics.curriculum.view">
        <div>curriculum</div>
      </AcademicsPermissionGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows access denied without the route permission", () => {
    render(
      <AcademicsPermissionGuard permission="academics.curriculum.view">
        <div>curriculum</div>
      </AcademicsPermissionGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("curriculum")).not.toBeInTheDocument();
  });

  it("renders content with the route permission", () => {
    permissions.add("academics.curriculum.view");

    render(
      <AcademicsPermissionGuard permission="academics.curriculum.view">
        <div>curriculum</div>
      </AcademicsPermissionGuard>,
    );

    expect(screen.getByText("curriculum")).toBeInTheDocument();
  });
});
