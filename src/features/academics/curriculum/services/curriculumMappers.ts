import type {
  CurriculaListResponseDto,
  Curriculum,
  CurriculumDetailResponseDto,
  CurriculumLessonResponseDto,
  CurriculumResponseDto,
  CurriculumStatus,
  CurriculumUnitResponseDto,
  Lesson,
  LessonContentItem,
  LessonContentItemResponseDto,
  LessonContentListResponseDto,
  LessonContentType,
  Unit,
} from "./curriculumBackendTypes";

export function mapCurriculumStatus(status: string): CurriculumStatus {
  const normalized = status.trim().toUpperCase();

  switch (normalized) {
    case "DRAFT":
      return "draft";
    case "ACTIVE":
      return "active";
    case "ARCHIVED":
      return "archived";
    default:
      return "unknown";
  }
}

export function normalizeLessonContentType(type: string): LessonContentType {
  switch (type.toUpperCase()) {
    case "TEXT":
      return "TEXT";
    case "FILE":
      return "FILE";
    case "VIDEO_LINK":
      return "VIDEO_LINK";
    case "EXTERNAL_LINK":
      return "EXTERNAL_LINK";
    default:
      throw new Error(`Unsupported lesson content type: ${type}`);
  }
}

export function mapCurriculumSummaryDto(
  dto: CurriculumResponseDto,
): Curriculum {
  return {
    id: dto.curriculumId || dto.id,
    academicYearId: dto.academicYearId,
    termId: dto.termId,
    gradeId: dto.gradeId,
    subjectId: dto.subjectId,
    title: dto.title,
    description: dto.description,
    status: mapCurriculumStatus(dto.status),
    rawStatus: dto.status,
    publishedAt: dto.publishedAt,
    archivedAt: dto.archivedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    academicYear: dto.academicYear,
    term: dto.term,
    grade: dto.grade,
    subject: dto.subject,
    unitCount: dto.unitCount,
    lessonCount: dto.lessonCount,
    units: [],
  };
}

export function mapCurriculumListDto(
  dto: CurriculaListResponseDto,
): Curriculum[] {
  return dto.items.map(mapCurriculumSummaryDto);
}

export function mapCurriculumDetailDto(
  dto: CurriculumDetailResponseDto,
): Curriculum {
  return {
    ...mapCurriculumSummaryDto(dto),
    units: dto.units.map(mapCurriculumUnitDto),
  };
}

export function mapCurriculumUnitDto(dto: CurriculumUnitResponseDto): Unit {
  return {
    id: dto.unitId || dto.id,
    curriculumId: dto.curriculumId,
    title: dto.title,
    description: dto.description,
    sortOrder: dto.sortOrder,
    estimatedLessons: dto.estimatedLessons,
    lessonCount: dto.lessonCount,
    lessons: dto.lessons.map(mapCurriculumLessonDto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapCurriculumLessonDto(
  dto: CurriculumLessonResponseDto,
): Lesson {
  return {
    id: dto.lessonId || dto.id,
    curriculumId: dto.curriculumId,
    unitId: dto.unitId,
    title: dto.title,
    description: dto.description,
    objectives: dto.objectives,
    sortOrder: dto.sortOrder,
    estimatedMinutes: dto.estimatedMinutes,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapLessonContentListDto(
  dto: LessonContentListResponseDto,
): LessonContentItem[] {
  return dto.items.map(mapLessonContentItemDto);
}

export function mapLessonContentItemDto(
  dto: LessonContentItemResponseDto,
): LessonContentItem {
  return {
    id: dto.contentItemId || dto.id,
    curriculumId: dto.curriculumId,
    unitId: dto.unitId,
    lessonId: dto.lessonId,
    type: normalizeLessonContentType(dto.type),
    title: dto.title,
    bodyText: dto.bodyText,
    url: dto.url,
    file: dto.file,
    sortOrder: dto.sortOrder,
    isRequired: dto.isRequired,
    estimatedMinutes: dto.estimatedMinutes,
    metadata: dto.metadata,
    publicationStatus: dto.publicationStatus,
    publishedAt: dto.publishedAt,
    publishedByUserId: dto.publishedByUserId,
    archivedAt: dto.archivedAt,
    archivedByUserId: dto.archivedByUserId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
