import { uncertainImportCreation } from "@/features/academics/shared/excel-import/importSaveErrors";
import type { HomeworkImport } from "@/features/academics/shared/excel-import/types";
import type { HomeworkBatchEligibleRow, HomeworkBatchPlan, HomeworkBatchResult } from "../utils/homeworkImportBatch.types";
import { homeworkBatchPayload } from "../utils/homeworkImportBatchTargets";
import { createHomeworkFromImport, HomeworkImportQuestionSaveError } from "./homeworkExcelImportSave";

interface BatchSaveRequest {
  plan: HomeworkBatchPlan;
  draft: HomeworkImport;
  publishAt?: string | null;
  onResult: (outcome: HomeworkBatchResult) => void;
}

async function saveClassDraft(request: BatchSaveRequest, target: HomeworkBatchEligibleRow): Promise<HomeworkBatchResult> {
  try {
    const assignment = await createHomeworkFromImport({
      assignment: homeworkBatchPayload({ plan: request.plan, target, metadata: request.draft.metadata, publishAt: request.publishAt }),
      questions: request.draft.questions,
    });
    return { target, status: "created", assignment };
  } catch (error) {
    if (error instanceof HomeworkImportQuestionSaveError) return {
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
