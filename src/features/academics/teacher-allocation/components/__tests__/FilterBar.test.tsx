import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "@/features/academics/teacher-allocation/components/FilterBar";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";

const grade: Grade = {
  id: "grade-1",
  stageId: "stage-1",
  name: "Grade 1",
  nameAr: "Grade 1 AR",
  nameEn: "Grade 1",
  order: 1,
};

const section: Section = {
  id: "section-1",
  gradeId: "grade-1",
  name: "Section A",
  nameAr: "Section A AR",
  nameEn: "Section A",
  order: 1,
};

const classroom: Classroom = {
  id: "classroom-1",
  sectionId: "section-1",
  name: "Classroom A",
  nameAr: "Classroom A AR",
  nameEn: "Classroom A",
  order: 1,
};

function renderFilterBar() {
  const callbacks = {
    onGradeChange: vi.fn(),
    onSectionChange: vi.fn(),
    onClassroomChange: vi.fn(),
    onSubjectChange: vi.fn(),
    onShowOnlyMissingChange: vi.fn(),
    onValidate: vi.fn(),
  };

  render(
    <FilterBar
      grades={[grade]}
      sections={[section]}
      classrooms={[classroom]}
      subjects={[]}
      selectedGradeId=""
      selectedSectionId=""
      selectedClassroomId=""
      selectedSubjectId=""
      showOnlyMissing={false}
      {...callbacks}
    />,
  );

  return callbacks;
}

describe("teacher allocation FilterBar", () => {
  it("emits only the grade change when selecting a grade", () => {
    const callbacks = renderFilterBar();

    fireEvent.click(screen.getByRole("button", { name: /filters\.grade/i }));
    fireEvent.click(screen.getByRole("button", { name: "Grade 1" }));

    expect(callbacks.onGradeChange).toHaveBeenCalledWith("grade-1");
    expect(callbacks.onSectionChange).not.toHaveBeenCalled();
    expect(callbacks.onClassroomChange).not.toHaveBeenCalled();
  });
});
