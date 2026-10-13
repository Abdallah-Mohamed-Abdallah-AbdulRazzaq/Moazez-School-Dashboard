import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentSubmissionsPage from "../AssessmentSubmissionsPage";
import type { GradeSubmissionDetail } from "../../types";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPut: vi.fn(), apiPatch: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));
const translate = vi.hoisted(() => (key: string, values?: Record<string, unknown>) =>
  values ? `${key} ${Object.values(values).join(" ")}` : key);
const searchParams = vi.hoisted(() => new URLSearchParams("year=year-1&term=term-1"));
const permissions = vi.hoisted(() => new Set([
  "grades.submissions.review",
  "grades.questions.view",
]));
vi.mock("@/lib/api", () => api);
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => translate }));
vi.mock("next/navigation", () => ({ useRouter: () => router, useSearchParams: () => searchParams, usePathname: () => "/en/grades" }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: (permission: string) => permissions.has(permission) }),
}));

const uuid = "123e4567-e89b-42d3-a456-426614174001";
const submittedId = "123e4567-e89b-42d3-a456-426614174004";
const inProgressId = "123e4567-e89b-42d3-a456-426614174005";
const correctedId = "123e4567-e89b-42d3-a456-426614174006";
const questionId = "123e4567-e89b-42d3-a456-426614174007";
const answerId = "123e4567-e89b-42d3-a456-426614174008";
const bootstrap = { grades: [{ id: uuid, nameAr: "الصف", nameEn: "Grade" }], sections: [{ id: "123e4567-e89b-42d3-a456-426614174002", parentId: uuid, nameAr: "الشعبة", nameEn: "Section" }], classrooms: [{ id: "123e4567-e89b-42d3-a456-426614174003", parentId: "123e4567-e89b-42d3-a456-426614174002", nameAr: "الفصل", nameEn: "Classroom" }] };

function submissionRow(id: string, status: "in_progress" | "submitted" | "corrected") {
  return {
    id,
    assessmentId: uuid,
    studentId: uuid,
    enrollmentId: uuid,
    status,
    startedAt: "",
    submittedAt: status === "in_progress" ? null : "",
    student: { id: uuid, firstName: "Adam", lastName: "A", nameAr: null, nameEn: "Adam A", code: null, admissionNo: null },
    enrollment: null,
    progress: { totalQuestions: 1, answeredCount: 1, requiredAnsweredCount: 1, requiredQuestionCount: 1, pendingCorrectionCount: status === "submitted" ? 1 : 0 },
  };
}

function submissionDetail(id: string) {
  const selectedOption = { optionId: "correct", label: "Correct", labelAr: null, value: null };
  const answer = {
    id: answerId,
    questionId,
    type: "mcq_single",
    answerText: null,
    answerJson: null,
    awardedPoints: null,
    maxPoints: 4,
    correctionStatus: "pending",
    reviewerComment: null,
    reviewerCommentAr: null,
    reviewedAt: null,
    selectedOptions: [selectedOption],
    createdAt: "",
    updatedAt: "",
  };
  return {
    ...submissionRow(id, "submitted"),
    termId: "term-1",
    correctedAt: null,
    totalScore: null,
    maxScore: 4,
    assessment: null,
    answers: [answer],
    questions: [{ id: questionId, type: "mcq_single", prompt: "Question", promptAr: "سؤال", points: 4, sortOrder: 1, required: true, answer }],
  };
}

const assessmentQuestions = {
  assessmentId: uuid,
  totalQuestions: 1,
  totalPoints: 4,
  pointsMatchMaxScore: true,
  questions: [{
    id: questionId,
    assessmentId: uuid,
    promptAr: "سؤال",
    prompt: "Question",
    type: "mcq_single",
    points: 4,
    sortOrder: 1,
    required: true,
    options: [{ id: "correct", labelAr: "صحيح", label: "Correct", isCorrect: true, sortOrder: 1 }],
  }],
};

function mockApiWithRows(rows = [
  submissionRow(submittedId, "submitted"),
  submissionRow(inProgressId, "in_progress"),
  submissionRow(correctedId, "corrected"),
]) {
  api.apiGet.mockImplementation((url: string) => {
    if (url === "/grades/bootstrap") return Promise.resolve(bootstrap);
    if (url.endsWith("/questions")) return Promise.resolve(assessmentQuestions);
    if (url === `/grades/submissions/${submittedId}`) return Promise.resolve(submissionDetail(submittedId));
    return Promise.resolve({ items: rows });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  permissions.clear();
  permissions.add("grades.submissions.review");
  permissions.add("grades.questions.view");
  api.apiPut.mockResolvedValue({});
  mockApiWithRows([]);
});

describe("AssessmentSubmissionsPage", () => {
  it.each([
    { policy: "partial_without_penalty", expected: 2 },
    { policy: "partial_with_penalty", expected: 0 },
  ])("saves $policy scores and offers finalization after reloading retained results", async ({ policy, expected }) => {
    const user = userEvent.setup();
    const detail: GradeSubmissionDetail = submissionDetail(submittedId);
    detail.questions[0].type = "mcq_multi";
    detail.questions[0].answer!.type = "mcq_multi";
    detail.questions[0].answer!.selectedOptions.push({ optionId: "wrong", label: "Wrong", labelAr: null, value: null });
    const questions = structuredClone(assessmentQuestions);
    questions.questions[0].type = "mcq_multi";
    questions.questions[0].options.push(
      { id: "other", label: "Other", labelAr: "آخر", isCorrect: true, sortOrder: 2 },
      { id: "wrong", label: "Wrong", labelAr: "خطأ", isCorrect: false, sortOrder: 3 },
    );
    let savedScore: number | null = null;
    let refreshFailed = false;
    api.apiGet.mockImplementation(async (url: string) => {
      if (url === "/grades/bootstrap") return bootstrap;
      if (url.endsWith("/questions")) return questions;
      if (url === `/grades/submissions/${submittedId}`) return detail;
      if (savedScore !== null && !refreshFailed) { refreshFailed = true; throw new Error("Refresh offline"); }
      return { items: [submissionRow(submittedId, detail.status)] };
    });
    api.apiPut.mockImplementation(async (_url, payload) => {
      savedScore = payload.reviews[0].awardedPoints;
      detail.questions[0].answer!.awardedPoints = savedScore;
      detail.questions[0].answer!.correctionStatus = "corrected";
      detail.progress.pendingCorrectionCount = 0;
      return {};
    });
    api.apiPost.mockImplementation(async url => { if (url.endsWith("/review/finalize")) detail.status = "corrected"; return { status: "corrected", synced: true }; });
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "autoCorrection.open" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "autoCorrection.open" }));
    await user.click(screen.getByRole("button", { name: new RegExp(`policies.${policy}.title`) }));
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "confirm" }));
    expect(await screen.findByText("refreshFailed")).toBeInTheDocument();
    expect(savedScore).toBe(expected);
    expect(api.apiPost).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "finalize 1" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "reload" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "finalize 1" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "finalize 1" }));
    expect(await screen.findByText("result.finalized 1")).toBeInTheDocument();
    expect(api.apiPut).toHaveBeenCalledOnce();
  });
  it("auto-corrects only submitted rows in the current filtered scope", async () => {
    const user = userEvent.setup();
    mockApiWithRows();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);

    expect(await screen.findByText("pendingReviewBadge")).toBeInTheDocument();
    await user.type(screen.getByLabelText("search"), "Adam");
    await user.click(screen.getByRole("button", { name: "autoCorrection.open" }));
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      { params: expect.objectContaining({ search: "Adam" }) },
    ), { timeout: 1_000 });

    expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /policies.partial_with_penalty.title/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => expect(api.apiPut).toHaveBeenCalledWith(
      `/grades/submissions/${submittedId}/answers/review`,
      { reviews: [{ answerId, awardedPoints: 4 }] },
    ));
    expect(api.apiGet).not.toHaveBeenCalledWith(`/grades/submissions/${inProgressId}`);
    expect(api.apiGet).not.toHaveBeenCalledWith(`/grades/submissions/${correctedId}`);
  });

  it("previews all submissions with only the submitted status filter", async () => {
    const user = userEvent.setup();
    mockApiWithRows();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);

    await user.click(await screen.findByRole("button", { name: "autoCorrection.open" }));
    api.apiGet.mockClear();
    await user.click(screen.getByRole("button", { name: "scope.all" }));

    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      { params: { status: "submitted" } },
    ));
  });

  it("retries only submissions that failed in the previous run", async () => {
    const user = userEvent.setup();
    let detailRequests = 0;
    api.apiGet.mockImplementation((url: string) => {
      if (url === "/grades/bootstrap") return Promise.resolve(bootstrap);
      if (url.endsWith("/questions")) return Promise.resolve(assessmentQuestions);
      if (url === `/grades/submissions/${submittedId}`) {
        detailRequests += 1;
        return detailRequests === 1
          ? Promise.reject(new Error("Unavailable"))
          : Promise.resolve(submissionDetail(submittedId));
      }
      return Promise.resolve({ items: [submissionRow(submittedId, "submitted")] });
    });
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);

    await user.click(await screen.findByRole("button", { name: "autoCorrection.open" }));
    await user.click(screen.getByRole("button", { name: /policies.partial_with_penalty.title/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "retryFailed" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "retryFailed" }));

    await waitFor(() => expect(api.apiPut).toHaveBeenCalledTimes(1));
    expect(detailRequests).toBe(3);
  });

  it("requires both review and question permissions", async () => {
    permissions.delete("grades.questions.view");
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      expect.anything(),
    ));
    expect(screen.queryByRole("button", { name: "autoCorrection.open" })).not.toBeInTheDocument();
  });

  it("returns to assessments with the current academic context", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);

    await user.click(screen.getByRole("button", { name: "backToAssessments" }));

    expect(router.push).toHaveBeenCalledWith("/en/grades/assessments?year=year-1&term=term-1");
  });

  it("waits for typing to stop before applying the student search", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      expect.anything(),
    ));
    api.apiGet.mockClear();

    await user.type(screen.getByLabelText("search"), "Adam");
    expect(api.apiGet).not.toHaveBeenCalled();

    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      expect.objectContaining({ params: expect.objectContaining({ search: "Adam" }) }),
    ), { timeout: 1_000 });
  });

  it("enables the cascade and sends selected ids", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await user.click(await screen.findByText("allGrades")); await user.click(screen.getByText("Grade"));
    await user.click(screen.getByText("allSections")); await user.click(screen.getByText("Section"));
    await user.click(screen.getByText("allClassrooms")); await user.click(screen.getByText("Classroom"));
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(`/grades/assessments/${uuid}/submissions`, expect.objectContaining({ params: expect.objectContaining({ gradeId: uuid, sectionId: bootstrap.sections[0].id, classroomId: bootstrap.classrooms[0].id }) })));
  });

  it("keeps search, status, and list usable when bootstrap fails", async () => {
    api.apiGet.mockImplementation((url: string) => url === "/grades/bootstrap" ? Promise.reject(new Error("offline")) : Promise.resolve({ items: [] }));
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    expect(await screen.findByText("filterOptionsUnavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("search")).toBeInTheDocument();
    expect(api.apiGet).toHaveBeenCalledWith(`/grades/assessments/${uuid}/submissions`, expect.anything());
  });
});
