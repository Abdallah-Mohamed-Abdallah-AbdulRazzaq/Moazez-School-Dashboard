import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommunicationAccessGuard from "../CommunicationAccessGuard";

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

describe("CommunicationAccessGuard", () => {
  beforeEach(() => {
    permissions.clear();
    isPermissionsReady = true;
  });

  it("waits for permissions before rendering an access state", () => {
    isPermissionsReady = false;

    const { container } = render(
      <CommunicationAccessGuard permission="communication.notifications.view">
        <div>notifications</div>
      </CommunicationAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the localized access-denied state without the route permission", () => {
    render(
      <CommunicationAccessGuard permission="communication.notifications.view">
        <div>notifications</div>
      </CommunicationAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("notifications")).not.toBeInTheDocument();
  });

  it("renders the protected page with the route permission", () => {
    permissions.add("communication.notifications.view");

    render(
      <CommunicationAccessGuard permission="communication.notifications.view">
        <div>notifications</div>
      </CommunicationAccessGuard>,
    );

    expect(screen.getByText("notifications")).toBeInTheDocument();
  });

  it("renders a combined page only when every required permission is granted", () => {
    permissions.add("communication.conversations.view");
    permissions.add("communication.messages.view");

    render(
      <CommunicationAccessGuard
        permissions={[
          "communication.conversations.view",
          "communication.messages.view",
        ]}
      >
        <div>conversation workspace</div>
      </CommunicationAccessGuard>,
    );

    expect(screen.getByText("conversation workspace")).toBeInTheDocument();
  });

  it("denies a combined page when one required permission is missing", () => {
    permissions.add("communication.conversations.view");

    render(
      <CommunicationAccessGuard
        permissions={[
          "communication.conversations.view",
          "communication.messages.view",
        ]}
      >
        <div>conversation workspace</div>
      </CommunicationAccessGuard>,
    );

    expect(screen.getByText("common.accessDenied.title")).toBeInTheDocument();
    expect(screen.queryByText("conversation workspace")).not.toBeInTheDocument();
  });
});
