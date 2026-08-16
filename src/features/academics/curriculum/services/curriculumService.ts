// Curriculum Service - Backend-aligned boundary
// Assignment types and helpers preserved for assignment pages

import type { CurriculumAdapter } from "./curriculumAdapter";
import { curriculumApiAdapter } from "./curriculumApiAdapter";
import type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  Lesson,
  LessonContentItem,
  ReorderRequest,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

export type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  Lesson,
  LessonContentItem,
  LessonContentPublicationStatus,
  LessonContentType,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

// ============================================================================
// ASSIGNMENT TYPES (preserved for assignment pages - out of scope for this
// backend alignment)
// ============================================================================

export interface Assignment {
  id: string;
  lessonId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  dueDate?: string;
  maxScore?: number | null;
  expectedTimeMinutes?: number;
  isPublished?: boolean;
  createdAt?: string;
}

export interface AssignmentAttachment {
  id: string;
  assignmentId: string;
  fileId?: string;
  type: "FILE" | "LINK";
  title: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order: number;
}

export interface MatchingPair {
  id: string;
  promptAr: string;
  promptEn: string;
  matchAr: string;
  matchEn: string;
  order: number;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionTextAr: string;
  questionTextEn: string;
  questionType:
    | "MCQ_SINGLE"
    | "MCQ_MULTI"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_IN_BLANK"
    | "MATCHING"
    | "MEDIA";
  points: number;
  isRequired?: boolean;
  order: number;
  options?: QuestionOption[];
  correctAnswer?: boolean;
  sampleAnswerAr?: string;
  sampleAnswerEn?: string;
  instructions?: string;
  expectedAnswer?: string;
  acceptedAnswersAr?: string[];
  acceptedAnswersEn?: string[];
  matchingPairs?: MatchingPair[];
  mediaMode?: "FILE" | "LINK";
  mediaTitle?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  createdAt: string;
}

// ============================================================================
// CURRICULUM ADAPTER (backend-aligned)
// ============================================================================

let curriculumAdapter: CurriculumAdapter = curriculumApiAdapter;

export const getCurriculumAdapter = (): CurriculumAdapter => curriculumAdapter;

export const activateCurriculumAdapter = (adapter: CurriculumAdapter) => {
  curriculumAdapter = adapter;
};

export const setCurriculumAdapter = activateCurriculumAdapter;

export const resetCurriculumAdapter = () => {
  curriculumAdapter = curriculumApiAdapter;
};

// ============================================================================
// ASSIGNMENT SERVICE FUNCTIONS (disabled until a supported backend contract exists)
// ============================================================================

const unsupportedAssignmentFeature = () =>
  new Error("Curriculum assignments are not supported by the backend contract.");

const rejectUnsupportedAssignmentFeature = <T>(): Promise<T> =>
  Promise.reject(unsupportedAssignmentFeature());

export const fetchLessonAssignments = (lessonId: string): Promise<Assignment[]> => {
  void lessonId;
  return rejectUnsupportedAssignmentFeature();
};

export const fetchAssignmentById = (
  lessonId: string,
  assignmentId: string,
): Promise<Assignment | null> => {
  void lessonId;
  void assignmentId;
  return rejectUnsupportedAssignmentFeature();
};

export const createAssignment = (
  lessonId: string,
  payload: Omit<Assignment, "id" | "lessonId" | "createdAt">,
): Promise<Assignment> => {
  void lessonId;
  void payload;
  return rejectUnsupportedAssignmentFeature();
};

export const updateAssignment = (
  assignmentId: string,
  payload: Partial<Omit<Assignment, "id" | "lessonId" | "createdAt">>,
): Promise<Assignment> => {
  void assignmentId;
  void payload;
  return rejectUnsupportedAssignmentFeature();
};

export const deleteAssignment = (assignmentId: string): Promise<void> => {
  void assignmentId;
  return rejectUnsupportedAssignmentFeature();
};

export const fetchAssignmentAttachments = (
  assignmentId: string,
): Promise<AssignmentAttachment[]> => {
  void assignmentId;
  return rejectUnsupportedAssignmentFeature();
};

export const uploadAssignmentAttachmentFile = (
  assignmentId: string,
  file: File,
): Promise<AssignmentAttachment> => {
  void assignmentId;
  void file;
  return rejectUnsupportedAssignmentFeature();
};

export const createAssignmentAttachmentLink = (
  assignmentId: string,
  payload: { title: string; url: string },
): Promise<AssignmentAttachment> => {
  void assignmentId;
  void payload;
  return rejectUnsupportedAssignmentFeature();
};

export const deleteAssignmentAttachment = (attachmentId: string): Promise<void> => {
  void attachmentId;
  return rejectUnsupportedAssignmentFeature();
};

export const fetchAssignmentQuestions = (
  assignmentId: string,
): Promise<AssignmentQuestion[]> => {
  void assignmentId;
  return rejectUnsupportedAssignmentFeature();
};

export const createAssignmentQuestion = (
  assignmentId: string,
  payload: Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">,
): Promise<AssignmentQuestion> => {
  void assignmentId;
  void payload;
  return rejectUnsupportedAssignmentFeature();
};

export const updateAssignmentQuestion = (
  questionId: string,
  payload: Partial<Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt">>,
): Promise<AssignmentQuestion> => {
  void questionId;
  void payload;
  return rejectUnsupportedAssignmentFeature();
};

export const deleteAssignmentQuestion = (questionId: string): Promise<void> => {
  void questionId;
  return rejectUnsupportedAssignmentFeature();
};

export const reorderAssignmentQuestions = (
  assignmentId: string,
  orderedQuestionIds: string[],
): Promise<void> => {
  void assignmentId;
  void orderedQuestionIds;
  return rejectUnsupportedAssignmentFeature();
};

export const bulkUpdateQuestionPoints = (
  assignmentId: string,
  updates: Array<{ questionId: string; points: number }>,
): Promise<void> => {
  void assignmentId;
  void updates;
  return rejectUnsupportedAssignmentFeature();
};

// ============================================================================
// CURRICULUM SERVICE FUNCTIONS (backend-aligned)
// ============================================================================


export const listCurricula = (filters: CurriculumListFilters): Promise<Curriculum[]> =>
  curriculumAdapter.listCurricula(filters);

export const getCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.getCurriculum(curriculumId);

export const fetchCurriculumForScope = async (
  filters: Required<
    Pick<CurriculumListFilters, "academicYearId" | "termId" | "gradeId" | "subjectId">
  >,
): Promise<Curriculum | null> => {
  const curricula = await curriculumAdapter.listCurricula(filters);
  const first = curricula[0];
  return first ? curriculumAdapter.getCurriculum(first.id) : null;
};

// Legacy method for lesson plans backwards compatibility
export const fetchCurriculum = (
  academicYearId: string,
  termId: string,
  gradeId: string,
  subjectId: string,
): Promise<Curriculum | null> =>
  fetchCurriculumForScope({
    academicYearId,
    termId,
    gradeId,
    subjectId,
  });

// Legacy method for lesson plans
export const fetchUnits = async (curriculumId: string): Promise<Unit[]> => {
  const curr = await curriculumAdapter.getCurriculum(curriculumId);
  return curr.units || [];
};

// Legacy method for lesson plans
export const fetchAllLessons = async (curriculumId: string): Promise<Lesson[]> => {
  const curr = await curriculumAdapter.getCurriculum(curriculumId);
  return (curr.units || []).flatMap((u) => u.lessons || []);
};


export const createCurriculum = (
  payload: CreateCurriculumRequest,
): Promise<Curriculum> => curriculumAdapter.createCurriculum(payload);

export const updateCurriculum = (
  curriculumId: string,
  payload: UpdateCurriculumRequest,
): Promise<Curriculum> => curriculumAdapter.updateCurriculum(curriculumId, payload);

export const activateCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.activateCurriculum(curriculumId);

export const archiveCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.archiveCurriculum(curriculumId);

export const deleteCurriculum = (curriculumId: string) =>
  curriculumAdapter.deleteCurriculum(curriculumId);

export const createUnit = (
  curriculumId: string,
  payload: CreateUnitRequest,
): Promise<Unit> => curriculumAdapter.createUnit(curriculumId, payload);

export const updateUnit = (
  curriculumId: string,
  unitId: string,
  payload: UpdateUnitRequest,
): Promise<Unit> => curriculumAdapter.updateUnit(curriculumId, unitId, payload);

export const reorderUnit = (
  curriculumId: string,
  unitId: string,
  payload: ReorderRequest,
): Promise<Unit> => curriculumAdapter.reorderUnit(curriculumId, unitId, payload);

export const deleteUnit = (curriculumId: string, unitId: string) =>
  curriculumAdapter.deleteUnit(curriculumId, unitId);

export const createLesson = (
  curriculumId: string,
  unitId: string,
  payload: CreateLessonRequest,
): Promise<Lesson> => curriculumAdapter.createLesson(curriculumId, unitId, payload);

export const updateLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: UpdateLessonRequest,
): Promise<Lesson> =>
  curriculumAdapter.updateLesson(curriculumId, unitId, lessonId, payload);

export const reorderLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: ReorderRequest,
): Promise<Lesson> =>
  curriculumAdapter.reorderLesson(curriculumId, unitId, lessonId, payload);

export const deleteLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
) => curriculumAdapter.deleteLesson(curriculumId, unitId, lessonId);

export const listLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
): Promise<LessonContentItem[]> =>
  curriculumAdapter.listLessonContent(curriculumId, unitId, lessonId);

export const createLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: CreateLessonContentRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.createLessonContent(curriculumId, unitId, lessonId, payload);

export const getLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
): Promise<LessonContentItem> =>
  curriculumAdapter.getLessonContent(curriculumId, unitId, lessonId, contentItemId);

export const updateLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
  payload: UpdateLessonContentRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.updateLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload,
  );

export const reorderLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
  payload: ReorderRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.reorderLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload,
  );

export const publishLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
): Promise<LessonContentItem> =>
  curriculumAdapter.publishLessonContent(curriculumId, unitId, lessonId, contentItemId);

export const unpublishLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
): Promise<LessonContentItem> =>
  curriculumAdapter.unpublishLessonContent(curriculumId, unitId, lessonId, contentItemId);

export const archiveLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
): Promise<LessonContentItem> =>
  curriculumAdapter.archiveLessonContent(curriculumId, unitId, lessonId, contentItemId);

export const deleteLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
) =>
  curriculumAdapter.deleteLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
  );

// ============================================================================
// HELPER (preserved)
// ============================================================================

export const calculateTermWeeks = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.ceil(diffDays / 7);
};
