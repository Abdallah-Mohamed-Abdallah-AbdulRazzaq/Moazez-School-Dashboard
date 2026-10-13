import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { HomeworkAssignmentStatus, HomeworkSubmissionAnswerUiModel, HomeworkSubmissionUiModel } from "./homeworkApi.types";
import { buildHomeworkAutomaticCorrectionPlan, isHomeworkCorrectionComplete, type HomeworkCorrectionPlan } from "../utils/homeworkAutomaticCorrection";
import { buildHomeworkSubmissionReviewRequest, calculateAnswerScoreRollup, chunkHomeworkAnswerReviews, isHomeworkAnswerReviewable, validateProspectiveAnswerScoreRollup } from "../utils/homeworkReview";
import { bulkReviewHomeworkSubmissionAnswers, fetchHomeworkSubmission, getHomeworkGradeSyncStatus, listHomeworkSubmissionAnswers, reviewHomeworkSubmission, syncHomeworkSubmissionGrade } from "./homeworkService";

export type HomeworkCorrectionStage = "answers" | "review" | "sync";
export type HomeworkCorrectionReviewMode = "review_first" | "finalize";
export interface HomeworkCorrectionContext {
  homeworkId: string;
  assignmentStatus: HomeworkAssignmentStatus;
  isGraded: boolean;
  totalMarks: number | null;
  canManage: boolean;
  canViewSyncStatus: boolean;
  canSync: boolean;
  questions: readonly AssignmentQuestion[];
  reviewMode?: HomeworkCorrectionReviewMode;
}
export interface HomeworkCorrectionResult {
  submissionId: string;
  studentName?: string;
  plan: HomeworkCorrectionPlan | null;
  reviewCompleted: boolean;
  gradeSynced: boolean;
  outcome: "complete" | "review_pending" | "manual_pending" | "skipped" | "sync_unavailable" | "failed";
  syncUnavailableReason?: "ungraded" | "permission" | "unlinked" | "locked";
  failedStage?: HomeworkCorrectionStage;
  error?: unknown;
}

async function saveAutomaticScores(context: HomeworkCorrectionContext, submissionId: string, answers: HomeworkSubmissionAnswerUiModel[], plan: HomeworkCorrectionPlan) {
  const scoreByAnswer = new Map(plan.reviews.map(review => [review.answerId, review.score]));
  const prospective = answers.map(answer => ({ ...answer, score: scoreByAnswer.get(answer.id) ?? answer.score }));
  if (validateProspectiveAnswerScoreRollup(calculateAnswerScoreRollup(prospective), context.totalMarks)) {
    throw new Error("Automatic scores exceed homework total marks");
  }
  const reviews = plan.reviews.map(review => ({
    answerId: review.answerId, score: review.score,
    feedback: answers.find(answer => answer.id === review.answerId)?.feedback,
  }));
  for (const payload of chunkHomeworkAnswerReviews(reviews)) {
    await bulkReviewHomeworkSubmissionAnswers(context.homeworkId, submissionId, payload);
  }
}

async function finishAutomaticReview(context: HomeworkCorrectionContext, submission: HomeworkSubmissionUiModel, answers: HomeworkSubmissionAnswerUiModel[]) {
  if (!isHomeworkAnswerReviewable(context.assignmentStatus, submission.status)) throw new Error("Submission is no longer reviewable");
  if (validateProspectiveAnswerScoreRollup(calculateAnswerScoreRollup(answers), context.totalMarks)) throw new Error("Reviewed scores exceed homework total marks");
  const reviewRequest = buildHomeworkSubmissionReviewRequest({
    assignmentStatus: context.assignmentStatus, submissionStatus: submission.status,
    hasQuestions: true, isGraded: context.isGraded, totalMarks: context.totalMarks,
    reviewNote: submission.reviewNote, hasUnsavedAnswerChanges: false, requiredReviewsComplete: true,
  });
  if (!("request" in reviewRequest)) throw new Error("Submission review validation failed");
  const reviewed = await reviewHomeworkSubmission(context.homeworkId, submission.id, reviewRequest.request);
  if (reviewed.status.toLowerCase() !== "reviewed") throw new Error("Submission review was not confirmed");
}

async function synchronizeAutomaticReview(context: HomeworkCorrectionContext, outcome: HomeworkCorrectionResult): Promise<HomeworkCorrectionResult> {
  if (!context.isGraded) return { ...outcome, outcome: "complete", syncUnavailableReason: "ungraded" };
  if (!context.canSync || !context.canViewSyncStatus) return { ...outcome, outcome: "sync_unavailable", syncUnavailableReason: "permission" };
  const syncStatus = await getHomeworkGradeSyncStatus(context.homeworkId);
  if (!syncStatus.linked) return { ...outcome, outcome: "sync_unavailable", syncUnavailableReason: "unlinked" };
  if (syncStatus.gradeAssessment?.isLocked) return { ...outcome, outcome: "sync_unavailable", syncUnavailableReason: "locked" };
  const synced = await syncHomeworkSubmissionGrade(context.homeworkId, outcome.submissionId);
  if (synced.submissionSync?.synced !== true) throw new Error("Grade synchronization was not confirmed");
  return { ...outcome, outcome: "complete", gradeSynced: true };
}

// Each failure retains the unfinished stage so successful writes survive retries.
export async function executeHomeworkAutomaticCorrection(
  context: HomeworkCorrectionContext, submissionId: string, resumeFrom?: HomeworkCorrectionStage,
): Promise<HomeworkCorrectionResult> {
  let stage: HomeworkCorrectionStage = resumeFrom ?? "answers";
  let outcome: HomeworkCorrectionResult = { submissionId, plan: null, reviewCompleted: false, gradeSynced: false, outcome: "skipped" };
  try {
    if (!context.canManage) throw new Error("Homework management permission is required");
    let submission = await fetchHomeworkSubmission(context.homeworkId, submissionId);
    outcome = { ...outcome, studentName: submission.studentName };
    if (["cancelled", "archived"].includes(context.assignmentStatus.toLowerCase())) return outcome;
    if (resumeFrom && submission.status.toLowerCase() === "reviewed") {
      stage = "sync";
      outcome = { ...outcome, reviewCompleted: true };
      return await synchronizeAutomaticReview(context, outcome);
    }
    if (!context.questions.length || !isHomeworkAnswerReviewable(context.assignmentStatus, submission.status)) return outcome;
    if (resumeFrom === "sync") throw new Error("Submission is no longer reviewed");
    const answers = await listHomeworkSubmissionAnswers(context.homeworkId, submissionId);
    const plan = buildHomeworkAutomaticCorrectionPlan(context.questions, answers);
    outcome = { ...outcome, plan };
    if (stage === "answers") await saveAutomaticScores(context, submissionId, answers, plan);
    stage = "review";
    const refreshedAnswers = await listHomeworkSubmissionAnswers(context.homeworkId, submissionId);
    submission = await fetchHomeworkSubmission(context.homeworkId, submissionId);
    const refreshedPlan = buildHomeworkAutomaticCorrectionPlan(context.questions, refreshedAnswers);
    outcome = { ...outcome, plan: { ...refreshedPlan, correctedCount: plan.correctedCount } };
    if (!isHomeworkCorrectionComplete(context.questions, refreshedAnswers)) return { ...outcome, outcome: "manual_pending" };
    if (context.reviewMode === "review_first") return { ...outcome, outcome: "review_pending" };
    await finishAutomaticReview(context, submission, refreshedAnswers);
    outcome = { ...outcome, reviewCompleted: true };
    stage = "sync";
    return await synchronizeAutomaticReview(context, outcome);
  } catch (error) {
    return { ...outcome, outcome: "failed", failedStage: stage, error };
  }
}
