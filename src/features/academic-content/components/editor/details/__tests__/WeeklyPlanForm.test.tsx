import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeeklyPlanForm from "../WeeklyPlanForm";
import { emptyWeeklyPlanDetail } from "../../../../model/weeklyPlanDetail";

describe("WeeklyPlanForm", () => {
  it("explains assessment eligibility and publication beside the selector", () => {
    render(<WeeklyPlanForm initial={emptyWeeklyPlanDetail("2026-10-12")}
      disabled={false} sectionState={{ dirty: false, saving: false, error: null }}
      onDirty={() => undefined} onSave={async () => true} />);
    expect(screen.getByRole("group", { name: "Grade assessments" }))
      .toHaveAccessibleDescription(/Draft, published, and approved assessments can be linked\. Linking an assessment does not publish it\./);
  });

  it("saves a numbered week's date range and deduplicates linked references", () => {
    const onSave = vi.fn(async () => true);
    render(<WeeklyPlanForm initial={{ weekStartDate: "2026-09-01", weekEndDate: "2026-09-07", objectives: [], topics: [], expectedHomework: null, upcomingAssessments: null, notes: null, homeworkAssignmentIds: ["homework-1", "homework-1"], gradeAssessmentIds: [] }} termStartDate="2026-09-01" termEndDate="2026-12-31" disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    fireEvent.click(screen.getByRole("button", { name: /Week 3 ·/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      weekStartDate: "2026-09-15",
      weekEndDate: "2026-09-21",
      homeworkAssignmentIds: ["homework-1"],
    }));
  });
});
