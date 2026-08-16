import type { LessonPlansAdapter } from "./lessonPlansAdapter";
import { lessonPlansApiAdapter } from "./lessonPlansApiAdapter";
import type * as Types from "./lessonPlansBackendTypes";
export type * from "./lessonPlansBackendTypes";

let adapter: LessonPlansAdapter = lessonPlansApiAdapter;
export const setLessonPlansAdapter = (next: LessonPlansAdapter) => {
  adapter = next;
};
export const resetLessonPlansAdapter = () => {
  adapter = lessonPlansApiAdapter;
};
export const listLessonPlans = (filters: Types.LessonPlanListFilters) =>
  adapter.listLessonPlans(filters);
export const createLessonPlan = (payload: Types.CreateLessonPlanRequest) =>
  adapter.createLessonPlan(payload);
export const getLessonPlan = (id: string) => adapter.getLessonPlan(id);
export const updateLessonPlan = (
  id: string,
  payload: Types.UpdateLessonPlanRequest,
) => adapter.updateLessonPlan(id, payload);
export const activateLessonPlan = (id: string) =>
  adapter.activateLessonPlan(id);
export const archiveLessonPlan = (id: string) => adapter.archiveLessonPlan(id);
export const deleteLessonPlan = (id: string) => adapter.deleteLessonPlan(id);
export const listLessonPlanWeeks = (query: Types.LessonPlanWeeksQuery) =>
  adapter.listWeeks(query);
export const getLessonPlanSummary = (query: Types.LessonPlanSummaryQuery) =>
  adapter.getSummary(query);
export const getLessonPlanValidation = (
  query: Types.LessonPlanValidationQuery,
) => adapter.getValidation(query);
export const autoPlanLessons = (payload: Types.AutoPlanLessonPlanRequest) =>
  adapter.autoPlan(payload);
export const moveLessonPlanItem = (
  id: string,
  payload: Types.MoveLessonPlanItemRequestDto,
) => adapter.moveLessonPlanItem(id, payload);
export const createLessonPlanItem = (
  command: Types.CreateLessonPlanItemCommand,
) => adapter.createLessonPlanItem(command);
export const updateLessonPlanItem = (
  command: Types.UpdateLessonPlanItemCommand,
) => adapter.updateLessonPlanItem(command);
export const reorderLessonPlanItem = (
  command: Types.ReorderLessonPlanItemCommand,
) => adapter.reorderLessonPlanItem(command);
export const startLessonPlanItem = (
  command: Types.LessonPlanItemActionCommand,
) => adapter.startLessonPlanItem(command);
export const completeLessonPlanItem = (
  command: Types.LessonPlanItemActionCommand,
) => adapter.completeLessonPlanItem(command);
export const skipLessonPlanItem = (
  command: Types.LessonPlanItemActionCommand,
) => adapter.skipLessonPlanItem(command);
export const cancelLessonPlanItem = (
  command: Types.LessonPlanItemActionCommand,
) => adapter.cancelLessonPlanItem(command);
export const deleteLessonPlanItem = (
  command: Types.DeleteLessonPlanItemCommand,
) => adapter.deleteLessonPlanItem(command);
