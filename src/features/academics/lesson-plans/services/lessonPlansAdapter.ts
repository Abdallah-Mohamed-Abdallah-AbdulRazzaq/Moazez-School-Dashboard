import type * as Types from "./lessonPlansBackendTypes";

export interface LessonPlansAdapter {
  listLessonPlans(
    filters: Types.LessonPlanListFilters,
  ): Promise<Types.LessonPlan[]>;
  createLessonPlan(
    payload: Types.CreateLessonPlanRequest,
  ): Promise<Types.LessonPlan>;
  getLessonPlan(lessonPlanId: string): Promise<Types.LessonPlan>;
  updateLessonPlan(
    lessonPlanId: string,
    payload: Types.UpdateLessonPlanRequest,
  ): Promise<Types.LessonPlan>;
  activateLessonPlan(lessonPlanId: string): Promise<Types.LessonPlan>;
  archiveLessonPlan(lessonPlanId: string): Promise<Types.LessonPlan>;
  deleteLessonPlan(lessonPlanId: string): Promise<Types.DeleteResponse>;
  listWeeks(query: Types.LessonPlanWeeksQuery): Promise<Types.WeekInfo[]>;
  getSummary(
    query: Types.LessonPlanSummaryQuery,
  ): Promise<Types.LessonPlanSummary>;
  getValidation(
    query: Types.LessonPlanValidationQuery,
  ): Promise<Types.LessonPlanValidationResponseDto>;
  autoPlan(
    payload: Types.AutoPlanLessonPlanRequest,
  ): Promise<Types.AutoPlanLessonPlanResponseDto>;
  moveLessonPlanItem(
    itemId: string,
    payload: Types.MoveLessonPlanItemRequestDto,
  ): Promise<Types.LessonPlanItem>;
  createLessonPlanItem(
    command: Types.CreateLessonPlanItemCommand,
  ): Promise<Types.LessonPlanItem>;
  updateLessonPlanItem(
    command: Types.UpdateLessonPlanItemCommand,
  ): Promise<Types.LessonPlanItem>;
  reorderLessonPlanItem(
    command: Types.ReorderLessonPlanItemCommand,
  ): Promise<Types.LessonPlanItem>;
  startLessonPlanItem(
    command: Types.LessonPlanItemActionCommand,
  ): Promise<Types.LessonPlanItem>;
  completeLessonPlanItem(
    command: Types.LessonPlanItemActionCommand,
  ): Promise<Types.LessonPlanItem>;
  skipLessonPlanItem(
    command: Types.LessonPlanItemActionCommand,
  ): Promise<Types.LessonPlanItem>;
  cancelLessonPlanItem(
    command: Types.LessonPlanItemActionCommand,
  ): Promise<Types.LessonPlanItem>;
  deleteLessonPlanItem(
    command: Types.DeleteLessonPlanItemCommand,
  ): Promise<Types.DeleteResponse>;
}
