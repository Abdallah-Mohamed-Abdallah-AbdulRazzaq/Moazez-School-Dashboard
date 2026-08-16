export type BackendCurriculumStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CurriculumStatus = "draft" | "active" | "archived" | "unknown";
export type LessonContentType =
  "TEXT" | "FILE" | "VIDEO_LINK" | "EXTERNAL_LINK";
export type LessonContentPublicationStatus = "draft" | "published" | "archived";

export interface CurriculumScopeSummaryDto {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
}

export interface CurriculumSubjectSummaryDto extends CurriculumScopeSummaryDto {
  code: string;
  color: string;
}

export interface CurriculumLessonResponseDto {
  id: string;
  lessonId?: string;
  curriculumId: string;
  unitId: string;
  title: string;
  description: string | null;
  objectives: string[];
  sortOrder: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumUnitResponseDto {
  id: string;
  unitId?: string;
  curriculumId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  estimatedLessons: number | null;
  lessonCount: number;
  lessons: CurriculumLessonResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumResponseDto {
  id: string;
  curriculumId?: string;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description: string | null;
  status: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: CurriculumScopeSummaryDto;
  term: CurriculumScopeSummaryDto;
  grade: CurriculumScopeSummaryDto;
  subject: CurriculumSubjectSummaryDto;
  unitCount: number;
  lessonCount: number;
}

export interface CurriculumDetailResponseDto extends CurriculumResponseDto {
  units: CurriculumUnitResponseDto[];
}

export interface CurriculaListResponseDto {
  items: CurriculumResponseDto[];
}

export interface DeleteResponse {
  ok: true;
}

export type DeleteCurriculumNodeResponseDto = DeleteResponse;

export interface LessonContentFileSummaryDto {
  fileId: string;
  filename: string;
  mimeType: string;
  sizeBytes: string;
}

export interface LessonContentItemResponseDto {
  id: string;
  contentItemId?: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  type: string;
  title: string;
  bodyText: string | null;
  url: string | null;
  file: LessonContentFileSummaryDto | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  metadata: Record<string, unknown> | null;
  publicationStatus: LessonContentPublicationStatus;
  publishedAt: string | null;
  publishedByUserId: string | null;
  archivedAt: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonContentListResponseDto {
  items: LessonContentItemResponseDto[];
}

export type DeleteLessonContentItemResponseDto = DeleteResponse;

export interface CurriculumListFilters {
  academicYearId?: string;
  termId?: string;
  gradeId?: string;
  subjectId?: string;
  status?: BackendCurriculumStatus;
  search?: string;
}

export interface CreateCurriculumRequest {
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description?: string | null;
  status?: BackendCurriculumStatus;
}

export interface UpdateCurriculumRequest {
  academicYearId?: string;
  termId?: string;
  gradeId?: string;
  subjectId?: string;
  title?: string;
  description?: string | null;
  status?: BackendCurriculumStatus;
}

export interface CreateUnitRequest {
  title: string;
  description?: string | null;
  sortOrder?: number;
  estimatedLessons?: number | null;
}

export interface UpdateUnitRequest {
  title?: string;
  description?: string | null;
  sortOrder?: number;
  estimatedLessons?: number | null;
}

export interface CreateLessonRequest {
  title: string;
  description?: string | null;
  objectives?: string[];
  sortOrder?: number;
  estimatedMinutes?: number | null;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string | null;
  objectives?: string[];
  sortOrder?: number;
  estimatedMinutes?: number | null;
}

export interface ReorderRequest {
  sortOrder: number;
}

export interface CreateLessonContentRequest {
  type: LessonContentType;
  title: string;
  bodyText?: string | null;
  url?: string | null;
  fileId?: string | null;
  sortOrder?: number;
  isRequired?: boolean;
  estimatedMinutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateLessonContentRequest {
  type?: LessonContentType;
  title?: string;
  bodyText?: string | null;
  url?: string | null;
  fileId?: string | null;
  isRequired?: boolean;
  estimatedMinutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface Curriculum {
  id: string;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description: string | null;
  status: CurriculumStatus;
  rawStatus: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: CurriculumScopeSummaryDto;
  term: CurriculumScopeSummaryDto;
  grade: CurriculumScopeSummaryDto;
  subject: CurriculumSubjectSummaryDto;
  unitCount: number;
  lessonCount: number;
  units: Unit[];
}

export interface Unit {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  estimatedLessons: number | null;
  lessonCount: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  curriculumId: string;
  unitId: string;
  title: string;
  description: string | null;
  objectives: string[];
  sortOrder: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonContentItem {
  id: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  type: LessonContentType;
  title: string;
  bodyText: string | null;
  url: string | null;
  file: LessonContentFileSummaryDto | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  metadata: Record<string, unknown> | null;
  publicationStatus: LessonContentPublicationStatus;
  publishedAt: string | null;
  publishedByUserId: string | null;
  archivedAt: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
