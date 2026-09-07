import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GradeSubmissionPage from "../GradeSubmissionPage";
import { ApiError } from "@/lib/api-error";

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn() }));
const toast = vi.hoisted(() => ({ showError: vi.fn(), showSuccess: vi.fn() }));
const translate = vi.hoisted(() => (key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${Object.values(values).join(" ")}` : key,
);

vi.mock("@/lib/api", () => api);
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => toast }));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(
    "assessmentId=123e4567-e89b-42d3-a456-426614174001",
  ),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permission === "grades.submissions.review",
  }),
}));

const assessmentId = "123e4567-e89b-42d3-a456-426614174001";
const submissionId = "123e4567-e89b-42d3-a456-426614174002";
const answerId = "123e4567-e89b-42d3-a456-426614174003";

function submissionDetail(status: "submitted" | "corrected" = "submitted") {
  return {
    id: submissionId,
    termId: assessmentId,
    assessmentId,
    studentId: assessmentId,
    enrollmentId: assessmentId,
    status,
    startedAt: "2026-01-01T00:00:00Z",
    submittedAt: "2026-01-01T01:00:00Z",
    correctedAt: status === "corrected" ? "2026-01-01T02:00:00Z" : null,
    totalScore: 2,
    maxScore: 3,
    assessment: null,
    student: null,
    enrollment: null,
    progress: {
      answeredCount: 1,
      totalQuestions: 1,
      requiredAnsweredCount: 1,
      requiredQuestionCount: 1,
      pendingCorrectionCount: 0,
    },
    questions: [{
      id: assessmentId,
      type: "essay",
      prompt: "Prompt",
      promptAr: "سؤال",
      points: 3,
      sortOrder: 1,
      required: true,
      answer: {
        id: answerId,
        questionId: assessmentId,
        type: "essay",
        answerText: "Answer",
        answerJson: null,
        awardedPoints: 2,
        maxPoints: 3,
        correctionStatus: "pending",
        reviewerComment: "Clear",
        reviewerCommentAr: "واضح",
        selectedOptions: [],
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    }],
    answers: [],
  };
}

async function editEnglishReview(user: ReturnType<typeof userEvent.setup>, value: string) {
  const comment = await screen.findByRole("textbox", { name: "reviewCommentEn" });
  await user.clear(comment);
  await user.type(comment, value);
  await waitFor(() => expect(screen.getByRole("button", { name: "saveReview" })).toBeEnabled());
}

beforeEach(() => {
  vi.clearAllMocks();
  api.apiGet.mockResolvedValue(submissionDetail());
  api.apiPost.mockResolvedValue({});
  api.apiPatch.mockResolvedValue({});
  api.apiPut.mockResolvedValue({});
});

describe("GradeSubmissionPage review actions", () => {
  it("displays the question type in the question header", async () => {
    render(<GradeSubmissionPage submissionId={submissionId} />);

    expect(await screen.findByText("questionTypes.essay")).toBeInTheDocument();
  });

  it("saves bilingual review fields once and locks other mutations while pending", async () => {
    const user = userEvent.setup();
    let resolvePatch!: () => void;
    api.apiPatch.mockImplementation(() => new Promise<void>((resolve) => {
      resolvePatch = resolve;
    }));

    render(<GradeSubmissionPage submissionId={submissionId} />);
    await editEnglishReview(user, "Updated");
    const arabic = screen.getByRole("textbox", { name: "reviewCommentAr" });
    await user.clear(arabic);
    await user.type(arabic, "مراجعة");

    const saveReview = screen.getByRole("button", { name: "saveReview" });
    await user.click(saveReview);
    await user.click(saveReview);

    expect(api.apiPatch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "saveAllReviews" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "finalize" })).toBeDisabled();
    expect(saveReview).toBeDisabled();

    resolvePatch();
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledTimes(2));
    expect(api.apiPatch).toHaveBeenCalledTimes(1);
  });

  it("reloads stale single-review failures without discarding editable drafts", async () => {
    const user = userEvent.setup();
    api.apiPatch.mockRejectedValueOnce(new ApiError(
      "Submission locked",
      409,
      "grades.submission.locked",
      undefined,
      undefined,
      "trace-1",
    ));

    render(<GradeSubmissionPage submissionId={submissionId} />);
    await editEnglishReview(user, "Keep this draft");
    await user.click(screen.getByRole("button", { name: "saveReview" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("submission_locked");
    expect(screen.getByRole("alert")).toHaveTextContent("trace-1");
    expect(screen.getByRole("textbox", { name: "reviewCommentEn" })).toHaveValue("Keep this draft");
    expect(api.apiGet).toHaveBeenCalledTimes(2);
  });

  it("shows partial recovery after a failed bulk review and successful reload", async () => {
    const user = userEvent.setup();
    api.apiPut.mockRejectedValueOnce(new ApiError(
      "Save failed",
      500,
      "grades.review.failed",
      undefined,
      undefined,
      "save-trace",
    ));

    render(<GradeSubmissionPage submissionId={submissionId} />);
    await editEnglishReview(user, "Bulk draft");
    await user.click(screen.getByRole("button", { name: "saveAllReviews" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("bulkReviewPartialRecovery");
    expect(screen.getByRole("alert")).toHaveTextContent("save-trace");
    expect(screen.getByRole("textbox", { name: "reviewCommentEn" })).toHaveValue("Bulk draft");
    expect(api.apiPut).toHaveBeenCalledTimes(1);
    expect(api.apiGet).toHaveBeenCalledTimes(2);
  });

  it("retains drafts and reports both errors when bulk recovery reload fails", async () => {
    const user = userEvent.setup();
    api.apiGet
      .mockResolvedValueOnce(submissionDetail())
      .mockRejectedValueOnce(new ApiError(
        "Reload locked",
        409,
        "grades.submission.locked",
        undefined,
        undefined,
        "reload-trace",
      ));
    api.apiPut.mockRejectedValueOnce(new ApiError(
      "Save failed",
      500,
      "grades.review.failed",
      undefined,
      undefined,
      "save-trace",
    ));

    render(<GradeSubmissionPage submissionId={submissionId} />);
    await editEnglishReview(user, "Bulk draft");
    await user.click(screen.getByRole("button", { name: "saveAllReviews" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("bulkReviewRecoveryFailed");
    expect(screen.getByRole("alert")).toHaveTextContent("generic");
    expect(screen.getByRole("alert")).toHaveTextContent("submission_locked");
    expect(screen.getByRole("alert")).toHaveTextContent("reload-trace");
    expect(screen.getByRole("textbox", { name: "reviewCommentEn" })).toHaveValue("Bulk draft");
  });

  it("renders corrected submissions read-only, blocks finalize, and enables sync", async () => {
    api.apiGet.mockResolvedValue(submissionDetail("corrected"));
    render(<GradeSubmissionPage submissionId={submissionId} />);

    expect(await screen.findByRole("textbox", { name: "reviewCommentEn" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "finalize" })).toBeDisabled();
    expect(screen.getByText("finalizeBlockedStatus")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "sync" })).toBeEnabled();
  });

  it("notifies when syncing a corrected submission succeeds", async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue(submissionDetail("corrected"));
    render(<GradeSubmissionPage submissionId={submissionId} />);

    await user.click(await screen.findByRole("button", { name: "sync" }));

    await waitFor(() => expect(toast.showSuccess).toHaveBeenCalledWith("messages.synced"));
  });

  it("notifies when syncing a corrected submission fails", async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue(submissionDetail("corrected"));
    api.apiPost.mockRejectedValueOnce(new ApiError(
      "Sync locked",
      409,
      "grades.submission.locked",
    ));
    render(<GradeSubmissionPage submissionId={submissionId} />);

    await user.click(await screen.findByRole("button", { name: "sync" }));

    await waitFor(() => expect(toast.showError).toHaveBeenCalledWith("submission_locked"));
  });

  it("requires discard confirmation before navigating away from dirty reviews", async () => {
    const user = userEvent.setup();
    render(<GradeSubmissionPage submissionId={submissionId} />);
    await editEnglishReview(user, "Unsaved draft");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByText("discardReviewTitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "discardReviewConfirm" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(router.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "back" }));
    await user.click(screen.getByRole("button", { name: "discardReviewConfirm" }));
    expect(router.push).toHaveBeenCalledWith(
      `/en/grades/assessments/${assessmentId}/submissions`,
    );
  });
});
