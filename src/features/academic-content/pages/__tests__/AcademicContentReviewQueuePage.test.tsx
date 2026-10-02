import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AcademicContentReviewQueueAccess,
  AcademicContentReviewQueueView,
} from "../AcademicContentReviewQueuePage";

const pageState = vi.hoisted(() => ({
  canApprove: true,
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub/review",
  useRouter: () => ({ push: pageState.push }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.approve" && pageState.canApprove,
  }),
}));

vi.mock("../../components/review/ReviewQueueFilters", () => ({
  default: () => <div>Review filters</div>,
}));

function queueState(overrides = {}) {
  return {
    filters: {
      page: 1,
      limit: 50,
      stageId: "",
      gradeId: "",
      sectionId: "",
      classroomId: "",
      subjectId: "",
      teacherUserId: "",
      search: "",
    },
    search: "",
    items: [],
    total: 0,
    isLoading: false,
    error: null,
    setSearch: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setLimit: vi.fn(),
    clearFilters: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}

describe("AcademicContentReviewQueuePage", () => {
  beforeEach(() => {
    pageState.canApprove = true;
    pageState.push.mockReset();
  });

  it("blocks direct access without approve permission", () => {
    pageState.canApprove = false;
    render(
      <AcademicContentReviewQueueAccess>
        <div>Protected review queue</div>
      </AcademicContentReviewQueueAccess>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "academics.academic_content.approve",
    );
  });

  it("shows recoverable error and empty states", () => {
    const reload = vi.fn();
    const { rerender } = render(
      <AcademicContentReviewQueueView
        queue={queueState({ error: { message: "Queue unavailable" }, reload })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Queue unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(reload).toHaveBeenCalledOnce();

    rerender(<AcademicContentReviewQueueView queue={queueState()} />);
    expect(screen.getByText("No submissions awaiting review")).toBeInTheDocument();
  });

  it("keeps the review table visible while refreshed rows load", () => {
    render(
      <AcademicContentReviewQueueView
        queue={queueState({ isLoading: true, total: 1 })}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
  });

  it("opens the immutable submitted revision and preserves context", () => {
    render(
      <AcademicContentReviewQueueView
        queue={queueState({
          total: 1,
          items: [
            {
              contentId: "content/1",
              title: "Fractions preparation",
              academicYearId: "year-1",
              termId: "term-1",
              approvalId: "approval-1",
              submittedRevisionId: "revision/2",
              roundNumber: 2,
              submittedAt: "2026-10-01T08:00:00.000Z",
              submittedByUserId: "teacher-1",
              targets: [],
            },
          ],
        })}
      />,
    );

    fireEvent.click(screen.getByText("Fractions preparation"));
    expect(pageState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/review/content%2F1/revision%2F2?year=year-1&term=term-1",
      { scroll: false },
    );
  });
});
