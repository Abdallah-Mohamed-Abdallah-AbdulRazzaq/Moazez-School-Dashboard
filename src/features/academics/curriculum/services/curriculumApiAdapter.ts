import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CurriculumAdapter } from "./curriculumAdapter";
import type {
  CreateCurriculumRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  CurriculaListResponseDto,
  CurriculumDetailResponseDto,
  CurriculumLessonResponseDto,
  CurriculumListFilters,
  CurriculumUnitResponseDto,
  DeleteCurriculumNodeResponseDto,
  LessonContentItemResponseDto,
  LessonContentListResponseDto,
  ReorderRequest,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";
import {
  mapCurriculumDetailDto,
  mapCurriculumLessonDto,
  mapCurriculumListDto,
  mapCurriculumUnitDto,
  mapLessonContentItemDto,
  mapLessonContentListDto,
} from "./curriculumMappers";

function buildQuery(params: CurriculumListFilters): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

const contentPath = (
  basePath: string,
  curriculumId: string,
  unitId: string,
  lessonId: string,
) =>
  `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}/content`;

export const createCurriculumApiAdapter = (
  basePath: string = "/academics/curriculum",
): CurriculumAdapter => ({
  async listCurricula(filters) {
    const response = await apiGet<CurriculaListResponseDto>(
      `${basePath}${buildQuery(filters)}`,
    );
    return mapCurriculumListDto(response);
  },

  async getCurriculum(curriculumId) {
    const response = await apiGet<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}`,
    );
    return mapCurriculumDetailDto(response);
  },

  async createCurriculum(payload: CreateCurriculumRequest) {
    const response = await apiPost<CurriculumDetailResponseDto>(basePath, payload);
    return mapCurriculumDetailDto(response);
  },

  async updateCurriculum(curriculumId, payload: UpdateCurriculumRequest) {
    const response = await apiPatch<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}`,
      payload,
    );
    return mapCurriculumDetailDto(response);
  },

  async activateCurriculum(curriculumId) {
    const response = await apiPost<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}/activate`,
    );
    return mapCurriculumDetailDto(response);
  },

  async archiveCurriculum(curriculumId) {
    const response = await apiPost<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}/archive`,
    );
    return mapCurriculumDetailDto(response);
  },

  deleteCurriculum(curriculumId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(`${basePath}/${curriculumId}`);
  },

  async createUnit(curriculumId, payload: CreateUnitRequest) {
    const response = await apiPost<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  async updateUnit(curriculumId, unitId, payload: UpdateUnitRequest) {
    const response = await apiPatch<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  async reorderUnit(curriculumId, unitId, payload: ReorderRequest) {
    const response = await apiPatch<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/reorder`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  deleteUnit(curriculumId, unitId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}`,
    );
  },

  async createLesson(curriculumId, unitId, payload: CreateLessonRequest) {
    const response = await apiPost<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  async updateLesson(curriculumId, unitId, lessonId, payload: UpdateLessonRequest) {
    const response = await apiPatch<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  async reorderLesson(curriculumId, unitId, lessonId, payload: ReorderRequest) {
    const response = await apiPatch<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}/reorder`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  deleteLesson(curriculumId, unitId, lessonId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}`,
    );
  },

  async listLessonContent(curriculumId, unitId, lessonId) {
    const response = await apiGet<LessonContentListResponseDto>(
      contentPath(basePath, curriculumId, unitId, lessonId),
    );
    return mapLessonContentListDto(response);
  },

  async createLessonContent(curriculumId, unitId, lessonId, payload) {
    const response = await apiPost<LessonContentItemResponseDto>(
      contentPath(basePath, curriculumId, unitId, lessonId),
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  async getLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    const response = await apiGet<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
    );
    return mapLessonContentItemDto(response);
  },

  async updateLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload: UpdateLessonContentRequest,
  ) {
    const response = await apiPatch<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  async reorderLessonContent(curriculumId, unitId, lessonId, contentItemId, payload) {
    const response = await apiPatch<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}/reorder`,
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  async publishLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    const response = await apiPost<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}/publish`,
    );
    return mapLessonContentItemDto(response);
  },

  async unpublishLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    const response = await apiPost<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}/unpublish`,
    );
    return mapLessonContentItemDto(response);
  },

  async archiveLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    const response = await apiPost<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}/archive`,
    );
    return mapLessonContentItemDto(response);
  },

  deleteLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
    );
  },
});

export const curriculumApiAdapter = createCurriculumApiAdapter();
