import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdmissionsAccessGuard from "../AdmissionsAccessGuard";

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

describe("AdmissionsAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
    isPermissionsReady = true;
  });

  it("waits for permissions before rendering an access state", () => {
    isPermissionsReady = false;

    const { container } = render(
      <AdmissionsAccessGuard permission="admissions.applications.view">
        <div>applications</div>
      </AdmissionsAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows access denied without the route permission", () => {
    render(
      <AdmissionsAccessGuard permission="admissions.applications.view">
        <div>applications</div>
      </AdmissionsAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("applications")).not.toBeInTheDocument();
  });

  it("renders content with the route permission", () => {
    permissions.add("admissions.applications.view");

    render(
      <AdmissionsAccessGuard permission="admissions.applications.view">
        <div>applications</div>
      </AdmissionsAccessGuard>,
    );

    expect(screen.getByText("applications")).toBeInTheDocument();
  });
});
