import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReinforcementAccessGuard from "../ReinforcementAccessGuard";

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

describe("ReinforcementAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
  });

  it("shows access denied without the route permission", () => {
    render(
      <ReinforcementAccessGuard permission="reinforcement.tasks.view">
        <div>tasks</div>
      </ReinforcementAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("tasks")).not.toBeInTheDocument();
  });

  it("renders content with the route permission", () => {
    permissions.add("reinforcement.tasks.view");

    render(
      <ReinforcementAccessGuard permission="reinforcement.tasks.view">
        <div>tasks</div>
      </ReinforcementAccessGuard>,
    );

    expect(screen.getByText("tasks")).toBeInTheDocument();
  });
});
