import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeworkSubmissionReviewPanel from "../HomeworkSubmissionReviewPanel";
import {
  fetchHomeworkSubmission,
  getHomeworkGradeSyncStatus,
  listHomeworkQuestions,
  listHomeworkSubmissionAnswers,
  listHomeworkSubmissionAttachments,
  listHomeworkSubmissions,
  reviewHomeworkSubmission,
  reviewHomeworkSubmissionAnswer,
} from "../../services/homeworkService";

const showError = vi.fn();
const showSuccess = vi.fn();
const translate = (key: string) => key;

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess }),
}));

vi.mock("@/components/ui/input/Select", () => ({
  default: ({ label, value, options, onChange }: {
    label: string;
    value?: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: () => null,
}));

vi.mock("@/components/ui/file-preview-modal", () => ({
  default: ({ attachment, isOpen }: {
    attachment: { id: string; name: string } | null;
    isOpen: boolean;
  }) => isOpen ? <div data-testid="file-preview">{`${attachment?.id}:${attachment?.name}`}</div> : null,
  FilePreviewThumbnail: ({ alt, fileId }: { alt: string; fileId: string }) => (
    <div data-testid="file-preview-thumbnail">{`${fileId}:${alt}`}</div>
  ),
}));

vi.mock("../../services/homeworkService", () => ({
  listHomeworkSubmissions: vi.fn(),
  fetchHomeworkSubmission: vi.fn(),
  listHomeworkQuestions: vi.fn(),
  listHomeworkSubmissionAnswers: vi.fn(),
  listHomeworkSubmissionAttachments: vi.fn(),
  reviewHomeworkSubmission: vi.fn(),
  reviewHomeworkSubmissionAnswer: vi.fn(),
  bulkReviewHomeworkSubmissionAnswers: vi.fn(),
  syncHomeworkSubmissionGrade: vi.fn(),
  getHomeworkGradeSyncStatus: vi.fn(),
}));

const submission = (status: string) => ({
  id: "submission-1",
  homeworkId: "homework-1",
  studentName: "Student One",
  status,
  totalMarks: 10,
  awardedMarks: status === "reviewed" ? 1 : undefined,
  reviewNote: null,
});

const reviewedAnswer = {
  id: "answer-1",
  questionId: "question-1",
  prompt: "Prompt",
  answerText: "Response",
  score: 1,
  maxScore: 2,
  feedback: null,
  reviewedAt: "2026-01-02T00:00:00.000Z",
};

const requiredQuestion = {
  id: "question-1",
  assignmentId: "homework-1",
  questionTextAr: "Prompt",
  questionTextEn: "Prompt",
  questionType: "SHORT_ANSWER" as const,
  points: 2,
  isRequired: true,
  order: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function arrange(status = "submitted", hasQuestions = true) {
  const item = submission(status);
  vi.mocked(listHomeworkSubmissions).mockResolvedValue({
    items: [item],
    pagination: { page: 1, limit: 25, total: 1 },
  });
  vi.mocked(fetchHomeworkSubmission).mockResolvedValue(item);
  vi.mocked(listHomeworkQuestions).mockResolvedValue(
    hasQuestions ? [requiredQuestion] : [],
  );
  vi.mocked(listHomeworkSubmissionAnswers).mockResolvedValue(
    hasQuestions ? [reviewedAnswer] : [],
  );
  vi.mocked(listHomeworkSubmissionAttachments).mockResolvedValue([]);
  vi.mocked(getHomeworkGradeSyncStatus).mockResolvedValue({
    homeworkId: "homework-1",
    linked: true,
  });
  vi.mocked(reviewHomeworkSubmission).mockResolvedValue(submission("reviewed"));
}

describe("HomeworkSubmissionReviewPanel backend workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads all submissions before a reviewer applies a status filter", async () => {
    arrange();
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    await waitFor(() =>
      expect(listHomeworkSubmissions).toHaveBeenCalledWith("homework-1", {
        page: 1,
        limit: 25,
      }),
    );
  });

  it("uses the assignment-wide counters for submission KPIs", async () => {
    arrange();
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
        counters={{ totalTargets: 12, submitted: 3, late: 2, reviewed: 5 }}
      />,
    );

    await waitFor(() => expect(listHomeworkSubmissions).toHaveBeenCalled());
    expect(screen.getByText("summary.total").parentElement).toHaveTextContent("10");
    expect(screen.getByText("summary.reviewed").parentElement).toHaveTextContent("5");
  });

  it("locks every review control after the submission is reviewed", async () => {
    arrange("reviewed");
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    expect(await screen.findByLabelText("answers.score")).toBeDisabled();
    expect(screen.getByLabelText("answers.feedback")).toBeDisabled();
    expect(screen.getByLabelText("submissionReview.awardedMarks")).toBeDisabled();
    expect(screen.getByLabelText("submissionReview.reviewNote")).toBeDisabled();
    expect(screen.getByRole("button", { name: "actions.saveAll" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "actions.saveSubmission" })).toBeDisabled();
  });

  it("uses the answer rollup and finalizes question-based work with an empty request", async () => {
    arrange();
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    const awardedMarks = await screen.findByLabelText("submissionReview.awardedMarks");
    expect(awardedMarks).toBeDisabled();
    await waitFor(() => expect(awardedMarks).toHaveValue(1));
    const finalize = screen.getByRole("button", { name: "actions.saveSubmission" });
    expect(finalize).toBeEnabled();
    fireEvent.click(finalize);
    await waitFor(() =>
      expect(reviewHomeworkSubmission).toHaveBeenCalledWith(
        "homework-1",
        "submission-1",
        {},
      ),
    );
  });

  it("shows required-answer progress and opens the mobile queue as a dialog", async () => {
    arrange();
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    expect(await screen.findByText("guidance.requiredProgress")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.students" }));
    expect(screen.getByRole("dialog", { name: "actions.students" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "actions.closeStudents" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "actions.students" })).not.toBeInTheDocument();
  });

  it("opens a submission attachment in the shared file preview", async () => {
    arrange();
    vi.mocked(listHomeworkSubmissionAttachments).mockResolvedValue([
      {
        id: "attachment-1",
        fileId: "submission/file-1",
        title: "Student work",
        filename: "work.pdf",
        mimeType: "application/pdf",
        sizeBytes: "1024",
      },
    ]);
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    expect(await screen.findByTestId("file-preview-thumbnail")).toHaveTextContent(
      "submission/file-1:Student work",
    );
    fireEvent.click(screen.getByText("Student work"));
    expect(screen.getByTestId("file-preview")).toHaveTextContent(
      "submission/file-1:Student work",
    );
  });

  it("explains the score and grade assessment prerequisites for syncing", async () => {
    arrange();
    vi.mocked(getHomeworkGradeSyncStatus).mockResolvedValue({
      homeworkId: "homework-1",
      linked: false,
    });
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    expect(await screen.findByText("guidance.validAwardedScore")).toBeInTheDocument();
    expect(screen.getByText("guidance.gradeAssessmentLinkRequired")).toBeInTheDocument();
  });

  it("shows answer validation and does not send a score above question points", async () => {
    arrange();
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="published"
        isGraded
      />,
    );

    const score = await screen.findByLabelText("answers.score");
    fireEvent.change(score, { target: { value: "2.01" } });
    await screen.findByText("validation.scoreMax");
    expect(screen.getByRole("button", { name: "actions.saveAnswer" })).toBeDisabled();
    expect(reviewHomeworkSubmissionAnswer).not.toHaveBeenCalled();
  });

  it("sends a valid manual mark for body-only graded work and locks the returned review", async () => {
    arrange("submitted", false);
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={10}
        assignmentStatus="closed"
        isGraded
      />,
    );

    const awardedMarks = await screen.findByLabelText("submissionReview.awardedMarks");
    await waitFor(() => expect(awardedMarks).toBeEnabled());
    fireEvent.change(awardedMarks, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "actions.saveSubmission" }));
    await waitFor(() =>
      expect(reviewHomeworkSubmission).toHaveBeenCalledWith(
        "homework-1",
        "submission-1",
        { awardedMarks: 5 },
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("submissionReview.reviewNote")).toBeDisabled(),
    );
  });

  it("omits assignment marks for body-only ungraded work", async () => {
    arrange("submitted", false);
    render(
      <HomeworkSubmissionReviewPanel
        homeworkId="homework-1"
        totalMarks={null}
        assignmentStatus="published"
        isGraded={false}
      />,
    );

    expect(await screen.findByLabelText("submissionReview.awardedMarks")).toBeDisabled();
    const finalize = screen.getByRole("button", { name: "actions.saveSubmission" });
    await waitFor(() => expect(finalize).toBeEnabled());
    fireEvent.click(finalize);
    await waitFor(() =>
      expect(reviewHomeworkSubmission).toHaveBeenCalledWith(
        "homework-1",
        "submission-1",
        {},
      ),
    );
  });
});
