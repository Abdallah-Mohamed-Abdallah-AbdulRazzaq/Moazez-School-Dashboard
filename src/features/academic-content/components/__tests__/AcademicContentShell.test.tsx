import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentShell from "../AcademicContentShell";

const navigationState = vi.hoisted(() => ({
  canManage: false,
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub",
  useRouter: () => ({ push: navigationState.push }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.manage" &&
      navigationState.canManage,
  }),
}));

describe("AcademicContentShell", () => {
  beforeEach(() => {
    navigationState.canManage = false;
    navigationState.push.mockReset();
  });

  it("keeps library context links readable without manage access", () => {
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    expect(screen.queryByRole("button", { name: "Create content" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub?year=year-1&term=term-1&contentStatus=DRAFT",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings/file-policy?year=year-1&term=term-1",
    );
    expect(screen.getByRole("link", { name: "Workflow policy" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings/workflow?year=year-1&term=term-1",
    );
  });

  it("opens creation with the selected academic context for managers", () => {
    navigationState.canManage = true;
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create content" }));

    expect(navigationState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/new?year=year-1&term=term-1",
    );
  });
});
