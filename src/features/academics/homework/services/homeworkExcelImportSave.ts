import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { CreateHomeworkAssignmentRequest, HomeworkAssignmentUiModel } from "./homeworkApi.types";
import { createHomeworkAssignment, createHomeworkQuestion } from "./homeworkService";

export class HomeworkImportQuestionSaveError extends Error {
  constructor(public readonly homeworkId: string, public readonly failedQuestionIndex: number, cause: unknown) {
    super("Assignment created; an imported question could not be saved", { cause });
    this.name = "HomeworkImportQuestionSaveError";
  }
}

export async function createHomeworkFromImport(request: { assignment: CreateHomeworkAssignmentRequest; questions: AssignmentQuestion[] }): Promise<HomeworkAssignmentUiModel> {
  const createdAssignment = await createHomeworkAssignment(request.assignment);
  for (const [questionIndex, question] of request.questions.entries()) {
    try { await createHomeworkQuestion(createdAssignment.id, question); }
    catch (cause) { throw new HomeworkImportQuestionSaveError(createdAssignment.id, questionIndex, cause); }
  }
  return createdAssignment;
}

export { createHomeworkFromImport as createHomeworkWithQuestions };
export { HomeworkImportQuestionSaveError as HomeworkQuestionSaveError };
