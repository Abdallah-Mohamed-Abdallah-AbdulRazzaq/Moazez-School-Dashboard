import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import type { AcademicTargetOptions } from "../../../services/academicContentSelectors";
import AcademicTargetsSection from "../AcademicTargetsSection";

const options: AcademicTargetOptions = {
  structure: {
    stages: [{ id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 }],
    grades: [{ id: "grade-1", stageId: "stage-1", name: "Grade 1", nameAr: "أول", nameEn: "Grade 1", capacity: 20, order: 1 }],
    sections: [{ id: "section-1", gradeId: "grade-1", name: "A", nameAr: "أ", nameEn: "A", capacity: 20, order: 1 }],
    classrooms: [{ id: "class-1", sectionId: "section-1", name: "Room A", nameAr: "فصل أ", nameEn: "Room A", capacity: 20, order: 1 }],
  },
  subjects: [{ id: "subject-1", name: "Math", nameAr: "رياضيات", nameEn: "Math", code: "M", color: null, isActive: true }],
  subjectAllocations: [{ id: "subject-allocation-1", gradeId: "grade-1", subjectId: "subject-1", weeklyHours: 5 }],
  teacherAllocations: [{ id: "teacher-allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "class-1", subjectId: "subject-1", teacherId: "teacher-1" }],
};

function content(targets: AcademicContentDetail["targets"]): AcademicContentDetail {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "WEEKLY_PLAN",
    audience: "STUDENTS",
    title: "Week one",
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T08:00:00.000Z",
    targets,
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

describe("AcademicTargetsSection", () => {
  it("saves the full normalized target array once", async () => {
    const onSave = vi.fn(async () => true);
    render(
      <AcademicTargetsSection
        content={content([
          {
            id: "target-1",
            scopeType: "CLASSROOM",
            stageId: null,
            gradeId: null,
            sectionId: null,
            classroomId: "class-1",
            subjectId: "subject-1",
            teacherSubjectAllocationId: "teacher-allocation-1",
          },
        ])}
        disabled={false}
        sectionState={{ dirty: true, saving: false, error: null }}
        onDirtyChange={vi.fn()}
        onSave={onSave}
        loadOptions={vi.fn(async () => options)}
      />,
    );

    await screen.findByText("Room A");
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith([
        {
          scopeType: "CLASSROOM",
          stageId: null,
          gradeId: null,
          sectionId: null,
          classroomId: "class-1",
          subjectId: "subject-1",
          teacherSubjectAllocationId: "teacher-allocation-1",
        },
      ]),
    );
  });

  it("prevents duplicate alternatives before calling the backend", async () => {
    const onSave = vi.fn(async () => true);
    const schoolTarget = {
      id: "target-1",
      scopeType: "SCHOOL" as const,
      stageId: null,
      gradeId: null,
      sectionId: null,
      classroomId: null,
      subjectId: "subject-1",
      teacherSubjectAllocationId: null,
    };
    render(
      <AcademicTargetsSection
        content={content([schoolTarget, { ...schoolTarget, id: "target-2" }])}
        disabled={false}
        sectionState={{ dirty: true, saving: false, error: null }}
        onDirtyChange={vi.fn()}
        onSave={onSave}
        loadOptions={vi.fn(async () => options)}
      />,
    );

    await screen.findAllByText("Whole school");
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Duplicate targets");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("requires a subject for subject-qualified content types", async () => {
    const onSave = vi.fn(async () => true);
    render(
      <AcademicTargetsSection
        content={content([
          {
            id: "target-1",
            scopeType: "SCHOOL",
            stageId: null,
            gradeId: null,
            sectionId: null,
            classroomId: null,
            subjectId: null,
            teacherSubjectAllocationId: null,
          },
        ])}
        disabled={false}
        sectionState={{ dirty: true, saving: false, error: null }}
        onDirtyChange={vi.fn()}
        onSave={onSave}
        loadOptions={vi.fn(async () => options)}
      />,
    );

    await screen.findByText("Whole school");
    fireEvent.click(screen.getByRole("button", { name: "Save targets" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Subject is required");
    expect(onSave).not.toHaveBeenCalled();
  });
});
