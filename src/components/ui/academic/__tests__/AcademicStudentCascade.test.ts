import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import AcademicStudentCascade, {
  filterAcademicStudentCascadeOptions,
} from "../AcademicStudentCascade";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("filterAcademicStudentCascadeOptions", () => {
  it("filters each level by the selection immediately before it", () => {
    const result = filterAcademicStudentCascadeOptions(
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      {
        grades: [
          { id: "grade-1", stageId: "stage-1" },
          { id: "grade-2", stageId: "stage-2" },
        ],
        sections: [
          { id: "section-1", gradeId: "grade-1" },
          { id: "section-2", gradeId: "grade-2" },
        ],
        classrooms: [
          { id: "classroom-1", sectionId: "section-1" },
          { id: "classroom-2", sectionId: "section-2" },
        ],
        students: [
          { id: "student-1", stageId: "stage-1", gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1" },
          { id: "student-2", stageId: "stage-2", gradeId: "grade-2", sectionId: "section-2", classroomId: "classroom-2" },
        ],
      },
    );

    expect(result.grades.map((item) => item.id)).toEqual(["grade-1"]);
    expect(result.sections.map((item) => item.id)).toEqual(["section-1"]);
    expect(result.classrooms.map((item) => item.id)).toEqual(["classroom-1"]);
    expect(result.students.map((item) => item.id)).toEqual(["student-1"]);
  });

  it("requires every selected academic id on student records", () => {
    const result = filterAcademicStudentCascadeOptions(
      {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      {
        students: [
          {
            id: "student-complete",
            stageId: "stage-1",
            gradeId: "grade-1",
            sectionId: "section-1",
            classroomId: "classroom-1",
          },
          {
            id: "student-missing-classroom",
            stageId: "stage-1",
            gradeId: "grade-1",
            sectionId: "section-1",
          },
        ],
      },
    );

    expect(result.students.map((item) => item.id)).toEqual(["student-complete"]);
  });
});

describe("AcademicStudentCascade", () => {
  const options = {
    stages: [
      { id: "stage-1", name: "Stage 1" },
      { id: "stage-2", name: "Stage 2" },
    ],
    grades: [
      { id: "grade-1", name: "Grade 1", stageId: "stage-1" },
      { id: "grade-2", name: "Grade 2", stageId: "stage-1" },
    ],
    sections: [
      { id: "section-1", name: "Section 1", gradeId: "grade-1" },
      { id: "section-2", name: "Section 2", gradeId: "grade-1" },
    ],
    classrooms: [
      { id: "classroom-1", name: "Classroom 1", sectionId: "section-1" },
      { id: "classroom-2", name: "Classroom 2", sectionId: "section-1" },
    ],
    students: [
      {
        id: "student-1",
        name: "Student 1",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      {
        id: "student-2",
        name: "Student 2",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
    ],
  };

  const value = {
    stageId: "stage-1",
    gradeId: "grade-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    studentId: "student-1",
  };

  it("hides the student selector while retaining the academic selectors", () => {
    const onChange = vi.fn();

    render(
      createElement(AcademicStudentCascade, {
        value,
        options,
        onChange,
        showStudent: false,
      }),
    );

    expect(screen.getByRole("button", { name: "Stage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Classroom" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Student" })).not.toBeInTheDocument();
  });

  it("renders the student selector by default for backward compatibility", () => {
    const onChange = vi.fn();

    render(createElement(AcademicStudentCascade, { value, options, onChange }));

    expect(screen.getByRole("button", { name: "Student" })).toBeInTheDocument();
  });

  it("clears all descendants when the stage changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(createElement(AcademicStudentCascade, { value, options, onChange }));

    await user.click(screen.getByRole("button", { name: "Stage" }));
    await user.click(screen.getByRole("button", { name: "Stage 2" }));

    expect(onChange).toHaveBeenCalledWith({
      stageId: "stage-2",
      gradeId: undefined,
      sectionId: undefined,
      classroomId: undefined,
      studentId: undefined,
    });
  });

  it("preserves the selected academic context when the student changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(createElement(AcademicStudentCascade, { value, options, onChange }));

    await user.click(screen.getByRole("button", { name: "Student" }));
    await user.click(screen.getByRole("button", { name: "Student 2" }));

    expect(onChange).toHaveBeenCalledWith({
      ...value,
      studentId: "student-2",
    });
  });

  it("includes record search text when searching student identifiers", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      createElement(AcademicStudentCascade, {
        value: {
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
        },
        options: {
          ...options,
          students: [{ ...options.students[0], searchText: "ST-123" }],
        },
        onChange,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Student" }));
    await user.type(screen.getByPlaceholderText("Search..."), "ST-123");

    expect(screen.getByRole("button", { name: "Student 1" })).toBeInTheDocument();
  });
});
