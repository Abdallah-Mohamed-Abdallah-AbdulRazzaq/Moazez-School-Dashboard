import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AcademicContentFilters from "../AcademicContentFilters";
import type { AcademicContentLibraryFilters } from "../../../hooks/useAcademicContentLibrary";
import type { AcademicContentBrowseOptionsState } from "../../../hooks/useAcademicContentBrowseOptions";

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

const browseOptions: AcademicContentBrowseOptionsState = {
  targetOptions: {
    structure: {
      stages: [
        {
          id: "stage-1",
          name: "Primary",
          nameAr: "ابتدائي",
          nameEn: "Primary",
          order: 1,
        },
        {
          id: "stage-2",
          name: "Secondary",
          nameAr: "ثانوي",
          nameEn: "Secondary",
          order: 2,
        },
      ],
      grades: [
        {
          id: "grade-1",
          stageId: "stage-1",
          name: "Grade 5",
          nameAr: "الصف الخامس",
          nameEn: "Grade 5",
          capacity: 20,
          order: 1,
        },
      ],
      sections: [
        {
          id: "section-1",
          gradeId: "grade-1",
          name: "Section A",
          nameAr: "الشعبة أ",
          nameEn: "Section A",
          capacity: 20,
          order: 1,
        },
      ],
      classrooms: [
        {
          id: "classroom-1",
          sectionId: "section-1",
          name: "Class 5A",
          nameAr: "فصل ٥أ",
          nameEn: "Class 5A",
          capacity: 20,
          order: 1,
        },
      ],
    },
    subjects: [
      {
        id: "subject-1",
        name: "Mathematics",
        nameAr: "الرياضيات",
        nameEn: "Mathematics",
        code: "MATH",
        color: null,
        isActive: true,
      },
    ],
    subjectAllocations: [],
    teacherAllocations: [],
  },
  teachers: [
    {
      id: "teacher-profile-1",
      userId: "teacher-user-1",
      loginEmail: "mona@example.com",
      username: "mona",
      contactEmail: null,
      phone: null,
      teacherCode: "T-1",
      firstNameAr: "منى",
      lastNameAr: "حسن",
      firstNameEn: "Mona",
      lastNameEn: "Hassan",
      displayName: {
        firstName: "Mona",
        lastName: "Hassan",
        fullName: "Mona Hassan",
      },
      gender: "FEMALE",
      department: null,
      specialization: null,
      accountStatus: "ACTIVE",
      membershipStatus: "ACTIVE",
      membershipEndedAt: null,
      employmentStatus: "ACTIVE",
      profileCompleteness: { isComplete: true, missingFields: [] },
      credentialSummary: {
        hasPassword: true,
        status: "set",
        mustChangePassword: false,
        passwordProvisionedAt: "2026-09-01T00:00:00.000Z",
        passwordChangedAt: null,
        credentialVersion: 1,
      },
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  isLoadingTargets: false,
  isLoadingTeachers: false,
  targetOptionsUnavailable: false,
  teachersUnavailable: false,
};

function renderFilters(
  filterOverrides: Partial<AcademicContentLibraryFilters> = {},
  onFiltersChange = vi.fn(),
) {
  render(
    <AcademicContentFilters
      filters={{ ...filters, ...filterOverrides }}
      search=""
      resultCount={12}
      browseOptions={browseOptions}
      onSearchChange={vi.fn()}
      onFiltersChange={onFiltersChange}
      onClear={vi.fn()}
    />,
  );
  return onFiltersChange;
}

describe("AcademicContentFilters", () => {
  it("uses named cascading selectors and clears dependent scope filters", () => {
    const onFiltersChange = renderFilters({
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
    });

    fireEvent.click(screen.getByRole("button", { name: "Show filters" }));

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
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Grade 5")).toBeInTheDocument();
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Class 5A")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Stage"));
    fireEvent.click(screen.getByRole("button", { name: "Secondary" }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      stageId: "stage-2",
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
    expect(screen.queryByText("stage-1")).not.toBeInTheDocument();
  });

  it("shows readable removable applied filters and the result count", () => {
    const onFiltersChange = renderFilters({
      stageId: "stage-1",
      subjectId: "subject-1",
      teacherUserId: "teacher-user-1",
    });

    expect(screen.getByText("12 results")).toBeInTheDocument();
    expect(screen.getByText("Stage: Primary")).toBeInTheDocument();
    expect(screen.getByText("Subject: Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Teacher: Mona Hassan")).toBeInTheDocument();
    expect(screen.queryByText("subject-1")).not.toBeInTheDocument();
    expect(screen.queryByText("teacher-user-1")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Stage: Primary" }),
    );
    expect(onFiltersChange).toHaveBeenCalledWith({
      stageId: "",
      gradeId: "",
      sectionId: "",
      classroomId: "",
    });
  });
});
