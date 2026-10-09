import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentShell from "../AcademicContentShell";

const navigationState = vi.hoisted(() => ({
  canManage: false,
  canApprove: false,
  pathname: "/en/academic-content-hub",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
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
    navigationState.pathname = "/en/academic-content-hub";
    navigationState.push.mockReset();
  });

  it("renders the overview header once and preserves context in navigation", () => {
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    expect(
      screen.getAllByRole("heading", { name: "Academic Content Center" }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /Create content/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub?year=year-1&term=term-1",
    );
    expect(screen.getByRole("link", { name: "All content" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/library?year=year-1&term=term-1",
    );
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/library?year=year-1&term=term-1&contentStatus=DRAFT",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Preparation templates" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/templates?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Teacher preparation" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/preparations?year=year-1&term=term-1",
    );
    expect(screen.getByRole("link", { name: "Weekly plan" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/weekly-plans?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Guardian weekly note" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/guardian-notes?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Subject resource" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/subject-resources?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Online session" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/online-sessions?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "General resource" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/general-resources?year=year-1&term=term-1",
    );
    expect(
      screen.queryByRole("link", { name: "Review queue" }),
    ).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Create content/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Online session" }));

    expect(navigationState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/new?year=year-1&term=term-1&type=ONLINE_SESSION",
    );
  });

  it("keeps the compact shell header on non-overview routes", () => {
    navigationState.pathname = "/en/academic-content-hub/library";
    navigationState.canManage = true;
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    expect(
      screen.getByRole("heading", { name: "Academic Content Hub" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Academic Content Center" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["/en/academic-content-hub", "Overview"],
    ["/en/academic-content-hub/library", "All content"],
    ["/en/academic-content-hub/preparations", "Teacher preparation"],
    ["/en/academic-content-hub/weekly-plans", "Weekly plan"],
    ["/en/academic-content-hub/guardian-notes", "Guardian weekly note"],
    ["/en/academic-content-hub/subject-resources", "Subject resource"],
    ["/en/academic-content-hub/online-sessions", "Online session"],
    ["/en/academic-content-hub/general-resources", "General resource"],
    ["/en/academic-content-hub/review", "Review queue"],
    ["/en/academic-content-hub/templates", "Preparation templates"],
    ["/en/academic-content-hub/settings/notifications", "Settings"],
  ])("marks %s navigation as active", (pathname, linkName) => {
    navigationState.pathname = pathname;
    navigationState.canApprove = true;
    render(
      <AcademicContentShell>
        <div>workspace content</div>
      </AcademicContentShell>,
    );

    expect(screen.getByRole("link", { name: linkName })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
