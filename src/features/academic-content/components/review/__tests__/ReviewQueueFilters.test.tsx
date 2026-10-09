import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { academicContentBrowseOptionsFixture } from "../../../__tests__/academicContentBrowseOptionsFixture";
import type { AcademicContentReviewQueueFilters } from "../../../hooks/useAcademicContentReviewQueue";
import ReviewQueueFilters from "../ReviewQueueFilters";

const filters: AcademicContentReviewQueueFilters = {
  page: 1,
  limit: 50,
  stageId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
  subjectId: "",
  teacherUserId: "",
  search: "",
};

describe("ReviewQueueFilters", () => {
  it("uses the shared named options and preserves dependent clearing", () => {
    const onFiltersChange = vi.fn();
    render(
      <ReviewQueueFilters
        filters={filters}
        search=""
        browseOptions={academicContentBrowseOptionsFixture}
        onSearchChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Show review filters" }),
    );

    for (const label of [
      "Stage",
      "Grade",
      "Section",
      "Classroom",
      "Subject",
      "Teacher",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByLabelText("Stage"));
    fireEvent.click(screen.getByRole("button", { name: "Primary" }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      stageId: "stage-1",
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
  });
});
