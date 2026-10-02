import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewQueueFilters from "../ReviewQueueFilters";
import type { AcademicContentReviewQueueFilters } from "../../../hooks/useAcademicContentReviewQueue";

const loadAcademicTargetOptions = vi.hoisted(() => vi.fn());
const listTeachers = vi.hoisted(() => vi.fn());

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
    }),
  }),
);

vi.mock("../../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions,
}));

vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: { list: listTeachers },
}));

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
  beforeEach(() => {
    loadAcademicTargetOptions.mockReset().mockResolvedValue({
      structure: {
        stages: [{ id: "stage-1", name: "Primary" }],
        grades: [{ id: "grade-1", stageId: "stage-1", name: "Grade 1" }],
        sections: [
          { id: "section-1", gradeId: "grade-1", name: "Section A" },
        ],
        classrooms: [
          {
            id: "classroom-1",
            sectionId: "section-1",
            name: "Classroom 1",
          },
        ],
      },
      subjects: [{ id: "subject-1", name: "Mathematics", isActive: true }],
      subjectAllocations: [],
      teacherAllocations: [],
    });
    listTeachers.mockReset().mockResolvedValue({
      items: [
        {
          userId: "teacher-1",
          displayName: { fullName: "Mona Hassan" },
        },
      ],
      pagination: { page: 1, limit: 100, total: 1 },
    });
  });

  it("exposes search and every review-queue scope filter", async () => {
    const onSearchChange = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <ReviewQueueFilters
        filters={filters}
        search=""
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Search submissions")).toHaveAttribute(
      "maxLength",
      "120",
    );
    fireEvent.change(screen.getByLabelText("Search submissions"), {
      target: { value: "fractions" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("fractions");
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

    await waitFor(() => {
      expect(loadAcademicTargetOptions).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
      });
      expect(listTeachers).toHaveBeenCalledWith({
        employmentStatus: "ACTIVE",
        page: 1,
        limit: 100,
      });
    });

    fireEvent.click(screen.getByLabelText("Stage"));
    fireEvent.click(await screen.findByRole("button", { name: "Primary" }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      stageId: "stage-1",
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
  });
});
