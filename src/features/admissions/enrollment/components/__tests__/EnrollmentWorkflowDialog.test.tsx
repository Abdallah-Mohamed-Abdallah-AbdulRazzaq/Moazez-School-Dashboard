import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import EnrollmentWorkflowDialog from "../EnrollmentWorkflowDialog";
import { promoteEnrollment } from "../../api/enrollmentApi";

vi.mock("../../api/enrollmentApi", () => ({
  promoteEnrollment: vi.fn(),
  transferEnrollment: vi.fn(),
  withdrawEnrollment: vi.fn(),
}));

const enrollment = {
  id: "enrollment-1",
  studentId: "student-1",
  studentName: "Student One",
  academicYear: "2026/2027",
  academicYearId: "year-current",
  grade: "Grade 1",
  gradeId: "grade-1",
  section: "Section A",
  sectionId: "section-current",
  classroom: "Current classroom",
  classroomId: "classroom-current",
  enrollmentDate: "2026-09-01",
  status: "active" as const,
};

const academicYears = [
  { id: "year-current", name: "2026/2027", nameAr: "", nameEn: "", isActive: true },
  { id: "year-inactive", name: "2027/2028", nameAr: "", nameEn: "", isActive: false },
  { id: "year-target", name: "2028/2029", nameAr: "", nameEn: "", isActive: true },
];

function renderWorkflow(action: "transfer" | "withdraw" | "promote") {
  render(
    <EnrollmentWorkflowDialog
      action={action}
      enrollment={enrollment}
      stages={[{ id: "stage-1", name: "Primary" }]}
      grades={[{ id: "grade-1", name: "Grade 1", parentId: "stage-1" }]}
      sections={[
        { id: "section-current", name: "Section A", parentId: "grade-1" },
        { id: "section-target", name: "Section B", parentId: "grade-1" },
      ]}
      classrooms={[
        { id: "classroom-current", name: "Current classroom", parentId: "section-current" },
        { id: "classroom-target", name: "Target classroom", parentId: "section-current" },
      ]}
      academicYears={academicYears}
      onClose={vi.fn()}
      onSuccess={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe("EnrollmentWorkflowDialog", () => {
  it("shows unavailable promotion years as disabled", () => {
    renderWorkflow("promote");

    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_academic_year" }));

    expect(screen.getByRole("button", { name: "2028/2029" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026/2027" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "2027/2028" })).toBeDisabled();
  });

  it("cascades the transfer destination from stage to classroom", () => {
    renderWorkflow("transfer");

    expect(screen.getByRole("button", { name: "dialogs.workflow.target_grade" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_stage" }));
    fireEvent.click(screen.getByRole("button", { name: "Primary" }));
    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_grade" }));
    fireEvent.click(screen.getByRole("button", { name: "Grade 1" }));
    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_section" }));
    fireEvent.click(screen.getByRole("button", { name: "Section A" }));
    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_classroom" }));

    expect(screen.getByRole("button", { name: "Target classroom" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current classroom" })).toBeDisabled();
  });

  it("shows a translated placement conflict after a lifecycle request fails", async () => {
    vi.mocked(promoteEnrollment).mockRejectedValueOnce(
      new ApiError("Placement conflict", 409, "students.enrollment.placement_conflict"),
    );
    renderWorkflow("promote");

    fireEvent.click(screen.getByRole("button", { name: "dialogs.workflow.target_academic_year" }));
    fireEvent.click(screen.getByRole("button", { name: "2028/2029" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("errors.placement_conflict");
    });
  });
});
