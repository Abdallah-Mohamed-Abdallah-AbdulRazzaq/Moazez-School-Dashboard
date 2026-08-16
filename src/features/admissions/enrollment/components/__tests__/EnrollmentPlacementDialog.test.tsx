import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EnrollmentPlacementDialog from "../EnrollmentPlacementDialog";
import { validateEnrollment } from "../../api/enrollmentApi";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      "dialogs.placement.new_title": "New enrollment",
      "dialogs.placement.academic_context": "Academic context",
      "dialogs.placement.academic_year": "Academic year",
      "dialogs.placement.term": "Term",
      "dialogs.placement.student": "Student",
      "dialogs.placement.grade": "Grade",
      "dialogs.placement.section": "Section",
      "dialogs.placement.classroom": "Classroom",
      "dialogs.placement.enrollment_date": "Enrollment date",
      "dialogs.placement.validation.student_required": "Select a student.",
      "dialogs.placement.validation.grade_required": "Select a grade.",
      "dialogs.placement.validation.section_required": "Select a section.",
      "dialogs.placement.validation.classroom_required": "Select a classroom.",
      "dialogs.placement.validation.enrollment_date_required":
        "Select an enrollment date.",
      cancel: "Cancel",
      "actions.save": "Save",
    };

    return messages[key] ?? key;
  },
}));

vi.mock("../../api/enrollmentApi", () => ({
  createEnrollment: vi.fn(),
  upsertEnrollment: vi.fn(),
  validateEnrollment: vi.fn(),
}));

const academicYear = {
  id: "year-1",
  name: "2026/2027",
};

const term = {
  id: "term-1",
  name: "Term 1",
};

function renderDialog() {
  render(
    <EnrollmentPlacementDialog
      open
      enrollment={null}
      students={[]}
      academicYear={academicYear}
      term={term}
      grades={[]}
      sections={[]}
      classrooms={[]}
      onClose={vi.fn()}
      onSuccess={vi.fn()}
    />,
  );
}

describe("EnrollmentPlacementDialog", () => {
  it("shows the locked year and term as one academic context", () => {
    renderDialog();

    expect(screen.getByText("Academic context")).toBeInTheDocument();
    expect(screen.getByText("2026/2027")).toBeInTheDocument();
    expect(screen.getByText("Term 1")).toBeInTheDocument();
  });

  it("shows inline errors before submitting an incomplete placement", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Select a student.")).toBeInTheDocument();
    expect(screen.getByText("Select a grade.")).toBeInTheDocument();
    expect(screen.getByText("Select a section.")).toBeInTheDocument();
    expect(screen.getByText("Select a classroom.")).toBeInTheDocument();
    expect(validateEnrollment).not.toHaveBeenCalled();
  });
});
