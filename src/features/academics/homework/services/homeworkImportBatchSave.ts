import { uncertainImportCreation } from "@/features/academics/shared/excel-import/importSaveErrors";
import type { HomeworkQuestionDraft } from "../utils/homeworkQuestionDraft.types";
import type { HomeworkBatchEligibleRow, HomeworkBatchPlan, HomeworkBatchResult } from "../utils/homeworkImportBatch.types";
import { homeworkBatchPayload } from "../utils/homeworkImportBatchTargets";
import { createHomeworkWithQuestions, HomeworkQuestionSaveError } from "./homeworkExcelImportSave";

interface BatchSaveRequest {
  plan: HomeworkBatchPlan;
  draft: HomeworkQuestionDraft;
  publishAt?: string | null;
  onResult: (outcome: HomeworkBatchResult) => void;
}

async function saveClassDraft(request: BatchSaveRequest, target: HomeworkBatchEligibleRow): Promise<HomeworkBatchResult> {
  try {
    const assignment = await createHomeworkWithQuestions({
      assignment: homeworkBatchPayload({ plan: request.plan, target, metadata: request.draft.metadata, publishAt: request.publishAt }),
      questions: request.draft.questions,
    });
    return { target, status: "created", assignment };
  } catch (error) {
    if (error instanceof HomeworkQuestionSaveError) return {
      target, status: "partial", homeworkId: error.homeworkId, failedQuestionIndex: error.failedQuestionIndex, error,
    };
    return { target, status: uncertainImportCreation(error) ? "unconfirmed" : "failed", error };
  }
}

export async function saveHomeworkImportBatch(request: BatchSaveRequest): Promise<HomeworkBatchResult[]> {
  const outcomes: HomeworkBatchResult[] = [];
  for (const target of request.plan.rows) {
    if (target.eligible) request.onResult({ target, status: "creating" });
    const outcome: HomeworkBatchResult = target.eligible
      ? await saveClassDraft(request, target) : { target, status: "skipped" };
    outcomes.push(outcome);
    request.onResult(outcome);
  }
  return outcomes;
}
