import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import AllocationMatrixView from "@/features/academics/teacher-allocation/components/AllocationMatrixView";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

const grades: Grade[] = [
  {
    id: "grade-without-subject",
    stageId: "stage-1",
    name: "Grade 1",
    nameAr: "Grade 1 AR",
    nameEn: "Grade 1",
    order: 1,
  },
  {
    id: "grade-with-zero-hours",
    stageId: "stage-1",
    name: "Grade 2",
    nameAr: "Grade 2 AR",
    nameEn: "Grade 2",
    order: 2,
  },
  {
    id: "grade-with-subject",
    stageId: "stage-1",
    name: "Grade 3",
    nameAr: "Grade 3 AR",
    nameEn: "Grade 3",
    order: 3,
  },
];

const sections: Section[] = grades.map((grade, index) => ({
  id: `section-${index + 1}`,
  gradeId: grade.id,
  name: `Section ${index + 1}`,
  nameAr: `Section ${index + 1} AR`,
  nameEn: `Section ${index + 1}`,
  order: index + 1,
}));

const classrooms: Classroom[] = sections.map((section, index) => ({
  id: `classroom-${index + 1}`,
  sectionId: section.id,
  name: `Classroom ${index + 1}`,
  nameAr: `Classroom ${index + 1} AR`,
  nameEn: `Classroom ${index + 1}`,
  order: index + 1,
}));

const subjectAllocations: SubjectAllocation[] = [
  {
    id: "subject-allocation-zero-hours",
    termId: "term-1",
    gradeId: "grade-with-zero-hours",
    subjectId: "subject-1",
    weeklyHours: 0,
  },
  {
    id: "subject-allocation-positive-hours",
    termId: "term-1",
    gradeId: "grade-with-subject",
    subjectId: "subject-1",
    weeklyHours: 5,
  },
];

function renderMatrix(teacherAllocations: TeacherAllocation[] = []) {
    return render(
      <ToastProvider>
        <AllocationMatrixView
          termId="term-1"
          stages={[{ id: "stage-1", name: "Primary", nameEn: "Primary", nameAr: "ابتدائي", order: 1 }]}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          subjects={[
            {
              id: "subject-1",
              name: "Math",
              nameAr: "Math AR",
              nameEn: "Math",
              code: "MATH",
              color: "#2563eb",
              isActive: true,
            },
          ]}
          subjectAllocations={subjectAllocations}
          teachers={[
            {
              id: "teacher-1",
              nameAr: "Teacher One AR",
              nameEn: "Teacher One",
              isActive: true,
            },
          ]}
          teacherAllocations={teacherAllocations}
          isReadOnly={false}
          onRefresh={vi.fn().mockResolvedValue(undefined)}
          onValidate={vi.fn()}
        />
      </ToastProvider>,
    );
}

describe("AllocationMatrixView subject eligibility", () => {
  it("flags retained ineligible assignees and excludes them from completion", () => {
    renderMatrix([{ id: "saved-allocation", termId: "term-1", sectionId: "section-3", classroomId: "classroom-3", subjectId: "subject-1", teacherId: "saved-teacher", teacherName: "Saved Teacher", teacherEligibility: { eligible: false, reasonCode: "account_status_ineligible" } }]);
    expect(screen.getByText("matrix.needsReassignment")).toBeInTheDocument();
    expect(screen.getByText("summaryCards.validationStatus.needsReview")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "selectTeacher" })[2]).toHaveTextContent("Saved Teacher");
  });

  it("disables teacher selection only for grades where the subject is not registered", () => {
    const { container } = renderMatrix();

    const teacherSelects = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[id^="allocation-cell-"] button[aria-haspopup="listbox"]',
      ),
    );
    expect(teacherSelects).toHaveLength(3);
    expect(teacherSelects[0]).toBeDisabled();
    expect(teacherSelects[1]).toBeDisabled();
    expect(teacherSelects[2]).not.toBeDisabled();
  });

  it("shows the saved allocation's teacher even when the active directory omits them", () => {
    renderMatrix([{ id: "saved-allocation", termId: "term-1", sectionId: "section-3", classroomId: "classroom-3", subjectId: "subject-1", teacherId: "saved-teacher", teacherName: "Saved Teacher" }]);
    expect(screen.getAllByRole("button", { name: "selectTeacher" })[2]).toHaveTextContent("Saved Teacher");
  });
});
