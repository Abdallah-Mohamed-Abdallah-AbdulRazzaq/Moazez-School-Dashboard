import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { fetchTeacherAllocations, fetchTeachers } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import HomeworkAssignmentBuilderPage from "../HomeworkAssignmentBuilderPage";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import {
  fetchHomeworkAssignment,
  listHomeworkAttachments,
  listHomeworkQuestions,
  listHomeworkTargets,
  reorderHomeworkQuestion,
  updateHomeworkAssignment,
  updateHomeworkQuestion,
} from "../../services/homeworkService";

const showError = vi.fn();
const showSuccess = vi.fn();
const translate = (key: string) => key;
vi.mock("@/features/students-guardians/enrollments/services/enrollmentsApiService", () => ({ fetchEnrollments: vi.fn() }));
vi.mock("@/features/students-guardians/students/services/studentsService", () => ({ fetchAllStudents: vi.fn() }));
let recoveryMode = false;
vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({ fetchStructureTree: vi.fn() }));
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({ fetchSubjects: vi.fn() }));
vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({ fetchTeacherAllocations: vi.fn(), fetchTeachers: vi.fn() }));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@mui/material", () => ({
  useTheme: () => ({ breakpoints: { down: () => "xl" } }),
  useMediaQuery: () => false,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ termStatus: "open" }),
}));

vi.mock("@/features/academics/curriculum/components/DesktopLayout", () => ({
  default: ({
    questions,
    selectedQuestion,
    onSelectQuestion,
    onMoveQuestion,
    onUpdateAssignment,
    onUpdateQuestion,
    sidebarDetails,
    isReadOnly,
  }: {
    questions: Array<{ id: string; questionTextEn: string }>;
    selectedQuestion?: Record<string, unknown> & { id: string };
    onSelectQuestion: (id: string) => void;
    onMoveQuestion: (id: string, direction: "up" | "down") => void;
    onUpdateAssignment: (updates: Record<string, unknown>) => void;
    onUpdateQuestion: (
      questionId: string,
      updates: Record<string, unknown>,
    ) => void;
    sidebarDetails?: ReactNode;
    isReadOnly: boolean;
  }) => (
    <div>
      {sidebarDetails}
      <span>{`selected:${selectedQuestion?.id ?? "none"}`}</span>
      {questions.map((question) => (
        <span key={question.id}>{question.questionTextEn}</span>
      ))}
      <fieldset disabled={isReadOnly}>
        <button
          type="button"
          onClick={() => onUpdateAssignment({ titleAr: "", titleEn: "" })}
        >
          clear-title
        </button>
        <button
          type="button"
          onClick={() =>
            onUpdateAssignment({
              titleAr: "  Original  ",
              titleEn: "  Original  ",
              descriptionAr: "  Changed  ",
              descriptionEn: "  Changed  ",
              maxScore: null,
            })
          }
        >
          valid-nullable-edit
        </button>
        <button
          type="button"
          onClick={() => onUpdateAssignment({ dueDate: "2099-11-01T12:00:00.000Z" })}
        >
          edit-submission-date
        </button>
        <button
          type="button"
          onClick={() =>
            selectedQuestion &&
            onUpdateQuestion(selectedQuestion.id, {
              questionTextAr: `changed-${selectedQuestion.id}`,
              questionTextEn: `changed-${selectedQuestion.id}`,
            })
          }
        >
          edit-selected-question
        </button>
        <button type="button" onClick={() => onSelectQuestion("question-2")}>
          select-question-2
        </button>
        <button
          type="button"
          onClick={() => onMoveQuestion("question-1", "down")}
        >
          move-question
        </button>
      </fieldset>
    </div>
  ),
}));

vi.mock("@/features/academics/curriculum/components/MobileLayout", () => ({
  default: () => null,
}));

vi.mock("@/features/academics/homework/components/HomeworkGradeSyncPanel", () => ({
  default: () => null,
}));

vi.mock("@/features/academics/homework/components/HomeworkSubmissionReviewPanel", () => ({
  default: () => null,
}));

vi.mock("../../services/homeworkService", () => ({
  fetchHomeworkAssignment: vi.fn(),
  listHomeworkQuestions: vi.fn(),
  listHomeworkAttachments: vi.fn(),
  listHomeworkTargets: vi.fn(),
  updateHomeworkAssignment: vi.fn(),
  createHomeworkQuestion: vi.fn(),
  updateHomeworkQuestion: vi.fn(),
  deleteHomeworkQuestion: vi.fn(),
  reorderHomeworkQuestion: vi.fn(),
  createHomeworkAttachment: vi.fn(),
  deleteHomeworkAttachment: vi.fn(),
  publishHomeworkAssignment: vi.fn(),
  closeHomeworkAssignment: vi.fn(),
  cancelHomeworkAssignment: vi.fn(),
}));

vi.mock("../../services/homeworkFilesService", () => ({
  uploadHomeworkFile: vi.fn(),
}));

function homework() {
  return {
    id: "homework-1",
    title: "Original",
    description: "Initial",
    mode: "homework",
    status: "draft" as const,
    targetMode: "classroom",
    academicYearId: "year-1",
    termId: "term-1",
    teacherSubjectAllocationId: "allocation-1",
    teacherName: "Teacher One",
    subjectName: "Science",
    classroomName: "Class One",
    timetableEntryId: "session-1",
    scheduleDate: "2026-10-18",
    classroomId: "classroom-1",
    dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    publishAt: null,
    totalMarks: null,
    isGraded: false,
    questionCount: 0,
    attachmentCount: 0,
  };
}

const question = (id: string, text: string) => ({
  id,
  assignmentId: "homework-1",
  questionTextAr: text,
  questionTextEn: text,
  questionType: "SHORT_ANSWER" as const,
  points: 1,
  isRequired: true,
  order: id === "question-1" ? 0 : 1,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("HomeworkAssignmentBuilderPage assignment contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    recoveryMode = false;
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [{ id: "stage-1", name: "Stage One", nameEn: "Stage One", nameAr: "المرحلة الأولى" }],
      grades: [{ id: "grade-1", stageId: "stage-1", name: "Grade One", nameEn: "Grade One", nameAr: "الصف الأول" }],
      sections: [{ id: "section-1", gradeId: "grade-1", name: "Section One", nameEn: "Section One", nameAr: "القسم الأول" }],
      classrooms: [
        { id: "classroom-1", name: "Class One", nameEn: "Class One", nameAr: "الفصل الأول", sectionId: "section-1" },
        { id: "classroom-2", name: "Class Two", nameEn: "Class Two", nameAr: "الفصل الثاني", sectionId: "section-1" },
      ],
    } as Awaited<ReturnType<typeof fetchStructureTree>>);
    vi.mocked(fetchSubjects).mockResolvedValue([{ id: "subject-1", nameEn: "Science", nameAr: "العلوم" }] as Awaited<ReturnType<typeof fetchSubjects>>);
    vi.mocked(fetchTeachers).mockResolvedValue([
      { id: "teacher-1", nameEn: "Teacher One", nameAr: "المعلم الأول", isActive: true },
      { id: "teacher-2", nameEn: "Teacher Two", nameAr: "المعلم الثاني", isActive: true },
    ]);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      { id: "allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", subjectId: "subject-1", teacherId: "teacher-1" },
      { id: "allocation-2", termId: "term-1", sectionId: "section-1", classroomId: "classroom-2", subjectId: "subject-1", teacherId: "teacher-2" },
      { id: "allocation-3", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", subjectId: "subject-1", teacherId: "teacher-2" },
    ]);
    vi.mocked(fetchEnrollments).mockResolvedValue([
      { id: "enrollment-1", studentId: "student-1", academicYearId: "year-1", classroomId: "classroom-1", status: "active" },
      { id: "enrollment-2", studentId: "student-2", academicYearId: "year-1", classroomId: "classroom-1", status: "active" },
    ]);
    vi.mocked(fetchAllStudents).mockResolvedValue([
      { id: "student-1", name: "Student One", full_name_en: "Student One", student_id: "001" },
      { id: "student-2", name: "Student Two", full_name_en: "Student Two", student_id: "002" },
    ] as Awaited<ReturnType<typeof fetchAllStudents>>);
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue(homework());
    vi.mocked(listHomeworkQuestions).mockResolvedValue([]);
    vi.mocked(listHomeworkAttachments).mockResolvedValue([]);
    vi.mocked(listHomeworkTargets).mockResolvedValue([
      {
        targetId: "target-1",
        studentId: "student-1",
        studentName: "Student One",
        status: "assigned",
      },
    ]);
    vi.mocked(updateHomeworkAssignment).mockResolvedValue(homework());
  });

  it("shows a retry screen after a load failure and opens the editor after retry succeeds", async () => {
    vi.mocked(fetchHomeworkAssignment).mockRejectedValueOnce(new Error("unavailable"));
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("errors.loadFailed");
    expect(screen.queryByRole("button", { name: "edit-submission-date" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));

    expect(await screen.findByRole("button", { name: "edit-submission-date" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("locks assignment and question edits until the pending save finishes", async () => {
    let finishSave!: (savedHomework: ReturnType<typeof homework>) => void;
    vi.mocked(updateHomeworkAssignment).mockImplementation(() => new Promise(resolve => {
      finishSave = resolve;
    }));
    vi.mocked(listHomeworkQuestions).mockResolvedValue([question("question-1", "Original question")]);
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "edit-submission-date" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));

    expect(screen.getByRole("button", { name: "edit-submission-date" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "edit-selected-question" })).toBeDisabled();
    await act(async () => finishSave({ ...homework(), dueAt: "2099-11-01T12:00:00.000Z" }));

    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(screen.getByRole("button", { name: "edit-submission-date" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "edit-selected-question" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it("shows the allocation teacher name when the teacher is missing from the directory", async () => {
    vi.mocked(fetchTeachers).mockResolvedValue([]);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      { id: "allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", subjectId: "subject-1", teacherId: "teacher-1", teacherName: "Allocation Teacher" },
    ]);
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    const select = await screen.findByLabelText(/fields.teacherSubjectAllocation/);
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveTextContent("Allocation Teacher - Science - Class One");
    fireEvent.click(select);
    expect(screen.getByRole("button", { name: "Allocation Teacher - Science - Class One", exact: true })).toBeInTheDocument();
  });

  it("browses the academic structure, blocks incomplete choices and saves the resolved allocation", async () => {
    vi.mocked(updateHomeworkAssignment).mockResolvedValue({ ...homework(), teacherSubjectAllocationId: "allocation-2", teacherName: "Teacher Two", classroomId: "classroom-2", classroomName: "Class Two" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    const browse = await screen.findByRole("button", { name: "picker.browseStructure" });
    await waitFor(() => expect(browse).toBeEnabled());
    fireEvent.click(browse);
    fireEvent.click(screen.getByLabelText(/picker.fields.stage/));
    fireEvent.click(screen.getByRole("button", { name: "Stage One", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    expect(showError).toHaveBeenCalledWith("errors.allocationRequired");
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();
    for (const [level, label] of [["grade", "Grade One"], ["section", "Section One"], ["classroom", "Class Two"], ["subject", "Science"]]) {
      fireEvent.click(screen.getByLabelText(new RegExp(`picker.fields.${level}`)));
      fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
    }
    expect(screen.getByText("Class Two", { selector: "dd" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "picker.quickSearch" }));
    expect(screen.getByLabelText(/fields.teacherSubjectAllocation/)).toHaveTextContent("Teacher Two - Science - Class Two");
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", expect.objectContaining({ teacherSubjectAllocationId: "allocation-2" }));
  });

  it("restores the saved allocation after resetting an incomplete structure selection", async () => {
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    const browse = await screen.findByRole("button", { name: "picker.browseStructure" });
    await waitFor(() => expect(browse).toBeEnabled());
    fireEvent.click(browse);
    fireEvent.click(screen.getByLabelText(/picker.fields.stage/));
    fireEvent.click(screen.getByRole("button", { name: "Stage One", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "actions.reset" }));
    fireEvent.click(await screen.findByRole("button", { name: "confirm.confirm" }));
    expect(await screen.findByLabelText(/fields.teacherSubjectAllocation/)).toHaveTextContent("Teacher One - Science - Class One");
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();
  });

  it("saves a new allocation and clears the incompatible session", async () => {
    vi.mocked(updateHomeworkAssignment).mockResolvedValue({ ...homework(), teacherSubjectAllocationId: "allocation-2", teacherName: "Teacher Two", classroomId: "classroom-2", classroomName: "Class Two", timetableEntryId: null, scheduleDate: null });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    const select = await screen.findByLabelText(/fields.teacherSubjectAllocation/);
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("button", { name: "Teacher Two - Science - Class Two" }));
    expect(screen.getByText("Teacher Two")).toBeInTheDocument();
    expect(screen.getByText("Class Two", { selector: "dd" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", expect.objectContaining({ teacherSubjectAllocationId: "allocation-2", timetableEntryId: null, scheduleDate: null }));
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it("requires new recipients after changing classroom and preserves recipients for the same classroom", async () => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByRole("checkbox", { name: "Student One" });
    const select = screen.getByLabelText(/fields.teacherSubjectAllocation/);
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("button", { name: "Teacher Two - Science - Class One" }));
    expect(await screen.findByRole("checkbox", { name: "Student One" })).toBeChecked();
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("button", { name: "Teacher Two - Science - Class Two" }));
    await screen.findByText("targets.noStudents");
    expect(screen.queryByRole("checkbox", { name: "Student One" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith("errors.selectedStudentsRequired");
  });

  it("resets an allocation change and restores the saved recipients", async () => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByRole("checkbox", { name: "Student One" });
    const select = screen.getByLabelText(/fields.teacherSubjectAllocation/);
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("button", { name: "Teacher Two - Science - Class Two" }));
    await screen.findByText("targets.noStudents");
    fireEvent.click(screen.getByRole("button", { name: "actions.reset" }));
    fireEvent.click(await screen.findByRole("button", { name: "confirm.confirm" }));
    expect(await screen.findByRole("checkbox", { name: "Student One" })).toBeChecked();
    expect(screen.getByLabelText(/fields.teacherSubjectAllocation/)).toHaveTextContent("Teacher One - Science - Class One");
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();
  });

  it("keeps the saved allocation visible when there are no available allocations", async () => {
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([]);
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("messages.noAllocations");
    const select = screen.getByLabelText(/fields.teacherSubjectAllocation/);
    expect(select).toBeDisabled();
    expect(screen.getByLabelText(/fields.teacherSubjectAllocation/)).toHaveTextContent("Teacher One - Science - Class One");
  });

  it("reports allocation loading failures and supports retry", async () => {
    vi.mocked(fetchTeacherAllocations).mockRejectedValueOnce(new Error("unavailable"));
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("errors.allocationsLoadFailed");
    expect(screen.getByLabelText(/fields.teacherSubjectAllocation/)).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "actions.retry" }));
    await waitFor(() => expect(screen.getByLabelText(/fields.teacherSubjectAllocation/)).toBeEnabled());
    fireEvent.click(screen.getByLabelText(/fields.teacherSubjectAllocation/));
    expect(screen.getByRole("button", { name: "Teacher Two - Science - Class Two" })).toBeInTheDocument();
  });

  it.each(["published", "closed", "cancelled", "archived"] as const)("does not allow allocation editing for %s assignments", async status => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), status });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByRole("heading", { name: "title" });
    expect(screen.queryByLabelText(/fields.teacherSubjectAllocation/)).not.toBeInTheDocument();
  });

  it("adds a student to the same draft while preserving existing selections", async () => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    vi.mocked(updateHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    const existing = await screen.findByRole("checkbox", { name: "Student One" });
    const added = await screen.findByRole("checkbox", { name: "Student Two" });
    expect(existing).toBeChecked();
    expect(added).not.toBeChecked();
    fireEvent.click(added);
    vi.mocked(listHomeworkTargets).mockResolvedValue([
      { targetId: "target-1", studentId: "student-1", studentName: "Student One", status: "assigned" },
      { targetId: "target-2", studentId: "student-2", studentName: "Student Two", status: "assigned" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", expect.objectContaining({ targetMode: "selected_students", studentIds: ["student-1", "student-2"] }));
    expect(screen.getByRole("checkbox", { name: "Student One" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Student Two" })).toBeChecked();
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it.each(["selected_students", "classroom"])("saves a draft submission-date edit for %s without losing its recipients", async (targetMode) => {
    const draft = { ...homework(), targetMode };
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue(draft);
    vi.mocked(updateHomeworkAssignment).mockImplementation(async (_homeworkId, payload) => {
      if (targetMode === "selected_students" && !payload.studentIds?.length) {
        throw { code: "homework.assignment.target_required" };
      }
      return { ...draft, dueAt: payload.dueAt };
    });

    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "edit-submission-date" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));

    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(showError).not.toHaveBeenCalled();
    const savedPayload = vi.mocked(updateHomeworkAssignment).mock.calls[0][1];
    expect(savedPayload.dueAt).toBe("2099-11-01T12:00:00.000Z");
    if (targetMode === "selected_students") {
      expect(savedPayload.studentIds).toEqual(["student-1"]);
      expect(await screen.findByRole("checkbox", { name: "Student One" })).toBeChecked();
    } else {
      expect(savedPayload).not.toHaveProperty("studentIds");
    }
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it.each(["question", "assignment"] as const)("saves %s edits without replacing saved recipients when the target list is empty", async (edit) => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    vi.mocked(listHomeworkTargets).mockResolvedValue([]);
    vi.mocked(listHomeworkQuestions).mockResolvedValue([question("question-1", "Original question")]);
    vi.mocked(updateHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    vi.mocked(updateHomeworkQuestion).mockImplementation(async (_homeworkId, _questionId, updatedQuestion) => updatedQuestion);

    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("Original question");
    await screen.findByRole("checkbox", { name: "Student One" });
    fireEvent.click(screen.getByText(edit === "question" ? "edit-selected-question" : "valid-nullable-edit"));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));

    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(showError).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
    if (edit === "question") {
      expect(screen.getByText("changed-question-1")).toBeInTheDocument();
      expect(updateHomeworkAssignment).not.toHaveBeenCalled();
    } else {
      expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", expect.not.objectContaining({ studentIds: expect.anything() }));
    }
  });

  it("blocks saving an empty selected-student list", async () => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Student One" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    expect(showError).toHaveBeenCalledWith("errors.selectedStudentsRequired");
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();
  });

  it("switches a selected-student draft back to the whole classroom", async () => {
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue({ ...homework(), targetMode: "selected_students" });
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByRole("checkbox", { name: "Student One" });
    fireEvent.click(screen.getByRole("button", { name: /fields.targetMode/ }));
    fireEvent.click(await screen.findByRole("button", { name: "targetModes.classroom" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith("messages.homeworkSaved"));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", expect.objectContaining({ targetMode: "classroom" }));
    expect(vi.mocked(updateHomeworkAssignment).mock.calls[0][1]).not.toHaveProperty("studentIds");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "actions.save" })).toBeDisabled();
  });

  it("blocks invalid edits and preserves nullable marks in a normalized update", async () => {
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("clear-title");

    fireEvent.click(screen.getByText("clear-title"));
    const save = screen.getByRole("button", { name: "actions.save" });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("valid-nullable-edit"));
    fireEvent.click(save);

    await waitFor(() => expect(updateHomeworkAssignment).toHaveBeenCalledTimes(1));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", {
      title: "Original",
      description: "Changed",
      dueAt: expect.any(String),
      totalMarks: null,
      estimatedMinutes: undefined,
    });
  });

  it("shows publication readiness when hovering its indicator", async () => {
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);

    const indicator = await screen.findByRole("button", {
      name: "publishReadiness.title",
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(indicator);

    const checklist = await screen.findByRole("tooltip");
    expect(checklist).toHaveTextContent("publishReadiness.savedChanges");
    expect(checklist).toHaveTextContent("publishReadiness.validQuestions");
    expect(checklist).toHaveTextContent("publishReadiness.eligibleTargets");

    fireEvent.click(screen.getByText("clear-title"));

    expect(checklist).toHaveTextContent("publishReadiness.unsavedChanges");
    expect(checklist).toHaveTextContent("publishReadiness.validQuestions");

    fireEvent.mouseLeave(indicator);
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("keeps builder actions and statuses in the homework details sidebar", async () => {
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);

    const header = await screen.findByRole("banner");
    expect(
      within(header).getByRole("button", { name: "tabs.builder" }),
    ).toBeInTheDocument();
    expect(
      within(header).queryByRole("button", { name: "actions.publish" }),
    ).not.toBeInTheDocument();

    const sidebar = screen.getByRole("complementary", {
      name: "details.title",
    });
    expect(
      within(sidebar).getByRole("button", { name: "actions.save" }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("button", { name: "actions.publish" }),
    ).toBeInTheDocument();
    expect(within(sidebar).getByText("statuses.draft")).toBeInTheDocument();
    expect(within(sidebar).getByText("states.saved")).toBeInTheDocument();
  });

  it("reloads authoritative builder state after a later question mutation fails", async () => {
    vi.mocked(listHomeworkQuestions).mockImplementation(async () =>
      recoveryMode
        ? [
            question("question-1", "Server one"),
            question("question-2", "Server two"),
          ]
        : [
        question("question-1", "Initial one"),
        question("question-2", "Initial two"),
          ],
    );
    vi.mocked(fetchHomeworkAssignment).mockImplementation(async () =>
      recoveryMode ? { ...homework(), title: "Server homework" } : homework(),
    );
    vi.mocked(listHomeworkAttachments).mockResolvedValue([]);
    vi.mocked(updateHomeworkQuestion).mockImplementation(
      async (_homeworkId, _questionId, updatedQuestion) => updatedQuestion,
    );
    vi.mocked(reorderHomeworkQuestion).mockImplementationOnce(async () => {
      recoveryMode = true;
      throw new Error("reorder failed");
    });

    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("Initial one");
    fireEvent.click(screen.getByText("move-question"));
    const save = screen.getByRole("button", { name: "actions.save" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await screen.findByText("Server one");
    expect(screen.getByText("Server two")).toBeInTheDocument();
    expect(vi.mocked(fetchHomeworkAssignment).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(vi.mocked(listHomeworkQuestions).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(vi.mocked(listHomeworkAttachments).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(showError).toHaveBeenCalledWith("errors.questionSavePartiallyApplied");
  });

  it("reports both the mutation and reload failure without claiming rollback", async () => {
    vi.mocked(listHomeworkQuestions).mockResolvedValue([
      question("question-1", "Initial one"),
      question("question-2", "Initial two"),
    ]);
    vi.mocked(fetchHomeworkAssignment).mockImplementation(async () => {
      if (recoveryMode) throw new Error("reload failed");
      return homework();
    });
    vi.mocked(updateHomeworkQuestion).mockImplementation(
      async (_homeworkId, _questionId, updatedQuestion) => updatedQuestion,
    );
    vi.mocked(reorderHomeworkQuestion).mockImplementationOnce(async () => {
      recoveryMode = true;
      throw new Error("reorder failed");
    });

    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("Initial one");
    fireEvent.click(screen.getByText("move-question"));
    const save = screen.getByRole("button", { name: "actions.save" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith("errors.questionSaveRecoveryFailed"),
    );
    expect(vi.mocked(fetchHomeworkAssignment).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
