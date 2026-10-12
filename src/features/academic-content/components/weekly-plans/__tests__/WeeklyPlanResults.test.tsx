import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentLibraryItem } from "../../../types/contracts";
import WeeklyPlanResults from "../WeeklyPlanResults";

const plan: AcademicContentLibraryItem = {
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "Final week plan",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00Z",
  updatedAt: "2026-10-02T08:00:00Z",
  summary: { type: "WEEKLY_PLAN", weekStartDate: "2026-10-15", weekEndDate: "2026-10-17" },
};

describe("weekly plan table weeks", () => {
  it("shows the calculated final week and its shortened date range in the first column", () => {
    render(<WeeklyPlanResults
      items={[plan]} termBounds={{ startDate: "2026-10-01", endDate: "2026-10-17" }}
      page={1} limit={10} total={1} search="" view="table"
      isLoading={false} error={null} hasFilters={false}
      onOpen={vi.fn()} onRetry={vi.fn()} onClearFilters={vi.fn()}
      onPageChange={vi.fn()} onPageSizeChange={vi.fn()}
    />);
    const table = screen.getByRole("table");
    const row = within(table).getAllByRole("row")[1];
    const firstCell = within(row).getAllByRole("cell")[0];
    expect(firstCell).toHaveTextContent(/Week 3 · Oct 15/);
    expect(firstCell).toHaveTextContent(/17$/);
  });
});
