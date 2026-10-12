import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiPatch: vi.fn(), apiDelete: vi.fn(), apiPut: vi.fn() }));
import { apiPost } from "@/lib/api";
import { createHomeworkFromImport } from "../homeworkExcelImportSave";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";

const parentId = "10000000-0000-4000-8000-000000000001";
const assignment = { academicYearId: parentId, termId: parentId, teacherSubjectAllocationId: parentId, title: "Practice", targetMode: "classroom", dueAt: "2099-01-02T12:00:00Z", totalMarks: 4, isGraded: true };
const question: AssignmentQuestion = { id: "temp-question-1", assignmentId: "draft-import", questionTextAr: "سؤال", questionTextEn: "Question", questionType: "TRUE_FALSE", correctAnswer: false, points: 2, order: 1, createdAt: "" };
const post = vi.mocked(apiPost);
beforeEach(() => post.mockReset());

it("creates one parent and saves ordered questions through the real mapper", async () => {
  post.mockResolvedValueOnce({ id: parentId }).mockResolvedValueOnce({ question: { questionId: "q-1", homeworkId: parentId, type: "TRUE_FALSE", prompt: "Question", points: 2, sortOrder: 1, options: [] } });
  expect(await createHomeworkFromImport({ assignment, questions: [question] })).toEqual({ id: parentId });
  expect(post).toHaveBeenNthCalledWith(2, `/homework/assignments/${parentId}/questions`, expect.objectContaining({ type: "TRUE_FALSE", prompt: "Question", sortOrder: 1, options: [{ text: "True", isCorrect: false, sortOrder: 0 }, { text: "False", isCorrect: true, sortOrder: 1 }] }));
});
it("retains a partial parent and stops on a second-question failure", async () => {
  const cause = new Error("Network response lost");
  post.mockResolvedValueOnce({ id: parentId }).mockResolvedValueOnce({ question: { questionId: "q-1", homeworkId: parentId, type: "TRUE_FALSE", prompt: "Question", points: 2, sortOrder: 1, options: [] } }).mockRejectedValueOnce(cause);
  await expect(createHomeworkFromImport({ assignment, questions: [question, { ...question, id: "temp-question-2", order: 2 }, { ...question, id: "temp-question-3", order: 3 }] })).rejects.toMatchObject({ homeworkId: parentId, failedQuestionIndex: 1, cause });
  expect(post).toHaveBeenCalledTimes(3);
});
it("propagates parent failure without attempting any question", async () => {
  const cause = new Error("Parent rejected");
  post.mockRejectedValueOnce(cause);
  await expect(createHomeworkFromImport({ assignment, questions: [question] })).rejects.toBe(cause);
  expect(post).toHaveBeenCalledTimes(1);
});
