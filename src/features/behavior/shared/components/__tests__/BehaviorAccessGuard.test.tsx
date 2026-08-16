import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BehaviorAccessGuard from "../BehaviorAccessGuard";

const membershipPermissions = new Set<string>();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      activeMembership: { permissions: Array.from(membershipPermissions) },
    },
    isLoading: false,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe("BehaviorAccessGuard", () => {
  beforeEach(() => {
    membershipPermissions.clear();
  });

  it("shows the standard access-denied state without the required view permission", () => {
    render(
      <BehaviorAccessGuard permission="behavior.records.view">
        <div>behavior records</div>
      </BehaviorAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("behavior records")).not.toBeInTheDocument();
  });

  it("renders the destination when the required view permission is granted", () => {
    membershipPermissions.add("behavior.records.view");

    render(
      <BehaviorAccessGuard permission="behavior.records.view">
        <div>behavior records</div>
      </BehaviorAccessGuard>,
    );

    expect(screen.getByText("behavior records")).toBeInTheDocument();
    expect(screen.queryByText("common.accessDenied.title")).not.toBeInTheDocument();
  });
});
