import type { HomeworkAssignmentStatus, HomeworkSubmissionListFilters } from "./homeworkApi.types";
import { isHomeworkAnswerReviewable } from "../utils/homeworkReview";
import { listHomeworkSubmissions } from "./homeworkService";
import { executeHomeworkAutomaticCorrection, type HomeworkCorrectionContext, type HomeworkCorrectionResult, type HomeworkCorrectionStage } from "./homeworkAutomaticCorrectionExecution";

export type HomeworkCorrectionScope = "all" | "filtered";
export interface HomeworkCorrectionProgress { processed: number; total: number }

export async function collectHomeworkCorrectionTargets(
  homeworkId: string, assignmentStatus: HomeworkAssignmentStatus,
  scope: HomeworkCorrectionScope, filters: HomeworkSubmissionListFilters,
): Promise<string[]> {
  const submissionIds = new Set<string>();
  const scopeFilters = scope === "filtered" ? { status: filters.status, search: filters.search } : {};
  let page = 1;
  while (true) {
    const submissions = await listHomeworkSubmissions(homeworkId, { ...scopeFilters, page, limit: 100 });
    for (const submission of submissions.items) {
      if (isHomeworkAnswerReviewable(assignmentStatus, submission.status)) submissionIds.add(submission.id);
    }
    const pagination = submissions.pagination;
    if (pagination.page !== page || pagination.limit <= 0) throw new Error("Submission pagination did not advance");
    if (!submissions.items.length || page * pagination.limit >= pagination.total) break;
    page += 1;
  }
  return [...submissionIds];
}

export async function runHomeworkAutomaticCorrectionBatch(args: {
  context: HomeworkCorrectionContext;
  submissionIds: readonly string[];
  retryStages?: Readonly<Record<string, HomeworkCorrectionStage>>;
  onProgress?: (progress: HomeworkCorrectionProgress) => void;
}): Promise<HomeworkCorrectionResult[]> {
  const submissionIds = [...new Set(args.submissionIds)];
  const outcomes = new Array<HomeworkCorrectionResult>(submissionIds.length);
  let cursor = 0;
  let processed = 0;
  async function runWorker() {
    while (cursor < submissionIds.length) {
      const index = cursor++;
      const submissionId = submissionIds[index];
      outcomes[index] = await executeHomeworkAutomaticCorrection(args.context, submissionId, args.retryStages?.[submissionId]);
      args.onProgress?.({ processed: ++processed, total: submissionIds.length });
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, submissionIds.length) }, runWorker));
  return outcomes;
}
