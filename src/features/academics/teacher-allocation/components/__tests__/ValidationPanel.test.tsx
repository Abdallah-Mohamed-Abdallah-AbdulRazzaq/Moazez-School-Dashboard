import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import ValidationPanel from "@/features/academics/teacher-allocation/components/ValidationPanel";
import {
  fetchTeacherAllocationValidation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TeacherAllocationValidationResponse } from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherAllocationValidation: vi.fn(),
}));

const mockedFetchTeacherAllocationValidation = vi.mocked(fetchTeacherAllocationValidation);

const validationResponse: TeacherAllocationValidationResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  summary: {
    gradesChecked: 1,
    subjectAllocationRows: 1,
    teacherAllocationRows: 0,
    missingTeacherAssignments: 1,
    missingSubjectAllocationRows: 0,
    overAllocatedSubjects: 0,
    underAllocatedSubjects: 0,
  },
  items: [
    {
      gradeId: "grade-1",
      grade: { id: "grade-1", nameAr: "Grade 1 AR", nameEn: "Grade 1" },
      subjectId: "subject-1",
      subject: { id: "subject-1", nameAr: "Math AR", nameEn: "Math" },
      weeklyHours: 5,
      classroomCount: 1,
      allocatedClassroomCount: 0,
      missingClassroomCount: 1,
      status: "incomplete",
      issues: [
        {
          code: "missing_teacher",
          message: "Classroom A needs a teacher.",
          classroomIds: ["classroom-1"],
        },
      ],
    },
  ],
};

describe("ValidationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads backend validation with GET-backed filters when opened", async () => {
    mockedFetchTeacherAllocationValidation.mockResolvedValueOnce(validationResponse);

    render(
      <ValidationPanel
        open
        onClose={vi.fn()}
        termId="term-1"
        gradeId="grade-1"
        subjectId="subject-1"
      />,
    );

    await screen.findByText("Classroom A needs a teacher.");

    expect(mockedFetchTeacherAllocationValidation).toHaveBeenCalledWith({
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });
  });

  it("shows missing subject allocation backend errors clearly", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedFetchTeacherAllocationValidation.mockRejectedValueOnce(
      new ApiError(
        "Backend message",
        400,
        "academics.allocation.missing_subject_allocation",
      ),
    );

    try {
      render(
        <ValidationPanel
          open
          onClose={vi.fn()}
          termId="term-1"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "This subject has no weekly-hours row for the selected grade/term. Configure subject allocation first.",
          ),
        ).toBeInTheDocument();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
