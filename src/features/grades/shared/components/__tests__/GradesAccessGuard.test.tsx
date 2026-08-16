import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GradesAccessGuard from "../GradesAccessGuard";

const permissions = new Set<string>();

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permissions.has(permission),
    isPermissionsReady: true,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe("GradesAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
  });

  it("shows access denied without the route permission", () => {
    render(
      <GradesAccessGuard permission="grades.assessments.view">
        <div>assessments</div>
      </GradesAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("assessments")).not.toBeInTheDocument();
  });

  it("renders content with the route permission", () => {
    permissions.add("grades.assessments.view");

    render(
      <GradesAccessGuard permission="grades.assessments.view">
        <div>assessments</div>
      </GradesAccessGuard>,
    );

    expect(screen.getByText("assessments")).toBeInTheDocument();
  });
});
