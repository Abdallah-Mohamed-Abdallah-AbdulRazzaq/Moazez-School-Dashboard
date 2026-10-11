import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeeklyPlanFilters from "../WeeklyPlanFilters";

describe("WeeklyPlanFilters", () => {
  it("maps a numbered week to both backend dates and clears them together", () => {
    const onFiltersChange = vi.fn();
    render(
      <WeeklyPlanFilters
        filters={{
          page: 1,
          limit: 10,
          status: "",
          audience: "",
          stageId: "",
          gradeId: "",
          sectionId: "",
          classroomId: "",
          subjectId: "",
          teacherUserId: "",
          tag: "",
          weeklyDateFrom: "2026-10-05",
          weeklyDateTo: "2026-10-11",
          search: "",
          view: "table",
        }}
        search=""
        termBounds={{ startDate: "2026-10-01", endDate: "2026-10-21" }}
        browseOptions={{
          targetOptions: null,
          teachers: [],
          isLoadingTargets: false,
          isLoadingTeachers: false,
          targetOptionsUnavailable: false,
          teachersUnavailable: false,
        }}
        onSearchChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Section")).toBeVisible();
    expect(screen.getByLabelText("Assigned teacher")).toBeVisible();
    expect(screen.getByLabelText("Tag")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    fireEvent.click(screen.getByRole("button", { name: /Week 3 ·/ }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      weeklyDateFrom: "2026-10-15",
      weeklyDateTo: "2026-10-21",
    });
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    fireEvent.click(screen.getByRole("button", { name: "All weeks" }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ weeklyDateFrom: "", weeklyDateTo: "" });
  });
});
