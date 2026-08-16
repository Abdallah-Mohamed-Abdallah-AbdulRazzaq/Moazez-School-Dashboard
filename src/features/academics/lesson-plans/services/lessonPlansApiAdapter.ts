import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { LessonPlansAdapter } from "./lessonPlansAdapter";
import type * as Types from "./lessonPlansBackendTypes";
import {
  mapLessonPlanDetailDto,
  mapLessonPlanDto,
  mapLessonPlanItemDto,
  mapLessonPlanSummaryDto,
  mapLessonPlanWeeksDto,
} from "./lessonPlansMappers";

const basePath = "/academics/lesson-plans";
const queryPath = (path: string, query: object) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
};
const planAction = async (id: string, action: string) =>
  mapLessonPlanDetailDto(
    await apiPost<Types.LessonPlanDetailResponseDto>(
      `${basePath}/${id}/${action}`,
    ),
  );
const itemAction = async (
  command: Types.LessonPlanItemActionCommand,
  action: string,
) =>
  mapLessonPlanItemDto(
    await apiPost<Types.LessonPlanItemResponseDto>(
      `${basePath}/${command.lessonPlanId}/items/${command.itemId}/${action}`,
      command.payload,
    ),
  );

export const lessonPlansApiAdapter: LessonPlansAdapter = {
  async listLessonPlans(filters) {
    const response = await apiGet<Types.LessonPlansListResponseDto>(
      queryPath(basePath, filters),
    );
    return response.items.map((plan) => mapLessonPlanDto(plan));
  },
  async createLessonPlan(payload) {
    return mapLessonPlanDetailDto(
      await apiPost<Types.LessonPlanDetailResponseDto>(basePath, payload),
    );
  },
  async getLessonPlan(id) {
    return mapLessonPlanDetailDto(
      await apiGet<Types.LessonPlanDetailResponseDto>(`${basePath}/${id}`),
    );
  },
  async updateLessonPlan(id, payload) {
    return mapLessonPlanDetailDto(
      await apiPatch<Types.LessonPlanDetailResponseDto>(
        `${basePath}/${id}`,
        payload,
      ),
    );
  },
  activateLessonPlan: (id) => planAction(id, "activate"),
  archiveLessonPlan: (id) => planAction(id, "archive"),
  deleteLessonPlan: (id) => apiDelete(`${basePath}/${id}`),
  async listWeeks(query) {
    return mapLessonPlanWeeksDto(
      await apiGet<Types.LessonPlanWeeksResponseDto>(
        queryPath(`${basePath}/weeks`, query),
      ),
    );
  },
  async getSummary(query) {
    return mapLessonPlanSummaryDto(
      await apiGet<Types.LessonPlanSummaryResponseDto>(
        queryPath(`${basePath}/summary`, query),
      ),
    );
  },
  getValidation: (query) => apiGet(queryPath(`${basePath}/validation`, query)),
  autoPlan: (payload) => apiPost(`${basePath}/auto-plan`, payload),
  async moveLessonPlanItem(id, payload) {
    return mapLessonPlanItemDto(
      await apiPatch<Types.LessonPlanItemResponseDto>(
        `${basePath}/items/${id}/move`,
        payload,
      ),
    );
  },
  async createLessonPlanItem(command) {
    return mapLessonPlanItemDto(
      await apiPost<Types.LessonPlanItemResponseDto>(
        `${basePath}/${command.lessonPlanId}/items`,
        command.payload,
      ),
    );
  },
  async updateLessonPlanItem(command) {
    return mapLessonPlanItemDto(
      await apiPatch<Types.LessonPlanItemResponseDto>(
        `${basePath}/${command.lessonPlanId}/items/${command.itemId}`,
        command.payload,
      ),
    );
  },
  async reorderLessonPlanItem(command) {
    return mapLessonPlanItemDto(
      await apiPatch<Types.LessonPlanItemResponseDto>(
        `${basePath}/${command.lessonPlanId}/items/${command.itemId}/reorder`,
        command.payload,
      ),
    );
  },
  startLessonPlanItem: (command) => itemAction(command, "start"),
  completeLessonPlanItem: (command) => itemAction(command, "complete"),
  skipLessonPlanItem: (command) => itemAction(command, "skip"),
  cancelLessonPlanItem: (command) => itemAction(command, "cancel"),
  deleteLessonPlanItem: (command) =>
    apiDelete(`${basePath}/${command.lessonPlanId}/items/${command.itemId}`),
};
