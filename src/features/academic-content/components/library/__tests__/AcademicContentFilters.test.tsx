import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentFilters from "../AcademicContentFilters";
import type { AcademicContentLibraryFilters } from "../../../hooks/useAcademicContentLibrary";

const listTeachers = vi.hoisted(() => vi.fn());

vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: { list: listTeachers },
}));

const filters: AcademicContentLibraryFilters = {
  page: 1,
  limit: 50,
  type: "",
  status: "",
  audience: "",
  stageId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
  subjectId: "",
  teacherUserId: "",
  resourceCategory: "",
  weeklyDateFrom: "",
  weeklyDateTo: "",
  sessionStartAtFrom: "",
  sessionStartAtTo: "",
  sessionPlatform: "",
  guardianPriority: "",
  tag: "",
  search: "",
};

describe("AcademicContentFilters", () => {
  beforeEach(() => {
    listTeachers.mockReset().mockResolvedValue({
      items: [
        {
          userId: "teacher-user-1",
          displayName: { fullName: "Mona Hassan" },
        },
      ],
      pagination: { page: 1, limit: 100, total: 1 },
    });
  });

  it("exposes every backend library filter with bounded text inputs", async () => {
    render(
      <AcademicContentFilters
        filters={filters}
        search=""
        onSearchChange={vi.fn()}
        onFiltersChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Search content")).toHaveAttribute(
      "maxLength",
      "120",
    );
    fireEvent.click(screen.getByRole("button", { name: "Show filters" }));

    for (const label of [
      "Content type",
      "Status",
      "Audience",
      "Stage ID",
      "Grade ID",
      "Section ID",
      "Classroom ID",
      "Subject ID",
      "Teacher",
      "Resource category",
      "Week from",
      "Week to",
      "Session from",
      "Session to",
      "Session platform",
      "Guardian priority",
      "Tag",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Tag")).toHaveAttribute("maxLength", "80");
    await waitFor(() =>
      expect(listTeachers).toHaveBeenCalledWith({
        employmentStatus: "ACTIVE",
        page: 1,
        limit: 100,
      }),
    );
  });
});
