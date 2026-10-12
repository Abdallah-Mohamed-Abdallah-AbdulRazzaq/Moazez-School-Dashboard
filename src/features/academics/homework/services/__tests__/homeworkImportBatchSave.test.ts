import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn(), apiPatch: vi.fn(), apiDelete: vi.fn(), apiPut: vi.fn() }));
import { apiPost } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { saveHomeworkImportBatch } from "../homeworkImportBatchSave";
import { homeworkBatchPlan } from "../../utils/homeworkImportBatchTargets";
import { batchContext, batchIds } from "../../utils/__tests__/homeworkImportBatchFixtures";
import { fixtureContext, fixtureWorkbook, workbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { readImportWorkbook } from "@/features/academics/shared/excel-import/workbookReader";
import { homeworkImportFromWorkbook } from "../../utils/homeworkExcelImport";
import type { CreateHomeworkAssignmentRequest } from "../homeworkApi.types";
import type { HomeworkBatchResult } from "../../utils/homeworkImportBatch.types";

beforeEach(() => { vi.mocked(apiPost).mockReset(); });
async function importedDraft() {
  const parsed = await readImportWorkbook(await workbookFile(await fixtureWorkbook()), "assignment");
  if (parsed.kind !== "valid") throw new Error("Invalid workbook fixture");
  const imported = homeworkImportFromWorkbook(parsed.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error("Invalid question fixture");
  imported.draft.questions.push({ ...imported.draft.questions[0], id: "temp-question-2", order: 2 });
  return imported.draft;
}

it("continues through complete, partial, rejected and unknown outcomes without retrying parents", async () => {
  const context = batchContext();
  context.structure.classrooms.push({ ...context.structure.classrooms[3], id: "10000000-0000-4000-8000-000000000044", nameEn: "Room 5" });
  context.allocations.push({ ...context.allocations[3], id: "10000000-0000-4000-8000-000000000054", classroomId: context.structure.classrooms[4].id });
  context.enrollments.push({ ...context.enrollments[3], id: "enrollment-5", studentId: "student-5", classroomId: context.structure.classrooms[4].id });
  const plan = homeworkBatchPlan({ academicYearId: batchIds.year, termId: batchIds.term, subjectId: batchIds.subject, selection: { type: "school" }, context, locale: "en" });
  const parentPosts: CreateHomeworkAssignmentRequest[] = [];
  const partialQuestionPaths: string[] = [];
  const outcomes: HomeworkBatchResult[] = [];
  let parentNumber = 0;
  vi.mocked(apiPost).mockImplementation(async (path, payload) => {
    if (path === "/homework/assignments") {
      parentPosts.push(payload as CreateHomeworkAssignmentRequest);
      const index = ++parentNumber;
      if (index === 3) throw new ApiError("Allocation rejected", 409, "ALLOCATION_NOT_FOUND");
      if (index === 4) throw new ApiError("Response lost", 0, "NETWORK_ERROR");
      return { id: `parent-${index}`, teacherUserId: "current-server-teacher", teacher: { fullName: "Current Server Teacher" }, classroom: { nameEn: `Saved Room ${index}` } };
    }
    if (path.includes("parent-2")) {
      partialQuestionPaths.push(path);
      if (partialQuestionPaths.length === 2) throw new Error("Second question response lost");
    }
    return { question: { questionId: "question", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", points: 2, sortOrder: 1, options: [] } };
  });
  const results = await saveHomeworkImportBatch({ plan, draft: await importedDraft(), onResult: outcome => outcomes.push(outcome) });
  expect(results.map(result => result.status)).toEqual(["created", "partial", "failed", "unconfirmed", "created"]);
  expect(results[0]).toMatchObject({ assignment: { id: "parent-1", teacherName: "Current Server Teacher", classroomName: "Saved Room 1" } });
  expect(results[1]).toMatchObject({ homeworkId: "parent-2", failedQuestionIndex: 1 });
  expect(parentPosts.map(payload => payload.teacherSubjectAllocationId)).toEqual(plan.rows.filter(row => row.eligible).map(row => row.allocationId));
  expect(parentPosts).toHaveLength(5);
  expect(partialQuestionPaths).toHaveLength(2);
  expect(outcomes.filter(outcome => outcome.status === "creating")).toHaveLength(5);
});

it("creates only eligible rows and keeps false-answer wire values beneath each distinct parent", async () => {
  const context = batchContext();
  context.allocations = context.allocations.slice(0, 2);
  const plan = homeworkBatchPlan({ academicYearId: batchIds.year, termId: batchIds.term, subjectId: batchIds.subject, selection: { type: "school" }, context, locale: "en" });
  let parentNumber = 0;
  vi.mocked(apiPost).mockImplementation(async path => path === "/homework/assignments" ? { id: `parent-${++parentNumber}` }
    : { question: { questionId: "question", homeworkId: path.split("/")[3], type: "TRUE_FALSE", prompt: "Is 2 even?", points: 2, sortOrder: 1, options: [] } });
  const results = await saveHomeworkImportBatch({ plan, draft: await importedDraft(), onResult: () => {} });
  expect(results.map(result => result.status)).toEqual(["created", "created", "skipped", "skipped"]);
  const questionPosts = vi.mocked(apiPost).mock.calls.filter(([path]) => path.endsWith("/questions"));
  expect(questionPosts).toHaveLength(4);
  expect(questionPosts.map(([path]) => path)).toEqual(["/homework/assignments/parent-1/questions", "/homework/assignments/parent-1/questions", "/homework/assignments/parent-2/questions", "/homework/assignments/parent-2/questions"]);
  for (const [, payload] of questionPosts) expect(payload).toMatchObject({ options: [expect.objectContaining({ isCorrect: false }), expect.objectContaining({ isCorrect: true })] });
});
