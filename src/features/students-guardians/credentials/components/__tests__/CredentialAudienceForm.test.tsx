import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AcademicStudentCascadeOptions } from "@/components/ui/academic/AcademicStudentCascade";
import CredentialAudienceForm from "../CredentialAudienceForm";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const academicYears = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "2026/2027",
    nameAr: "٢٠٢٦/٢٠٢٧",
    nameEn: "2026/2027",
  },
];
const academicOptions: AcademicStudentCascadeOptions = {
  stages: [{ id: "stage-1", name: "Primary" }],
  grades: [{ id: "grade-1", name: "Grade 1", stageId: "stage-1" }],
  sections: [{ id: "section-1", name: "A", gradeId: "grade-1" }],
  classrooms: [
    { id: "classroom-1", name: "Room 1", sectionId: "section-1" },
  ],
};

describe("CredentialAudienceForm", () => {
  it("offers all eight backend audience modes", async () => {
    const user = userEvent.setup();

    render(
      <CredentialAudienceForm
        draft={{ audienceMode: "missing_password" }}
        selectedStudents={[]}
        academicYears={academicYears}
        academicOptions={academicOptions}
        onChange={vi.fn()}
        onSelectedStudentsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Audience/ }));

    for (const name of [
      "Registration batch",
      "Selected students",
      "Academic year",
      "Stage",
      "Grade",
      "Section",
      "Classroom",
      "Students missing passwords",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("clears previous selectors and selected labels when the mode changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSelectedStudentsChange = vi.fn();

    render(
      <CredentialAudienceForm
        draft={{
          audienceMode: "classroom",
          academicYearId: academicYears[0].id,
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
        }}
        selectedStudents={[{ id: "student-1", label: "Student One" }]}
        academicYears={academicYears}
        academicOptions={academicOptions}
        onChange={onChange}
        onSelectedStudentsChange={onSelectedStudentsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Audience/ }));
    await user.click(
      screen.getByRole("button", { name: "Students missing passwords" }),
    );

    expect(onChange).toHaveBeenCalledWith({ audienceMode: "missing_password" });
    expect(onSelectedStudentsChange).toHaveBeenCalledWith([]);
  });

  it("shows only the academic selectors needed to reach a grade", () => {
    render(
      <CredentialAudienceForm
        draft={{ audienceMode: "grade", academicYearId: academicYears[0].id }}
        selectedStudents={[]}
        academicYears={academicYears}
        academicOptions={academicOptions}
        onChange={vi.fn()}
        onSelectedStudentsChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Academic year/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grade" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Section" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Classroom" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Student" })).not.toBeInTheDocument();
  });

  it("shows the registration batch input only for import mode", () => {
    const { rerender } = render(
      <CredentialAudienceForm
        draft={{ audienceMode: "import_batch" }}
        selectedStudents={[]}
        academicYears={academicYears}
        academicOptions={academicOptions}
        onChange={vi.fn()}
        onSelectedStudentsChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Registration batch ID/)).toBeInTheDocument();

    rerender(
      <CredentialAudienceForm
        draft={{ audienceMode: "missing_password" }}
        selectedStudents={[]}
        academicYears={academicYears}
        academicOptions={academicOptions}
        onChange={vi.fn()}
        onSelectedStudentsChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/Registration batch ID/)).not.toBeInTheDocument();
  });
});
