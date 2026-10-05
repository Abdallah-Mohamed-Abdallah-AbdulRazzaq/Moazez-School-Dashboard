import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentOverviewState } from "../../hooks/useAcademicContentOverview";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentOverviewPage from "../AcademicContentOverviewPage";

const testState = vi.hoisted(() => ({
  academicYearId: "year-1",
  termId: "term-1",
  canApprove: false,
  push: vi.fn(),
}));
const useAcademicContentOverview = vi.hoisted(() => vi.fn());

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: testState.academicYearId,
    termId: testState.termId,
  }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.approve" && testState.canApprove,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: testState.push }),
}));
vi.mock("../../hooks/useAcademicContentOverview", () => ({
  useAcademicContentOverview,
}));

function content(): AcademicContentLibraryItem {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    title: "Fractions preparation",
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-10-05T08:00:00.000Z",
    updatedAt: "2026-10-05T09:00:00.000Z",
    summary: null,
  };
}

function overviewState(): AcademicContentOverviewState {
  const emptyResource = { data: [], error: null, isLoading: false, partial: false };
  return {
    totals: {
      TEACHER_PREPARATION: { data: 1, error: null, isLoading: false, partial: false },
      WEEKLY_PLAN: { data: 0, error: null, isLoading: false, partial: false },
      GUARDIAN_WEEKLY_NOTE: { data: 0, error: null, isLoading: false, partial: false },
      SUBJECT_RESOURCE: { data: 0, error: null, isLoading: false, partial: false },
      ONLINE_SESSION: { data: 0, error: null, isLoading: false, partial: false },
      GENERAL_RESOURCE: { data: 0, error: null, isLoading: false, partial: false },
    },
    workInProgress: { ...emptyResource, data: [content()] },
    upcomingSessions: emptyResource,
    recentlyUpdated: emptyResource,
    retryType: vi.fn(),
    retryWorkInProgress: vi.fn(),
    retryUpcomingSessions: vi.fn(),
    retryRecentlyUpdated: vi.fn(),
  };
}

describe("AcademicContentOverviewPage", () => {
  beforeEach(() => {
    testState.academicYearId = "year-1";
    testState.termId = "term-1";
    testState.canApprove = false;
    testState.push.mockReset();
    useAcademicContentOverview.mockReset().mockReturnValue(overviewState());
  });

  it("composes contract-backed overview resources and context-aware open actions", () => {
    render(<AcademicContentOverviewPage />);

    expect(screen.getAllByRole("article")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(testState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/content-1?year=year-1&term=term-1",
    );
    expect(screen.queryByRole("link", { name: /Review queue/ })).not.toBeInTheDocument();
  });

  it("passes approval permission to quick links", () => {
    testState.canApprove = true;
    render(<AcademicContentOverviewPage />);

    expect(screen.getByRole("link", { name: /Review queue/ })).toBeVisible();
  });

  it("renders no overview surface while academic context is incomplete", () => {
    testState.academicYearId = "";
    testState.termId = "";
    const { container } = render(<AcademicContentOverviewPage />);

    expect(useAcademicContentOverview).toHaveBeenCalledWith({
      academicYearId: "",
      termId: "",
    });
    expect(container).toBeEmptyDOMElement();
  });
});
