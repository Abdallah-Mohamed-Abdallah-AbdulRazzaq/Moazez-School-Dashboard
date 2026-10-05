import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeacherPreparationCounts } from "../../../hooks/useTeacherPreparations";
import type { AcademicContentLibraryItem } from "../../../types/contracts";
import PreparationStatsGrid from "../PreparationStatsGrid";
import TeacherPreparationFilters from "../TeacherPreparationFilters";
import TeacherPreparationResults from "../TeacherPreparationResults";
import TeacherPreparationsHeader from "../TeacherPreparationsHeader";

const push = vi.hoisted(() => vi.fn());
let canManage = true;
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return { ...actual, useRouter: () => ({ push }) };
});
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => canManage }),
}));

const resource = (data: number | null, error: Error | null = null) => ({
  data,
  isLoading: false,
  error: error ? { code: "UNKNOWN_ERROR", message: error.message } : null,
});

const counts: TeacherPreparationCounts = {
  total: resource(12),
  draft: resource(0),
  pendingApproval: resource(3),
  approved: resource(9),
};

const preparation: AcademicContentLibraryItem = {
  id: "content/1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Fractions",
  description: "Compare equivalent fractions",
  status: "SUBMITTED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  summary: { type: "TEACHER_PREPARATION", topic: "Equivalent fractions" },
};

describe("teacher preparations presentation", () => {
  beforeEach(() => {
    push.mockReset();
    canManage = true;
  });

  it("shows summary counts and retries only a failed card", () => {
    const onRetry = vi.fn();
    render(
      <PreparationStatsGrid
        counts={{ ...counts, draft: resource(null, new Error("unavailable")) }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledWith("draft");
  });

  it("gates creation and keeps the fixed preparation type", () => {
    const { rerender } = render(<TeacherPreparationsHeader yearId="year-1" termId="term-1" />);
    fireEvent.click(screen.getByRole("button", { name: "New preparation" }));
    expect(push).toHaveBeenCalledWith(
      "/en/academic-content-hub/new?year=year-1&term=term-1&type=TEACHER_PREPARATION",
    );

    canManage = false;
    rerender(<TeacherPreparationsHeader yearId="year-1" termId="term-1" />);
    expect(screen.queryByRole("button", { name: "New preparation" })).not.toBeInTheDocument();
  });

  it("renders only supported filters", () => {
    const onFiltersChange = vi.fn();
    render(
      <TeacherPreparationFilters
        filters={{ page: 1, limit: 10, status: "", teacherUserId: "", stageId: "", gradeId: "", classroomId: "", subjectId: "", search: "" }}
        search=""
        resultCount={0}
        browseOptions={{ targetOptions: null, teachers: [], isLoadingTargets: false, isLoadingTeachers: false, targetOptionsUnavailable: false, teachersUnavailable: false }}
        onSearchChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Teacher")).toBeVisible();
    expect(screen.getByLabelText("Status")).toBeVisible();
    expect(screen.queryByText("Readiness")).not.toBeInTheDocument();
    expect(screen.queryByText(/Sort/)).not.toBeInTheDocument();
  });

  it("renders contract-backed result fields and opens the content", () => {
    const onOpen = vi.fn();
    render(
      <TeacherPreparationResults
        items={[preparation]}
        page={1}
        limit={10}
        total={1}
        search=""
        isLoading={false}
        error={null}
        hasFilters={false}
        onOpen={onOpen}
        onRetry={vi.fn()}
        onClearFilters={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Fractions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Equivalent fractions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending approval").length).toBeGreaterThan(0);
    expect(screen.queryByText("Teacher")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
    expect(onOpen).toHaveBeenCalledWith("content/1");
  });
});
