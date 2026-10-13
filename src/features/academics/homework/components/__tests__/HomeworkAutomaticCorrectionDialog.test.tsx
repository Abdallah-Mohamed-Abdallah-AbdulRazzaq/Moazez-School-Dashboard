import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import HomeworkAutomaticCorrectionDialog from "../HomeworkAutomaticCorrectionDialog";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPut: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(), apiDelete: vi.fn() }));
const translate = (key: string) => key;
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => translate }));
let reviewed: boolean;
let status: string;
const onRefresh = vi.fn();
const onBusyChange = vi.fn();
function renderControls(overrides = {}) {
  return render(<HomeworkAutomaticCorrectionDialog
    context={{ homeworkId: "hw", assignmentStatus: "published", isGraded: true, totalMarks: 2, canManage: true, canViewSyncStatus: true, canSync: true }}
    selectedSubmissionId="s" canCorrectSelected hasUnsavedChanges={false} blocked={false}
    filters={{ search: "Ali" }} onRefresh={onRefresh} onBusyChange={onBusyChange} {...overrides} />);
}
beforeEach(() => {
  vi.resetAllMocks(); reviewed = false; status = "submitted";
  vi.mocked(apiGet).mockImplementation(async path => {
    if (path.endsWith("/questions")) return { items: [{ questionId: "q", homeworkId: "hw", type: "mcq_single", prompt: "Q", points: 2, sortOrder: 0, isRequired: true, createdAt: "today", updatedAt: "today", options: [{ optionId: "correct", text: "A", isCorrect: true, sortOrder: 0 }] }] } as never;
    if (path.endsWith("/answers")) return { items: [{ answerId: "answer", questionId: "q", selectedOptionIds: ["correct"], awardedPoints: reviewed ? 2 : null, reviewedAt: reviewed ? "today" : null }] } as never;
    if (path.endsWith("/grade-sync")) return { linked: true } as never;
    if (path.endsWith("/submissions")) return { items: [{ id: "s", status: "submitted" }], pagination: { page: 1, limit: 100, total: 1 } } as never;
    return { submission: { id: "s", status } } as never;
  });
  vi.mocked(apiPut).mockImplementation(async () => { reviewed = true; return { items: [] } as never; });
  vi.mocked(apiPatch).mockImplementation(async () => { status = "reviewed"; return { submission: { id: "s", status } } as never; });
  vi.mocked(apiPost).mockResolvedValue({ submissionSync: { synced: true } });
  onRefresh.mockResolvedValue(undefined);
});

describe("homework auto-correction controls", () => {
  it.each(["singleAction", "bulkAction"])("saves scores through %s and finalizes only after the reviewer chooses", async action => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(apiPut).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "finalize" })).toBeEnabled());
    expect(screen.getByText("correctedAnswers").parentElement).toHaveTextContent("1");
    expect(screen.getByText("completedReviews").parentElement).toHaveTextContent("0");
    expect(screen.getByText("syncedGrades").parentElement).toHaveTextContent("0");
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "finalize" }));
    await waitFor(() => expect(screen.getByText("syncedGrades").parentElement).toHaveTextContent("1"));
    expect(screen.getByText("completedReviews").parentElement).toHaveTextContent("1");
    expect(apiPut).toHaveBeenCalledOnce();
    expect(onRefresh).toHaveBeenCalledTimes(2);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });
  it("returns to the answers for review without finalizing or syncing saved scores", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "singleAction" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "reviewFirst" })).toBeEnabled());
    expect(screen.getByText("readyForReview").parentElement).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "reviewFirst" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(reviewed).toBe(true); expect(status).toBe("submitted");
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
  it("shows sync failure and retries only sync after review completion", async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(new Error("offline"));
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "singleAction" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "finalize" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "finalize" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "retryFailed" })).toBeEnabled());
    expect(screen.getByText("completedReviews").parentElement).toHaveTextContent("1");
    expect(screen.getByText("syncedGrades").parentElement).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: "retryFailed" }));
    await waitFor(() => expect(screen.getByText("syncedGrades").parentElement).toHaveTextContent("1"));
    expect(apiPut).toHaveBeenCalledOnce(); expect(apiPatch).toHaveBeenCalledOnce();
    expect(screen.getByText("correctedAnswers").parentElement).toHaveTextContent("1");
  });
  it("prevents correction while edits remain unsaved", () => {
    renderControls({ blocked: true, hasUnsavedChanges: true });
    expect(screen.getByText("unsavedEdits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "singleAction" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "bulkAction" })).toBeDisabled();
  });
  it("loads the bulk filtered scope before enabling confirmation", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "bulkAction" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    expect(apiGet).toHaveBeenCalledWith("/homework/assignments/hw/submissions", { params: { page: 1, limit: 100, search: "Ali" } });
    expect(apiPut).not.toHaveBeenCalled();
  });
  it("offers all submissions when filters have no eligible students", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ items: [], pagination: { page: 1, limit: 100, total: 0 } });
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "bulkAction" }));
    await waitFor(() => expect(screen.getByText("emptyTitle")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "checkAll" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled());
    expect(apiGet).toHaveBeenLastCalledWith("/homework/assignments/hw/submissions", { params: { page: 1, limit: 100 } });
    expect(screen.queryByText("emptyTitle")).not.toBeInTheDocument();
    expect(apiPut).not.toHaveBeenCalled();
  });
  it("retains correction results and offers reload after refresh failure", async () => {
    onRefresh.mockRejectedValueOnce(new Error("reload offline"));
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "singleAction" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByText("refreshFailed")).toBeInTheDocument());
    expect(screen.getByText("correctedAnswers").parentElement).toHaveTextContent("1");
    expect(screen.getByText("syncedGrades").parentElement).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "finalize" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "reload" }));
    await waitFor(() => expect(screen.queryByText("refreshFailed")).not.toBeInTheDocument());
    expect(apiPut).toHaveBeenCalledOnce();
  });
  it("shows missing-answer warnings and leaves the review open", async () => {
    const originalGet = vi.mocked(apiGet).getMockImplementation()!;
    vi.mocked(apiGet).mockImplementation(async (path, options) => path.endsWith("/answers") ? { items: [] } as never : originalGet(path, options));
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "singleAction" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(screen.getByText("missingAnswers").parentElement).toHaveTextContent("1"));
    expect(screen.getByText("pendingStudents").parentElement).toHaveTextContent("1");
    expect(apiPatch).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
});
