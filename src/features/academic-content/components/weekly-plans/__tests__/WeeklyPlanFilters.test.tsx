import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeeklyPlanFilters from "../WeeklyPlanFilters";

describe("WeeklyPlanFilters", () => {
  it("exposes backend weekly dates, section, teacher, and tag filters", () => {
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
    expect(screen.getByLabelText("Week overlaps through")).toHaveAttribute(
      "min",
      "2026-10-05",
    );
    fireEvent.change(screen.getByLabelText("Week overlaps from"), {
      target: { value: "2026-10-06" },
    });
    expect(onFiltersChange).toHaveBeenCalledWith({
      weeklyDateFrom: "2026-10-06",
    });
  });
});
