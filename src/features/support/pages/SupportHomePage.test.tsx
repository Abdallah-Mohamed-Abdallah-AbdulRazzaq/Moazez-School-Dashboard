import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SupportHomePage from "./SupportHomePage";

const permissionMocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: permissionMocks.hasPermission,
    isPermissionsReady: true,
  }),
}));

describe("SupportHomePage", () => {
  beforeEach(() => {
    permissionMocks.hasPermission.mockReset();
  });

  it("shows the required view permission instead of Help/Support content when access is absent", () => {
    permissionMocks.hasPermission.mockReturnValue(false);

    render(<SupportHomePage />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("school.support.view")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "How can we help?" }),
    ).not.toBeInTheDocument();
  });

  it("shows Help/Support content when view access is granted", () => {
    permissionMocks.hasPermission.mockReturnValue(true);

    render(<SupportHomePage />);

    expect(
      screen.getByRole("heading", { name: "How can we help?" }),
    ).toBeInTheDocument();
  });
});
