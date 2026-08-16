import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeworkAssignmentBuilderPage from "../HomeworkAssignmentBuilderPage";
import {
  fetchHomeworkAssignment,
  listHomeworkAttachments,
  listHomeworkQuestions,
  reorderHomeworkQuestion,
  updateHomeworkAssignment,
  updateHomeworkQuestion,
} from "../../services/homeworkService";

const showError = vi.fn();
const showSuccess = vi.fn();
const translate = (key: string) => key;
let recoveryMode = false;

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
  }) => (
    <div>
      <span>{`selected:${selectedQuestion?.id ?? "none"}`}</span>
      {questions.map((question) => (
        <span key={question.id}>{question.questionTextEn}</span>
      ))}
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

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: () => null,
}));

vi.mock("../../services/homeworkService", () => ({
  fetchHomeworkAssignment: vi.fn(),
  listHomeworkQuestions: vi.fn(),
  listHomeworkAttachments: vi.fn(),
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
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue(homework());
    vi.mocked(listHomeworkQuestions).mockResolvedValue([]);
    vi.mocked(listHomeworkAttachments).mockResolvedValue([]);
    vi.mocked(updateHomeworkAssignment).mockResolvedValue(homework());
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
