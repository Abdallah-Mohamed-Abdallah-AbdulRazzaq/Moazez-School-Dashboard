import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentShell from "../AcademicContentShell";

const navigationState = vi.hoisted(() => ({
  canManage: false,
  canApprove: false,
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
      (permission === "academics.academic_content.manage" &&
        navigationState.canManage) ||
      (permission === "academics.academic_content.approve" &&
        navigationState.canApprove),
  }),
}));

describe("AcademicContentShell", () => {
  beforeEach(() => {
    navigationState.canManage = false;
    navigationState.canApprove = false;
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
    expect(screen.getByRole("link", { name: "Preparation templates" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/templates?year=year-1&term=term-1",
    );
    expect(screen.queryByRole("link", { name: "Review queue" })).not.toBeInTheDocument();
  });

  it("shows the review queue only with approve permission", () => {
    navigationState.canApprove = true;
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    expect(screen.getByRole("link", { name: "Review queue" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/review?year=year-1&term=term-1",
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
