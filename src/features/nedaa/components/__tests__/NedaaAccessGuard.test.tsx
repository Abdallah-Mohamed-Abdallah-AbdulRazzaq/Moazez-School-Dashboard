import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NedaaAccessGuard from "../NedaaAccessGuard";

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

describe("NedaaAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
  });

  it("shows access denied without the route permission", () => {
    render(
      <NedaaAccessGuard permission="dismissal.requests.view">
        <div>operations</div>
      </NedaaAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("operations")).not.toBeInTheDocument();
  });

  it("renders content with the route permission", () => {
    permissions.add("dismissal.requests.view");

    render(
      <NedaaAccessGuard permission="dismissal.requests.view">
        <div>operations</div>
      </NedaaAccessGuard>,
    );

    expect(screen.getByText("operations")).toBeInTheDocument();
  });
});
