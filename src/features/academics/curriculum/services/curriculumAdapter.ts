import type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  DeleteCurriculumNodeResponseDto,
  Lesson,
  LessonContentItem,
  ReorderRequest,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

export interface CurriculumAdapter {
  listCurricula(filters: CurriculumListFilters): Promise<Curriculum[]>;
  getCurriculum(curriculumId: string): Promise<Curriculum>;
  createCurriculum(payload: CreateCurriculumRequest): Promise<Curriculum>;
  updateCurriculum(
    curriculumId: string,
    payload: UpdateCurriculumRequest,
  ): Promise<Curriculum>;
  activateCurriculum(curriculumId: string): Promise<Curriculum>;
  archiveCurriculum(curriculumId: string): Promise<Curriculum>;
  deleteCurriculum(curriculumId: string): Promise<DeleteCurriculumNodeResponseDto>;
  createUnit(curriculumId: string, payload: CreateUnitRequest): Promise<Unit>;
  updateUnit(
    curriculumId: string,
    unitId: string,
    payload: UpdateUnitRequest,
  ): Promise<Unit>;
  reorderUnit(
    curriculumId: string,
    unitId: string,
    payload: ReorderRequest,
  ): Promise<Unit>;
  deleteUnit(
    curriculumId: string,
    unitId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
  createLesson(
    curriculumId: string,
    unitId: string,
    payload: CreateLessonRequest,
  ): Promise<Lesson>;
  updateLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: UpdateLessonRequest,
  ): Promise<Lesson>;
  reorderLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: ReorderRequest,
  ): Promise<Lesson>;
  deleteLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
  listLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
  ): Promise<LessonContentItem[]>;
  createLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: CreateLessonContentRequest,
  ): Promise<LessonContentItem>;
  getLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<LessonContentItem>;
  updateLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
    payload: UpdateLessonContentRequest,
  ): Promise<LessonContentItem>;
  reorderLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
    payload: ReorderRequest,
  ): Promise<LessonContentItem>;
  publishLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<LessonContentItem>;
  unpublishLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<LessonContentItem>;
  archiveLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<LessonContentItem>;
  deleteLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
}
