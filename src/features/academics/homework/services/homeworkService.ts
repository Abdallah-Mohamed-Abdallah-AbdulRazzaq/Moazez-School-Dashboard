import type { HomeworkAdapter } from "./homeworkApi.types";
import { homeworkApiAdapter } from "./homeworkApiAdapter";

let homeworkAdapter: HomeworkAdapter = homeworkApiAdapter;

export const getHomeworkAdapter = () => homeworkAdapter;

export const setHomeworkAdapter = (adapter: HomeworkAdapter) => {
  homeworkAdapter = adapter;
};

export const resetHomeworkAdapter = () => {
  homeworkAdapter = homeworkApiAdapter;
};

export const listHomeworkAssignments: HomeworkAdapter["listAssignments"] = (
  filters,
) => homeworkAdapter.listAssignments(filters);

export const createHomeworkAssignment: HomeworkAdapter["createAssignment"] = (
  payload,
) => homeworkAdapter.createAssignment(payload);

export const fetchHomeworkAssignment: HomeworkAdapter["getAssignment"] = (
  homeworkId,
) => homeworkAdapter.getAssignment(homeworkId);

export const updateHomeworkAssignment: HomeworkAdapter["updateAssignment"] = (
  homeworkId,
  payload,
) => homeworkAdapter.updateAssignment(homeworkId, payload);

export const publishHomeworkAssignment: HomeworkAdapter["publishAssignment"] = (
  homeworkId,
) => homeworkAdapter.publishAssignment(homeworkId);

export const closeHomeworkAssignment: HomeworkAdapter["closeAssignment"] = (
  homeworkId,
) => homeworkAdapter.closeAssignment(homeworkId);

export const cancelHomeworkAssignment: HomeworkAdapter["cancelAssignment"] = (
  homeworkId,
) => homeworkAdapter.cancelAssignment(homeworkId);

export const listHomeworkTargets: HomeworkAdapter["listTargets"] = (
  homeworkId,
) => homeworkAdapter.listTargets(homeworkId);

export const resolveHomeworkTargets: HomeworkAdapter["resolveTargets"] = (
  homeworkId,
) => homeworkAdapter.resolveTargets(homeworkId);

export const listHomeworkQuestions: HomeworkAdapter["listQuestions"] = (
  homeworkId,
) => homeworkAdapter.listQuestions(homeworkId);

export const createHomeworkQuestion: HomeworkAdapter["createQuestion"] = (
  homeworkId,
  question,
) => homeworkAdapter.createQuestion(homeworkId, question);

export const updateHomeworkQuestion: HomeworkAdapter["updateQuestion"] = (
  homeworkId,
  questionId,
  question,
) => homeworkAdapter.updateQuestion(homeworkId, questionId, question);

export const deleteHomeworkQuestion: HomeworkAdapter["deleteQuestion"] = (
  homeworkId,
  questionId,
) => homeworkAdapter.deleteQuestion(homeworkId, questionId);

export const reorderHomeworkQuestion: HomeworkAdapter["reorderQuestion"] = (
  homeworkId,
  questionId,
  order,
) => homeworkAdapter.reorderQuestion(homeworkId, questionId, order);

export const listHomeworkAttachments: HomeworkAdapter["listAttachments"] = (
  homeworkId,
) => homeworkAdapter.listAttachments(homeworkId);

export const createHomeworkAttachment: HomeworkAdapter["createAttachment"] =
  (homeworkId, payload) =>
    homeworkAdapter.createAttachment(homeworkId, payload);

export const updateHomeworkAttachment: HomeworkAdapter["updateAttachment"] =
  (homeworkId, attachmentId, payload) =>
    homeworkAdapter.updateAttachment(homeworkId, attachmentId, payload);

export const reorderHomeworkAttachment: HomeworkAdapter["reorderAttachment"] =
  (homeworkId, attachmentId, order) =>
    homeworkAdapter.reorderAttachment(homeworkId, attachmentId, order);

export const deleteHomeworkAttachment: HomeworkAdapter["deleteAttachment"] = (
  homeworkId,
  attachmentId,
) => homeworkAdapter.deleteAttachment(homeworkId, attachmentId);

export const listHomeworkSubmissions: HomeworkAdapter["listSubmissions"] = (
  homeworkId,
  filters,
) => homeworkAdapter.listSubmissions(homeworkId, filters);

export const fetchHomeworkSubmission: HomeworkAdapter["getSubmission"] = (
  homeworkId,
  submissionId,
) => homeworkAdapter.getSubmission(homeworkId, submissionId);

export const reviewHomeworkSubmission: HomeworkAdapter["reviewSubmission"] = (
  homeworkId,
  submissionId,
  payload,
) => homeworkAdapter.reviewSubmission(homeworkId, submissionId, payload);

export const listHomeworkSubmissionAnswers: HomeworkAdapter["listSubmissionAnswers"] =
  (homeworkId, submissionId) =>
    homeworkAdapter.listSubmissionAnswers(homeworkId, submissionId);

export const fetchHomeworkSubmissionAnswer: HomeworkAdapter["getSubmissionAnswer"] =
  (homeworkId, submissionId, answerId) =>
    homeworkAdapter.getSubmissionAnswer(homeworkId, submissionId, answerId);

export const reviewHomeworkSubmissionAnswer: HomeworkAdapter["reviewSubmissionAnswer"] =
  (homeworkId, submissionId, answerId, payload) =>
    homeworkAdapter.reviewSubmissionAnswer(
      homeworkId,
      submissionId,
      answerId,
      payload,
    );

export const bulkReviewHomeworkSubmissionAnswers: HomeworkAdapter["bulkReviewSubmissionAnswers"] =
  (homeworkId, submissionId, payload) =>
    homeworkAdapter.bulkReviewSubmissionAnswers(homeworkId, submissionId, payload);

export const listHomeworkSubmissionAttachments: HomeworkAdapter["listSubmissionAttachments"] =
  (homeworkId, submissionId) =>
    homeworkAdapter.listSubmissionAttachments(homeworkId, submissionId);

export const getHomeworkGradeSyncStatus: HomeworkAdapter["getGradeSyncStatus"] =
  (homeworkId) => homeworkAdapter.getGradeSyncStatus(homeworkId);

export const linkHomeworkGradeSync: HomeworkAdapter["linkGradeSync"] = (
  homeworkId,
  gradeAssessmentId,
) => homeworkAdapter.linkGradeSync(homeworkId, gradeAssessmentId);

export const syncHomeworkGrades: HomeworkAdapter["syncHomeworkGrades"] = (
  homeworkId,
) => homeworkAdapter.syncHomeworkGrades(homeworkId);

export const syncHomeworkSubmissionGrade: HomeworkAdapter["syncSubmissionGrade"] =
  (homeworkId, submissionId) =>
    homeworkAdapter.syncSubmissionGrade(homeworkId, submissionId);
